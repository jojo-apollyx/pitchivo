import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function checkAdminAuth() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_pitchivo_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_pitchivo_admin) {
    return { error: 'Forbidden', status: 403 }
  }

  return { user, supabase }
}

/**
 * POST /api/admin/ingredients/upsert
 * Upsert company, contact, and create signal
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    const { user, supabase } = authResult

    const body = await request.json()
    const {
      ingredientId,
      companyId, // If provided, update existing company
      companyName,
      companyDomain,
      companyCountry,
      companyCity,
      companyState,
      contactId, // If provided, update existing contact
      contactFirstName,
      contactLastName,
      contactEmail,
      contactTitle,
      interactionType,
      eventDate
    } = body

    if (!ingredientId) {
      return NextResponse.json(
        { error: 'ingredientId is required' },
        { status: 400 }
      )
    }

    if (!companyName) {
      return NextResponse.json(
        { error: 'companyName is required' },
        { status: 400 }
      )
    }

    if (!interactionType) {
      return NextResponse.json(
        { error: 'interactionType is required' },
        { status: 400 }
      )
    }

    // Verify ingredient exists
    const { data: ingredient, error: ingredientError } = await supabase
      .from('leads_market_items')
      .select('id, name')
      .eq('id', ingredientId)
      .single()

    if (ingredientError || !ingredient) {
      return NextResponse.json(
        { error: 'Ingredient not found' },
        { status: 404 }
      )
    }

    let orgId: string

    // Upsert organization
    if (companyId) {
      // Update existing company
      const normalizedName = companyName.toLowerCase().trim()
      const { error: updateError } = await supabase
        .from('leads_organizations')
        .update({
          name: companyName,
          normalized_name: normalizedName,
          domain: companyDomain || null,
          location_country: companyCountry || null,
          location_city: companyCity || null,
          location_state: companyState || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId)

      if (updateError) {
        console.error('Error updating company:', updateError)
        return NextResponse.json(
          { error: 'Failed to update company', details: updateError.message },
          { status: 500 }
        )
      }
      orgId = companyId
    } else {
      // Check if company exists by domain or normalized name
      const normalizedName = companyName.toLowerCase().trim()
      let existingOrgId: string | null = null

      if (companyDomain) {
        const { data: existingByDomain } = await supabase
          .from('leads_organizations')
          .select('id')
          .eq('domain', companyDomain.toLowerCase().trim())
          .single()
        if (existingByDomain) {
          existingOrgId = existingByDomain.id
        }
      }

      if (!existingOrgId) {
        const { data: existingByName } = await supabase
          .from('leads_organizations')
          .select('id')
          .eq('normalized_name', normalizedName)
          .single()
        if (existingByName) {
          existingOrgId = existingByName.id
        }
      }

      if (existingOrgId) {
        // Update existing company
        const { error: updateError } = await supabase
          .from('leads_organizations')
          .update({
            name: companyName,
            domain: companyDomain || null,
            location_country: companyCountry || null,
            location_city: companyCity || null,
            location_state: companyState || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingOrgId)

        if (updateError) {
          console.error('Error updating existing company:', updateError)
          return NextResponse.json(
            { error: 'Failed to update company', details: updateError.message },
            { status: 500 }
          )
        }
        orgId = existingOrgId
      } else {
        // Create new company
        const { data: newOrg, error: insertError } = await supabase
          .from('leads_organizations')
          .insert({
            name: companyName,
            normalized_name: normalizedName,
            domain: companyDomain || null,
            location_country: companyCountry || null,
            location_city: companyCity || null,
            location_state: companyState || null
          })
          .select('id')
          .single()

        if (insertError || !newOrg) {
          console.error('Error creating company:', insertError)
          return NextResponse.json(
            { error: 'Failed to create company', details: insertError?.message },
            { status: 500 }
          )
        }
        orgId = newOrg.id
      }
    }

    // Upsert contact (if provided)
    let contactIdResult: string | null = null
    if (contactEmail || contactFirstName || contactLastName) {
      if (contactId) {
        // Update existing contact
        const { error: updateError } = await supabase
          .from('leads_contacts')
          .update({
            first_name: contactFirstName || null,
            last_name: contactLastName || null,
            email: contactEmail || null,
            title: contactTitle || null,
            org_id: orgId
          })
          .eq('id', contactId)

        if (updateError) {
          console.error('Error updating contact:', updateError)
          // Don't fail the whole request, just log it
        } else {
          contactIdResult = contactId
        }
      } else if (contactEmail) {
        // Check if contact exists by email
        const { data: existingContact } = await supabase
          .from('leads_contacts')
          .select('id')
          .eq('email', contactEmail.toLowerCase().trim())
          .single()

        if (existingContact) {
          // Update existing contact
          const { error: updateError } = await supabase
            .from('leads_contacts')
            .update({
              first_name: contactFirstName || null,
              last_name: contactLastName || null,
              title: contactTitle || null,
              org_id: orgId
            })
            .eq('id', existingContact.id)

          if (!updateError) {
            contactIdResult = existingContact.id
          }
        } else {
          // Create new contact
          const { data: newContact, error: insertError } = await supabase
            .from('leads_contacts')
            .insert({
              org_id: orgId,
              first_name: contactFirstName || null,
              last_name: contactLastName || null,
              email: contactEmail ? contactEmail.toLowerCase().trim() : null,
              title: contactTitle || null
            })
            .select('id')
            .single()

          if (!insertError && newContact) {
            contactIdResult = newContact.id
          }
        }
      } else {
        // Create contact without email
        const { data: newContact, error: insertError } = await supabase
          .from('leads_contacts')
          .insert({
            org_id: orgId,
            first_name: contactFirstName || null,
            last_name: contactLastName || null,
            title: contactTitle || null
          })
          .select('id')
          .single()

        if (!insertError && newContact) {
          contactIdResult = newContact.id
        }
      }
    }

    // Create signal (check for duplicate first)
    const signalDate = eventDate || new Date().toISOString().split('T')[0]
    
    // Check if signal already exists
    const { data: existingSignal } = await supabase
      .from('leads_signals')
      .select('id')
      .eq('org_id', orgId)
      .eq('item_id', ingredientId)
      .eq('interaction_type', interactionType)
      .eq('event_date', signalDate)
      .single()

    if (existingSignal) {
      // Signal already exists, return success with existing signal
      return NextResponse.json({
        success: true,
        companyId: orgId,
        contactId: contactIdResult,
        signalId: existingSignal.id,
        message: 'Signal already exists'
      })
    }

    // Create new signal
    const { data: newSignal, error: signalError } = await supabase
      .from('leads_signals')
      .insert({
        org_id: orgId,
        item_id: ingredientId,
        contact_id: contactIdResult,
        interaction_type: interactionType,
        event_date: signalDate,
        source: 'admin_manual',
        is_verified: true,
        verified_by: user.id,
        verified_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (signalError || !newSignal) {
      console.error('Error creating signal:', signalError)
      return NextResponse.json(
        { error: 'Failed to create signal', details: signalError?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      companyId: orgId,
      contactId: contactIdResult,
      signalId: newSignal.id
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/ingredients/upsert:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

