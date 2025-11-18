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

  // Get existing subscription to check for custom quota overrides
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('custom_quota_override, email_quota, qr_links_per_product')
    .eq('org_id', orgId)
    .single()

  const tierConfig = PRICING_TIERS[tier]
  const now = new Date()
  const periodEnd = new Date(subscription.current_period_end * 1000)
  
  // Check if subscription period has ended and should be downgraded to free
  const shouldDowngradeToFree = 
    subscription.cancel_at_period_end && 
    periodEnd <= now &&
    tier !== 'free'

  // Determine final tier and quotas
  let finalTier = tier
  let emailQuota = tierConfig.features.emailQuota
  let qrLinksPerProduct = tierConfig.features.qrLinksPerProduct

  if (shouldDowngradeToFree) {
    finalTier = 'free'
    const freeConfig = PRICING_TIERS.free
    emailQuota = freeConfig.features.emailQuota
    qrLinksPerProduct = freeConfig.features.qrLinksPerProduct
  }

  // Build update object
  const updateData: any = {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    stripe_price_id: subscription.items.data[0].price.id,
    tier: finalTier,
    status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : 'inactive',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: now.toISOString()
  }

  // Only update quotas if:
  // 1. No custom override exists, OR
  // 2. Downgrading to free (always reset to free tier quotas)
  if (!existingSubscription?.custom_quota_override || shouldDowngradeToFree) {
    updateData.email_quota = emailQuota
    updateData.qr_links_per_product = qrLinksPerProduct
    
    // Clear custom override flag if downgrading to free
    if (shouldDowngradeToFree) {
      updateData.custom_quota_override = false
    }
  }
  // If custom override exists and not downgrading, preserve existing quotas

  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('org_id', orgId)

  if (error) {
    console.error('Error updating subscription:', error)
  } else if (shouldDowngradeToFree) {
    console.log(`Subscription for org ${orgId} downgraded to free tier after period end`)
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const orgId = subscription.metadata.org_id

  if (!orgId) {
    console.error('Missing org_id in subscription metadata')
    return
  }

  // Get free tier quotas
  const freeConfig = PRICING_TIERS.free

  // When subscription is canceled, downgrade to free tier and reset quotas
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'canceled',
      email_quota: freeConfig.features.emailQuota,
      qr_links_per_product: freeConfig.features.qrLinksPerProduct,
      custom_quota_override: false, // Clear any admin overrides
      stripe_subscription_id: null, // Clear Stripe subscription ID
      stripe_price_id: null, // Clear Stripe price ID
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('org_id', orgId)

  if (error) {
    console.error('Error canceling subscription:', error)
  } else {
    console.log(`Subscription for org ${orgId} canceled and downgraded to free tier`)
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

