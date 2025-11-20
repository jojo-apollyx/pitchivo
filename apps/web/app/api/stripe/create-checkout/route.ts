/**
 * Stripe Checkout Session API
 * Creates a checkout session for subscription upgrades
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PRICING_TIERS, PricingTier } from '@/lib/constants/pricing'

// Initialize Stripe
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(request: NextRequest) {
  try {
    const { tier, orgId } = await request.json()

    // Validate tier
    if (!tier || !['basic', 'premium'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "basic" or "premium"' },
        { status: 400 }
      )
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user and organization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get organization to verify membership
    const { data: org } = await supabase
      .from('organizations')
      .select('name, id')
      .eq('id', orgId)
      .single()

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get existing subscription record
    let { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, tier')
      .eq('org_id', orgId)
      .single()

    const tierConfig = PRICING_TIERS[tier as PricingTier]

    if (!tierConfig.priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this tier' },
        { status: 400 }
      )
    }

    // Validate that priceId is actually a price ID (starts with 'price_'), not a product ID
    if (!tierConfig.priceId.startsWith('price_')) {
      return NextResponse.json(
        { 
          error: `Invalid Stripe Price ID format. Expected a price ID (starts with 'price_'), but got: ${tierConfig.priceId}. Please check your NEXT_PUBLIC_STRIPE_PRICE_${tier.toUpperCase()} environment variable.` 
        },
        { status: 400 }
      )
    }

    let customerId: string | undefined = subscription?.stripe_customer_id || undefined

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          org_id: orgId,
          org_name: org.name
        }
      })
      customerId = customer.id

      // Update subscription with customer ID
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('org_id', orgId)
    }

    // If there's an existing Stripe subscription, update it instead of creating a new one
    // This ensures proper proration and prevents multiple subscriptions
    if (subscription?.stripe_subscription_id) {
      try {
        // Retrieve the existing subscription
        const existingStripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        )

        // Check if subscription is already canceled or unpaid
        // In this case, we should create a new subscription instead of updating
        if (existingStripeSubscription.status === 'canceled' || 
            existingStripeSubscription.status === 'unpaid') {
          console.log('   Subscription is canceled/unpaid, creating new subscription instead')
          // Fall through to create new checkout session
        } else if (existingStripeSubscription.status === 'past_due') {
          // Subscription has past due payment - require payment first
          return NextResponse.json(
            { error: 'Please pay your outstanding invoice before changing plans. You can manage your billing in the billing portal.' },
            { status: 400 }
          )
        } else {
          // Check if it's the same tier (no change needed)
          const currentTier = existingStripeSubscription.metadata.tier
          if (currentTier === tier) {
            return NextResponse.json(
              { error: 'Already subscribed to this tier' },
              { status: 400 }
            )
          }

          // Update the subscription to the new price
          // If subscription was scheduled to cancel, clear the cancellation
          // (user is changing plans, not canceling)
          const updateParams: Stripe.SubscriptionUpdateParams = {
            items: [{
              id: existingStripeSubscription.items.data[0].id,
              price: tierConfig.priceId,
            }],
            metadata: {
              org_id: orgId,
              tier
            },
            proration_behavior: 'always_invoice', // Always prorate on changes
          }

          // If subscription was scheduled to cancel, clear the cancellation
          // User is changing plans, so they want to continue with the new plan
          if (existingStripeSubscription.cancel_at_period_end) {
            updateParams.cancel_at_period_end = false
            console.log('   Clearing scheduled cancellation - user is changing plans')
          }

          const updatedSubscription = await stripe.subscriptions.update(
            subscription.stripe_subscription_id,
            updateParams
          )

          // Return success - the webhook will handle the database update
          return NextResponse.json({ 
            success: true,
            message: 'Subscription updated successfully',
            subscription_id: updatedSubscription.id
          })
        }
      } catch (error: any) {
        console.error('Error updating subscription:', error)
        return NextResponse.json(
          { error: `Failed to update subscription: ${error.message}` },
          { status: 500 }
        )
      }
    }

    // No existing subscription - create a new checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/pricing?canceled=true`,
      metadata: {
        org_id: orgId,
        tier
      },
      subscription_data: {
        metadata: {
          org_id: orgId,
          tier
        }
      }
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

