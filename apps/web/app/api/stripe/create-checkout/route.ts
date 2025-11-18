/**
 * Stripe Checkout Session API
 * Creates a checkout session for subscription upgrades
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PRICING_TIERS, PricingTier } from '@/lib/constants/pricing'

// Initialize Stripe (you'll need to install: npm install stripe)
// Uncomment when Stripe is set up:
// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-11-20.acacia'
// })

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

    // Get or create subscription record
    let { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', orgId)
      .single()

    const tierConfig = PRICING_TIERS[tier as PricingTier]

    // TODO: When Stripe is configured, uncomment this:
    /*
    let customerId = subscription?.stripe_customer_id

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

    // Create checkout session
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
    */

    // Temporary response when Stripe is not configured
    return NextResponse.json({
      error: 'Stripe checkout not configured yet',
      message: `Would create checkout for ${tierConfig.name} plan at ${tierConfig.price}/month`,
      tier,
      price: tierConfig.price
    }, { status: 501 })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

