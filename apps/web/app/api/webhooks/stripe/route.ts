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
  console.log(`   Status: ${subscription.status}`)
  console.log(`   Cancel at period end: ${subscription.cancel_at_period_end}`)

  if (!orgId || !tier) {
    console.error('❌ Missing org_id or tier in subscription metadata')
    console.error('   Available metadata:', subscription.metadata)
    return
  }

  // Get existing subscription to check for tier changes and custom quota overrides
  // Use maybeSingle() because subscription might not exist yet (first time subscription)
  const { data: existingSubscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('tier, custom_quota_override, email_quota, qr_links_per_product, status, cancel_at_period_end')
    .eq('org_id', orgId)
    .maybeSingle()

  if (fetchError) {
    console.error('❌ Error fetching existing subscription:', fetchError)
    throw new Error(`Failed to fetch subscription: ${fetchError.message}`)
  }

  // Detect tier changes
  const oldTier = existingSubscription?.tier as PricingTier | undefined
  const isNewSubscription = !existingSubscription
  const tierChanged = oldTier && oldTier !== tier
  const isUpgrade = tierChanged && isTierUpgrade(oldTier, tier)
  const isDowngrade = tierChanged && !isUpgrade && tier !== 'free'
  const isDowngradeToFree = tierChanged && tier === 'free'

  if (isNewSubscription) {
    console.log(`📦 New subscription created for org ${orgId}`)
  } else if (tierChanged) {
    console.log(`🔄 Tier change detected: ${oldTier} → ${tier}`)
    if (isUpgrade) {
      console.log(`⬆️  UPGRADE: ${oldTier} → ${tier}`)
    } else if (isDowngradeToFree) {
      console.log(`⬇️  DOWNGRADE TO FREE: ${oldTier} → ${tier}`)
    } else if (isDowngrade) {
      console.log(`⬇️  DOWNGRADE: ${oldTier} → ${tier}`)
    }
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
  
  // Detect cancellation state
  // When user cancels, Stripe sets:
  // - cancel_at_period_end: true
  // - canceled_at: timestamp (when cancellation was requested)
  // - status: still "active" until period ends
  const isScheduledToCancel = subscriptionToUse.cancel_at_period_end === true && subscriptionToUse.canceled_at !== null
  const isActuallyCanceled = subscriptionToUse.status === 'canceled' || subscriptionToUse.status === 'unpaid'
  const periodEnded = periodEnd <= now

  // Check if subscription was reactivated (cancel_at_period_end changed from true to false)
  const wasScheduledToCancel = existingSubscription && 
    (existingSubscription as any).cancel_at_period_end === true
  const isReactivated = wasScheduledToCancel && !subscriptionToUse.cancel_at_period_end

  console.log(`   Cancellation state:`, {
    scheduled_to_cancel: isScheduledToCancel,
    actually_canceled: isActuallyCanceled,
    cancel_at_period_end: subscriptionToUse.cancel_at_period_end,
    canceled_at: subscriptionToUse.canceled_at,
    period_ended: periodEnded,
    was_scheduled_to_cancel: wasScheduledToCancel,
    is_reactivated: isReactivated
  })

  // Determine subscription status
  // Handle different Stripe subscription statuses
  let subscriptionStatus: 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing'
  
  if (isActuallyCanceled) {
    subscriptionStatus = 'canceled'
  } else if (subscriptionToUse.status === 'past_due') {
    subscriptionStatus = 'past_due'
  } else if (subscriptionToUse.status === 'trialing') {
    subscriptionStatus = 'trialing'
  } else if (subscriptionToUse.status === 'active') {
    // Keep as active even if scheduled to cancel (until period ends)
    subscriptionStatus = 'active'
  } else {
    subscriptionStatus = 'inactive'
  }

  // Check if subscription should be downgraded to free
  // This happens when:
  // 1. Subscription is actually canceled (status = 'canceled'), OR
  // 2. Subscription is scheduled to cancel and period has ended
  const shouldDowngradeToFree = 
    (isActuallyCanceled || (isScheduledToCancel && periodEnded)) && 
    tier !== 'free'

  // Determine final tier and quotas
  let finalTier = tier
  let emailQuota = tierConfig.features.emailQuota
  let qrLinksPerProduct = tierConfig.features.qrLinksPerProduct

  if (shouldDowngradeToFree) {
    console.log(`⬇️  Auto-downgrading to free tier (period ended or canceled)`)
    finalTier = 'free'
    const freeConfig = PRICING_TIERS.free
    emailQuota = freeConfig.features.emailQuota
    qrLinksPerProduct = freeConfig.features.qrLinksPerProduct
    subscriptionStatus = 'canceled'
  }

  // Validate subscription has items
  if (!subscription.items?.data || subscription.items.data.length === 0) {
    console.error('❌ Subscription has no items:', subscription.id)
    throw new Error('Subscription missing items')
  }

  // Determine quota update strategy
  // Update quotas when:
  // 1. New subscription (first time)
  // 2. Tier changed (upgrade/downgrade) - always update quotas
  // 3. Downgrading to free - always reset quotas
  // 4. No custom override exists
  // Preserve quotas when:
  // - Custom override exists AND tier hasn't changed AND not downgrading to free
  const shouldUpdateQuotas = 
    isNewSubscription ||
    tierChanged ||
    shouldDowngradeToFree ||
    !existingSubscription?.custom_quota_override

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
    status: subscriptionStatus,
    current_period_start: periodStart.toISOString(), // Always set - validated above
    current_period_end: periodEnd.toISOString(), // Always set - validated above
    cancel_at_period_end: subscriptionToUse.cancel_at_period_end || false,
    updated_at: now.toISOString()
  }

  // Set canceled_at timestamp if subscription is scheduled to cancel or actually canceled
  if (isScheduledToCancel || isActuallyCanceled) {
    if (subscriptionToUse.canceled_at) {
      updateData.canceled_at = new Date(subscriptionToUse.canceled_at * 1000).toISOString()
    } else {
      // Fallback to current time if canceled_at is not set
      updateData.canceled_at = now.toISOString()
    }
  } else if (isReactivated) {
    // Clear canceled_at if subscription was reactivated
    updateData.canceled_at = null
    console.log(`   Subscription reactivated - clearing canceled_at`)
  }

  // Update quotas based on strategy
  if (shouldUpdateQuotas) {
    updateData.email_quota = emailQuota
    updateData.qr_links_per_product = qrLinksPerProduct
    
    // Clear custom override flag if downgrading to free or tier changed
    if (shouldDowngradeToFree || tierChanged) {
      updateData.custom_quota_override = false
      console.log(`   Quotas updated: email=${emailQuota}, qr_links=${qrLinksPerProduct}`)
    }
  } else {
    // Preserve existing quotas when custom override exists
    console.log(`   Preserving custom quota overrides (not updating quotas)`)
  }

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
    throw error
  } else {
    // Log success with appropriate message based on what happened
    if (isNewSubscription) {
      console.log(`✅ New subscription created for org ${orgId}`)
      console.log(`   Tier: ${finalTier}`)
      console.log(`   Status: ${subscriptionStatus}`)
    } else if (shouldDowngradeToFree) {
      console.log(`✅ Subscription for org ${orgId} downgraded to free tier`)
      if (isScheduledToCancel && periodEnded) {
        console.log(`   Reason: Scheduled cancellation - period ended`)
      } else if (isActuallyCanceled) {
        console.log(`   Reason: Subscription canceled`)
      }
    } else if (isReactivated) {
      console.log(`✅ Subscription reactivated for org ${orgId}`)
      console.log(`   Cancellation has been undone`)
      console.log(`   Tier: ${finalTier}`)
      console.log(`   Status: ${subscriptionStatus}`)
    } else if (isScheduledToCancel && !periodEnded) {
      console.log(`✅ Subscription scheduled to cancel for org ${orgId}`)
      console.log(`   Will cancel at period end: ${periodEnd.toISOString()}`)
      console.log(`   Current tier maintained until period ends`)
    } else if (isUpgrade) {
      console.log(`✅ Subscription upgraded for org ${orgId}`)
      console.log(`   ${oldTier} → ${finalTier}`)
      console.log(`   Quotas updated: email=${emailQuota}, qr_links=${qrLinksPerProduct}`)
    } else if (isDowngrade || isDowngradeToFree) {
      console.log(`✅ Subscription downgraded for org ${orgId}`)
      console.log(`   ${oldTier} → ${finalTier}`)
      console.log(`   Quotas updated: email=${emailQuota}, qr_links=${qrLinksPerProduct}`)
    } else {
      console.log(`✅ Subscription updated successfully for org ${orgId}`)
      console.log(`   Tier: ${finalTier} (unchanged)`)
      console.log(`   Status: ${subscriptionStatus}`)
    }
  }
}

