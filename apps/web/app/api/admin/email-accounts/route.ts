/**
 * Email Accounts API
 * GET /api/admin/email-accounts - List all email accounts
 * POST /api/admin/email-accounts - Create new email account
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSmartleadClient } from '@/lib/smartlead'

async function checkAdminAuth() {
  const supabase = await createClient()
  
  // Check authentication and admin status
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_pitchivo_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_pitchivo_admin) {
    return { error: 'Forbidden', status: 403 }
  }

  return { user }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Get email accounts from Smartlead
    console.log(`[Email Accounts API] ============================================`);
    console.log(`[Email Accounts API] 🚀 CALLING SMARTLEAD API: getAllEmailAccounts`);
    console.log(`[Email Accounts API] User: ${authResult.user?.id || 'unknown'}`);
    console.log(`[Email Accounts API] ============================================`);

    const smartlead = createSmartleadClient()
    const result = await smartlead.getAllEmailAccounts()

    console.log(`[Email Accounts API] Smartlead API response:`, {
      success: result.success,
      accounts_count: result.data?.length || 0,
      error: result.error,
    });

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch email accounts')
    }

    return NextResponse.json({
      success: true,
      accounts: result.data || []
    })

  } catch (error) {
    console.error('[Email Accounts API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch email accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['from_name', 'from_email', 'user_name', 'password', 'smtp_host', 'smtp_port', 'imap_host', 'imap_port']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create email account in Smartlead
    console.log(`[Email Accounts API] ============================================`);
    console.log(`[Email Accounts API] 🚀 CALLING SMARTLEAD API: saveEmailAccount`);
    console.log(`[Email Accounts API] Email: ${body.from_email}`);
    console.log(`[Email Accounts API] From Name: ${body.from_name}`);
    console.log(`[Email Accounts API] SMTP Host: ${body.smtp_host}:${body.smtp_port}`);
    console.log(`[Email Accounts API] Max Emails/Day: ${body.max_email_per_day}`);
    console.log(`[Email Accounts API] Warmup Enabled: ${body.warmup_enabled}`);
    console.log(`[Email Accounts API] User: ${authResult.user?.id || 'unknown'}`);
    console.log(`[Email Accounts API] ============================================`);

    const smartlead = createSmartleadClient()
    const result = await smartlead.saveEmailAccount({
      id: null, // null means create new account
      from_name: body.from_name,
      from_email: body.from_email,
      user_name: body.user_name,
      password: body.password,
      smtp_host: body.smtp_host,
      smtp_port: parseInt(body.smtp_port),
      imap_host: body.imap_host,
      imap_port: parseInt(body.imap_port),
      max_email_per_day: body.max_email_per_day || 100,
      warmup_enabled: body.warmup_enabled || false,
      client_id: null,
    })

    console.log(`[Email Accounts API] Smartlead API response:`, {
      success: result.success,
      account_id: result.data?.emailAccountId,
      warmup_key: result.data?.warmupKey,
      error: result.error,
    });

    if (!result.success) {
      console.error(`[Email Accounts API] ❌ FAILED to create email account in Smartlead:`, result.error);
      const errorMessage = result.error?.message || result.error?.error || 'Failed to create email account'
      return NextResponse.json(
        { 
          error: errorMessage,
          details: result.error
        },
        { status: 400 }
      )
    }

    console.log(`[Email Accounts API] ✅ Email account created successfully in Smartlead`);
    console.log(`[Email Accounts API] Account ID: ${result.data?.emailAccountId}`);

    return NextResponse.json({
      success: true,
      message: result.data?.message || 'Email account created successfully',
      accountId: result.data?.emailAccountId,
      warmupKey: result.data?.warmupKey,
    })

  } catch (error) {
    console.error('[Email Accounts API] Error creating account:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create email account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

