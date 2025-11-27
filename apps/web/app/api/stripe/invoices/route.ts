/**
 * Stripe Invoices API
 * Fetches invoices for the organization's Stripe customer
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
      return NextResponse.json({ invoices: [] })
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: subscription.stripe_customer_id,
      limit: 100, // Get last 100 invoices
    })

    // Format invoices for frontend
    const formattedInvoices = invoices.data.map((invoice) => {
      // Use amount_paid if available, otherwise use amount_due
      // amount_paid is null for unpaid invoices, amount_due is the total amount
      const amount = invoice.amount_paid !== null ? invoice.amount_paid : invoice.amount_due

      return {
        id: invoice.id,
        number: invoice.number,
        amount: amount,
        currency: invoice.currency,
        status: invoice.status,
        created: invoice.created,
        dueDate: invoice.due_date,
        periodStart: invoice.period_start,
        periodEnd: invoice.period_end,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        description: invoice.description || invoice.lines.data[0]?.description || 'Subscription',
      }
    })

    return NextResponse.json({ invoices: formattedInvoices })

  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

