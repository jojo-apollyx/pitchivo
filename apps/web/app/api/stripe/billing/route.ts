/**
 * Stripe Billing Information API
 * Fetches billing information (payment methods, billing address) for the organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Initialize Stripe
import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get subscription with Stripe customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('org_id', profile.organization_id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({
        customer: null,
        paymentMethods: [],
        defaultPaymentMethod: null,
      })
    }

    // Fetch customer from Stripe
    const customer = await stripe.customers.retrieve(subscription.stripe_customer_id)

    // Check if customer is deleted (returns DeletedCustomer object)
    if ('deleted' in customer && customer.deleted) {
      return NextResponse.json({
        customer: null,
        paymentMethods: [],
        defaultPaymentMethod: null,
      })
    }

    // Fetch payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: subscription.stripe_customer_id,
      type: 'card',
    })

    // Get default payment method ID (can be string or PaymentMethod object if expanded)
    const defaultPaymentMethodId = typeof customer.invoice_settings?.default_payment_method === 'string'
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id || null

    // Format payment methods
    const formattedPaymentMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      } : null,
      isDefault: pm.id === defaultPaymentMethodId,
    }))

    // Get default payment method
    const defaultPaymentMethod = defaultPaymentMethodId
      ? formattedPaymentMethods.find((pm) => pm.id === defaultPaymentMethodId) || null
      : null

    // Format customer data
    const customerData = {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      address: customer.address ? {
        line1: customer.address.line1,
        line2: customer.address.line2,
        city: customer.address.city,
        state: customer.address.state,
        postalCode: customer.address.postal_code,
        country: customer.address.country,
      } : null,
      tax: customer.tax ? {
        automatic_tax: customer.tax.automatic_tax,
      } : null,
    }

    return NextResponse.json({
      customer: customerData,
      paymentMethods: formattedPaymentMethods,
      defaultPaymentMethod,
    })

  } catch (error) {
    console.error('Error fetching billing information:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    )
  }
}

