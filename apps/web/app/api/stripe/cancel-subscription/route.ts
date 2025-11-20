/**
 * Cancel Subscription API
 * Cancels a subscription at the end of the billing period
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Initialize Stripe
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function POST(request: NextRequest) {
  try {
    const { orgId } = await request.json()

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

    // Get subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, tier, status')
      .eq('org_id', orgId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // If already on free tier, nothing to cancel
    if (subscription.tier === 'free') {
      return NextResponse.json(
        { error: 'Already on free plan' },
        { status: 400 }
      )
    }

    // If no Stripe subscription ID, just update database
    if (!subscription.stripe_subscription_id) {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          tier: 'free',
          status: 'canceled',
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('org_id', orgId)

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to cancel subscription' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    }

    // Cancel the Stripe subscription at period end
    try {
      const canceledSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true
        }
      )

      // Update database to reflect cancellation
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('org_id', orgId)

      if (updateError) {
        console.error('Error updating subscription in database:', updateError)
        // Don't fail the request - Stripe cancellation succeeded
      }

      return NextResponse.json({ 
        success: true,
        cancel_at_period_end: canceledSubscription.cancel_at_period_end,
        current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString()
      })
    } catch (stripeError: any) {
      console.error('Error canceling subscription in Stripe:', stripeError)
      return NextResponse.json(
        { error: `Failed to cancel subscription: ${stripeError.message}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}

