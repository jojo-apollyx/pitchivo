/**
 * Stripe Webhook Handler
 * Handles Stripe events (subscriptions, payments, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRICING_TIERS, PricingTier } from '@/lib/constants/pricing'

// Initialize Stripe
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

// Use service role for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('============================================')
    console.log('🔔 STRIPE WEBHOOK RECEIVED')
    console.log('Timestamp:', new Date().toISOString())
    
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    console.log('Headers:', {
      'stripe-signature': signature ? 'Present' : 'Missing',
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent'),
    })

    if (!signature) {
      console.error('❌ Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
      console.log('✅ Webhook signature verified')
      console.log(`📦 Event Type: ${event.type}`)
      console.log(`🆔 Event ID: ${event.id}`)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    console.log(`🔄 Processing event: ${event.type}`)
    
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`📋 Subscription ID: ${subscription.id}`)
        console.log(`👤 Customer ID: ${subscription.customer}`)
        console.log(`📊 Status: ${subscription.status}`)
        console.log(`🏷️  Metadata:`, subscription.metadata)
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log(`📋 Subscription ID: ${subscription.id}`)
        console.log(`👤 Customer ID: ${subscription.customer}`)
        console.log(`🏷️  Metadata:`, subscription.metadata)
        await handleSubscriptionCanceled(subscription)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`🧾 Invoice ID: ${invoice.id}`)
        console.log(`👤 Customer ID: ${invoice.customer}`)
        console.log(`💰 Amount: ${invoice.amount_paid / 100} ${invoice.currency}`)
        await handleInvoicePaid(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log(`🧾 Invoice ID: ${invoice.id}`)
        console.log(`👤 Customer ID: ${invoice.customer}`)
        console.log(`⚠️  Payment failed for invoice`)
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`)
    }

    const duration = Date.now() - startTime
    console.log(`⏱️  Processing time: ${duration}ms`)
    console.log('✅ WEBHOOK PROCESSING COMPLETE')
    console.log('============================================\n')

    return NextResponse.json({ received: true })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error('============================================')
    console.error('❌ ERROR PROCESSING STRIPE WEBHOOK')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
    console.error(`⏱️  Failed after: ${duration}ms`)
    console.error('============================================\n')
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('📝 Handling subscription update...')
  const orgId = subscription.metadata.org_id
  const tier = subscription.metadata.tier as PricingTier

  console.log(`   Org ID: ${orgId || 'MISSING'}`)
  console.log(`   Tier: ${tier || 'MISSING'}`)

  if (!orgId || !tier) {
    console.error('❌ Missing org_id or tier in subscription metadata')
    console.error('   Available metadata:', subscription.metadata)
    return
  }

  // Get existing subscription to check for custom quota overrides
  // Use maybeSingle() because subscription might not exist yet (first time subscription)
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('custom_quota_override, email_quota, qr_links_per_product')
    .eq('org_id', orgId)
    .maybeSingle()

  if (fetchError) {
    console.error('❌ Error fetching existing subscription:', fetchError)
    throw new Error(`Failed to fetch subscription: ${fetchError.message}`)
  }

  const tierConfig = PRICING_TIERS[tier]
  const now = new Date()
  
  // Get period dates - Stripe timestamps are in seconds, convert to milliseconds for Date
  // If missing from webhook payload, fetch full subscription from Stripe API
  let periodStartTimestamp = subscription.current_period_start
  let periodEndTimestamp = subscription.current_period_end
  let subscriptionToUse = subscription

  // If period dates are missing, fetch the full subscription from Stripe
  if (!periodStartTimestamp || !periodEndTimestamp) {
    console.warn('⚠️  Period dates missing from webhook payload, fetching from Stripe API...', {
      subscription_id: subscription.id,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end
    })
    
    try {
      const fullSubscription = await stripe.subscriptions.retrieve(subscription.id)
      periodStartTimestamp = fullSubscription.current_period_start
      periodEndTimestamp = fullSubscription.current_period_end
      subscriptionToUse = fullSubscription
      
      console.log('✅ Retrieved period dates from Stripe API:', {
        current_period_start: periodStartTimestamp,
        current_period_end: periodEndTimestamp
      })
    } catch (error) {
      console.error('❌ Failed to fetch subscription from Stripe API:', error)
      // Continue with what we have - will log warning below
    }
  }

  // Convert to Date objects if timestamps exist
  let periodStart: Date | null = null
  let periodEnd: Date | null = null

  if (periodStartTimestamp) {
    periodStart = new Date(periodStartTimestamp * 1000)
    if (isNaN(periodStart.getTime())) {
      console.error('❌ Invalid period_start timestamp:', periodStartTimestamp)
      periodStart = null
    }
  }

  if (periodEndTimestamp) {
    periodEnd = new Date(periodEndTimestamp * 1000)
    if (isNaN(periodEnd.getTime())) {
      console.error('❌ Invalid period_end timestamp:', periodEndTimestamp)
      periodEnd = null
    }
  }

  // Period dates are required for billing tracking - fail if still missing
  if (!periodStart || !periodEnd) {
    console.error('❌ Missing period dates after fetching from Stripe:', {
      subscription_id: subscription.id,
      current_period_start: periodStartTimestamp,
      current_period_end: periodEndTimestamp,
      status: subscription.status
    })
    throw new Error('Subscription missing required period dates - cannot track billing period')
  }
  
  // Check if subscription period has ended and should be downgraded to free
  const shouldDowngradeToFree = 
    subscriptionToUse.cancel_at_period_end && 
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

  // Validate subscription has items
  if (!subscription.items?.data || subscription.items.data.length === 0) {
    console.error('❌ Subscription has no items:', subscription.id)
    throw new Error('Subscription missing items')
  }

  // Build update/upsert object
  // Use subscriptionToUse which may have been fetched from Stripe API
  const updateData: any = {
    org_id: orgId, // Required for upsert
    stripe_subscription_id: subscriptionToUse.id,
    stripe_customer_id: typeof subscriptionToUse.customer === 'string' 
      ? subscriptionToUse.customer 
      : subscriptionToUse.customer?.id || null,
    stripe_price_id: subscriptionToUse.items.data[0].price.id,
    tier: finalTier,
    status: subscriptionToUse.status === 'active' || subscriptionToUse.status === 'trialing' ? 'active' : 'inactive',
    current_period_start: periodStart.toISOString(), // Always set - validated above
    current_period_end: periodEnd.toISOString(), // Always set - validated above
    cancel_at_period_end: subscriptionToUse.cancel_at_period_end || false,
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

  console.log('💾 Upserting subscription in database...')
  console.log(`   Subscription exists: ${!!existingSubscription}`)
  console.log('   Update data:', JSON.stringify(updateData, null, 2))
  
  // Use upsert to handle both create and update cases
  // The unique constraint on org_id will ensure we update if exists, create if not
  const { error } = await supabase
    .from('subscriptions')
    .upsert(updateData, {
      onConflict: 'org_id'
    })

  if (error) {
    console.error('❌ Error updating subscription:', error)
    console.error('   Error details:', JSON.stringify(error, null, 2))
  } else {
    if (shouldDowngradeToFree) {
      console.log(`✅ Subscription for org ${orgId} downgraded to free tier after period end`)
    } else {
      console.log(`✅ Subscription updated successfully for org ${orgId}`)
      console.log(`   New tier: ${finalTier}`)
      console.log(`   New status: ${updateData.status}`)
    }
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log('📝 Handling subscription cancellation...')
  const orgId = subscription.metadata.org_id

  console.log(`   Org ID: ${orgId || 'MISSING'}`)

  if (!orgId) {
    console.error('❌ Missing org_id in subscription metadata')
    console.error('   Available metadata:', subscription.metadata)
    return
  }

  // Get free tier quotas
  const freeConfig = PRICING_TIERS.free

  // When subscription is canceled, downgrade to free tier and reset quotas
  const cancelData = {
    tier: 'free',
    status: 'canceled',
    email_quota: freeConfig.features.emailQuota,
    qr_links_per_product: freeConfig.features.qrLinksPerProduct,
    custom_quota_override: false, // Clear any admin overrides
    stripe_subscription_id: null, // Clear Stripe subscription ID
    stripe_price_id: null, // Clear Stripe price ID
    canceled_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  console.log('💾 Canceling subscription in database...')
  console.log('   Cancel data:', JSON.stringify(cancelData, null, 2))
  
  const { error } = await supabase
    .from('subscriptions')
    .update(cancelData)
    .eq('org_id', orgId)

  if (error) {
    console.error('❌ Error canceling subscription:', error)
    console.error('   Error details:', JSON.stringify(error, null, 2))
  } else {
    console.log(`✅ Subscription for org ${orgId} canceled and downgraded to free tier`)
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('📝 Handling invoice paid...')
  // Get org_id from subscription metadata
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id

  if (!subscriptionId) {
    console.warn('⚠️  No subscription ID found in invoice')
    return
  }

  console.log(`   Subscription ID: ${subscriptionId}`)

  // Fetch subscription to get metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const orgId = subscription.metadata.org_id

  console.log(`   Org ID: ${orgId || 'MISSING'}`)

  if (!orgId) {
    console.error('❌ No org_id found in subscription metadata')
    return
  }

  console.log('💾 Updating subscription status to active...')
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('org_id', orgId)

  if (error) {
    console.error('❌ Error updating subscription after payment:', error)
    console.error('   Error details:', JSON.stringify(error, null, 2))
  } else {
    console.log(`✅ Subscription status updated to active for org ${orgId}`)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('📝 Handling payment failed...')
  // Get org_id from subscription metadata
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id

  if (!subscriptionId) {
    console.warn('⚠️  No subscription ID found in invoice')
    return
  }

  console.log(`   Subscription ID: ${subscriptionId}`)

  // Fetch subscription to get metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const orgId = subscription.metadata.org_id

  console.log(`   Org ID: ${orgId || 'MISSING'}`)

  if (!orgId) {
    console.error('❌ No org_id found in subscription metadata')
    return
  }

  console.log('💾 Updating subscription status to past_due...')
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('org_id', orgId)

  if (error) {
    console.error('❌ Error updating subscription after failed payment:', error)
    console.error('   Error details:', JSON.stringify(error, null, 2))
  } else {
    console.log(`✅ Subscription status updated to past_due for org ${orgId}`)
  }
}