// Helper function to determine if tier change is an upgrade
function isTierUpgrade(oldTier: PricingTier, newTier: PricingTier): boolean {
  const tierOrder: PricingTier[] = ['free', 'basic', 'premium', 'enterprise']
  const oldIndex = tierOrder.indexOf(oldTier)
  const newIndex = tierOrder.indexOf(newTier)
  
  // Invalid tiers return -1, so handle that case
  if (oldIndex === -1 || newIndex === -1) {
    return false
  }
  
  return newIndex > oldIndex
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log('📝 Handling subscription cancellation...')
  const orgId = subscription.metadata.org_id

  console.log(`   Org ID: ${orgId || 'MISSING'}`)
  console.log(`   Subscription ID: ${subscription.id}`)

  if (!orgId) {
    console.error('❌ Missing org_id in subscription metadata')
    console.error('   Available metadata:', subscription.metadata)
    return
  }

  // Get existing subscription to check current tier
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('org_id', orgId)
    .maybeSingle()

  const oldTier = existingSubscription?.tier as PricingTier | undefined
  if (oldTier) {
    console.log(`   Previous tier: ${oldTier}`)
  }

  // Get free tier quotas
  const freeConfig = PRICING_TIERS.free

  // When subscription is canceled, downgrade to free tier and reset quotas
  // Note: We keep stripe_subscription_id and stripe_price_id for reference
  // but set status to canceled and tier to free
  const cancelData = {
    tier: 'free',
    status: 'canceled' as const,
    email_quota: freeConfig.features.emailQuota,
    qr_links_per_product: freeConfig.features.qrLinksPerProduct,
    custom_quota_override: false, // Clear any admin overrides
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
    throw error
  } else {
    if (oldTier && oldTier !== 'free') {
      console.log(`✅ Subscription for org ${orgId} canceled and downgraded to free tier`)
      console.log(`   ${oldTier} → free`)
    } else {
      console.log(`✅ Subscription for org ${orgId} canceled`)
    }
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


