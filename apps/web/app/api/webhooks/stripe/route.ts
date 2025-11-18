/**
 * Stripe Webhook Handler
 * Handles Stripe events (subscriptions, payments, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRICING_TIERS, PricingTier } from '@/lib/constants/pricing'

// Initialize Stripe (you'll need to install: npm install stripe)
// Uncomment when Stripe is set up:
// import Stripe from 'stripe'
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2024-11-20.acacia'
// })

// Use service role for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // TODO: When Stripe is configured, uncomment this:
    /*
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCanceled(subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
    */

    // Temporary response when Stripe is not configured
    return NextResponse.json({
      error: 'Stripe webhooks not configured yet',
      message: 'Would process Stripe webhook events'
    }, { status: 501 })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// TODO: Uncomment when Stripe is configured
/*
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata.org_id
  const tier = subscription.metadata.tier as PricingTier

  if (!orgId || !tier) {
    console.error('Missing org_id or tier in subscription metadata')
    return
  }

  const tierConfig = PRICING_TIERS[tier]
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      stripe_price_id: subscription.items.data[0].price.id,
      tier,
      status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'inactive',
      email_quota: tierConfig.features.emailQuota,
      qr_links_per_product: tierConfig.features.qrLinksPerProduct,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('org_id', orgId)

  if (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata.org_id

  if (!orgId) {
    console.error('Missing org_id in subscription metadata')
    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('org_id', orgId)

  if (error) {
    console.error('Error canceling subscription:', error)
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const orgId = invoice.subscription_metadata?.org_id

  if (!orgId) return

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('org_id', orgId)

  if (error) {
    console.error('Error updating subscription after payment:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const orgId = invoice.subscription_metadata?.org_id

  if (!orgId) return

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('org_id', orgId)

  if (error) {
    console.error('Error updating subscription after failed payment:', error)
  }
}
*/

