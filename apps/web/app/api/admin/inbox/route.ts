import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSmartleadClient } from '@/lib/smartlead/client'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    const searchParams = request.nextUrl.searchParams
    // Smartlead API has a maximum limit of 20
    const requestedLimit = parseInt(searchParams.get('limit') || '20')
    const limit = Math.min(requestedLimit, 20)
    const offset = parseInt(searchParams.get('offset') || '0')
    const categoryId = searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : undefined
    const categoryIds = searchParams.get('category_ids')?.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    const campaignId = searchParams.get('campaign_id') ? parseInt(searchParams.get('campaign_id')!) : undefined
    const campaignIds = searchParams.get('campaign_ids')?.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    const clientId = searchParams.get('client_id') ? parseInt(searchParams.get('client_id')!) : undefined
    const clientIds = searchParams.get('client_ids')?.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    const emailAccountId = searchParams.get('email_account_id') ? parseInt(searchParams.get('email_account_id')!) : undefined
    const emailAccountIds = searchParams.get('email_account_ids')?.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
    const status = searchParams.get('status') as 'UNREAD' | 'READ' | 'SNOOZED' | undefined
    const search = searchParams.get('search') || undefined
    const sortBy = searchParams.get('sortBy') || 'REPLY_TIME_DESC'

    const smartlead = createSmartleadClient()

    // Build filters object according to Smartlead API spec
    // API Reference: https://api.smartlead.ai/reference/fetch-inbox-replies
    const filters: any = {}
    
    if (search) {
      filters.search = search
    }
    
    if (categoryId || categoryIds) {
      filters.leadCategories = {}
      if (categoryIds && categoryIds.length > 0) {
        filters.leadCategories.categoryIdsIn = categoryIds
      } else if (categoryId) {
        filters.leadCategories.categoryIdsIn = [categoryId]
      }
    }
    
    if (campaignIds && campaignIds.length > 0) {
      filters.campaignId = campaignIds
    } else if (campaignId) {
      filters.campaignId = [campaignId]
    }
    
    if (emailAccountIds && emailAccountIds.length > 0) {
      filters.emailAccountId = emailAccountIds
    } else if (emailAccountId) {
      filters.emailAccountId = [emailAccountId]
    }
    
    if (clientIds && clientIds.length > 0) {
      filters.campaignClientId = clientIds
    } else if (clientId) {
      filters.campaignClientId = [clientId]
    }
    
    // If status is UNREAD, use the unread-replies endpoint instead
    if (status === 'UNREAD') {
      const result = await smartlead.fetchUnreadReplies({
        offset,
        limit,
        fetch_message_history: true
      })
      
      if (!result.success) {
        console.error('[Admin Inbox API] Smartlead API error:', result.error)
        return NextResponse.json(
          { error: result.error?.message || 'Failed to fetch unread replies from Smartlead' },
          { status: result.error?.status_code || 500 }
        )
      }
      
      // Transform response same way as inbox-replies
      const apiResponse = result.data
      const leads = (apiResponse?.ok && apiResponse?.data) ? apiResponse.data : (Array.isArray(result.data) ? result.data : [])
      let messages: any[] = []

      leads.forEach((lead: any) => {
        const emailHistory = lead.email_history || []
        
        emailHistory.forEach((email: any) => {
          // Include both SENT and REPLY messages for full thread context
          messages.push({
            reply_id: email.stats_id,
            lead_id: lead.email_lead_id?.toString(),
            lead_email: lead.lead_email,
            campaign_id: lead.email_campaign_id?.toString(),
            first_name: lead.lead_first_name,
            last_name: lead.lead_last_name,
            email: lead.lead_email,
            company_name: null,
            subject: email.subject || '',
            email_body: email.email_body,
            time: email.time,
            received_at: email.time,
            is_read: email.type === 'REPLY' ? !lead.has_new_unread_email : true,
            type: email.type,
            stats_id: email.stats_id,
            email_stats_id: email.stats_id,
            message_id: email.message_id,
            campaign_name: lead.email_campaign_name,
            organization_name: null,
            sentiment: null,
            lead_category_id: lead.lead_category_id,
            last_sent_time: lead.last_sent_time,
            last_reply_time: lead.last_reply_time,
            email_account_id: lead.email_account_id,
            revenue: lead.revenue,
            lead_status: lead.lead_status,
            current_sequence_number: lead.current_sequence_number,
            is_important: lead.is_important,
            is_archived: lead.is_archived,
            is_snoozed: lead.is_snoozed,
            client_id: lead.client_id
          })
        })
      })

      messages.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      return NextResponse.json(messages)
    }
    
    // For 'ALL' or other statuses, use fetchInboxReplies
    // According to Smartlead API docs, fetchInboxReplies returns all leads with replies
    // The has_new_unread_email flag indicates if the lead has unread emails, but doesn't specify which messages
    // We'll determine read status based on whether the message is the most recent reply and if the lead has unread emails
    const result = await smartlead.fetchInboxReplies({
      offset,
      limit,
      fetch_message_history: true, // Always fetch message history for inbox
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      sortBy
    })

    if (!result.success) {
      console.error('[Admin Inbox API] Smartlead API error:', result.error)
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch inbox replies from Smartlead' },
        { status: result.error?.status_code || 500 }
      )
    }

    // Transform Smartlead API response to match frontend expectations
    // The API returns { ok: true, data: [...] } and our client returns { success: true, data: { ok: true, data: [...] } }
    // So we need to extract result.data.data to get the actual array
    const apiResponse = result.data
    const leads = (apiResponse?.ok && apiResponse?.data) ? apiResponse.data : (Array.isArray(result.data) ? result.data : [])
    let messages: any[] = []

    leads.forEach((lead: any) => {
      const emailHistory = lead.email_history || []
      
      // Sort email history by time to find the most recent reply
      const sortedHistory = [...emailHistory].sort((a, b) => 
        new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime()
      )
      const mostRecentReply = sortedHistory.find((email: any) => email.type === 'REPLY')
      const mostRecentReplyTime = mostRecentReply?.time
      
      emailHistory.forEach((email: any) => {
        // Determine read status for REPLY messages:
        // - If lead has unread emails (has_new_unread_email = true), mark the most recent reply as unread
        // - If lead doesn't have unread emails, all replies are read
        // - SENT messages are always considered read
        let isRead = true
        if (email.type === 'REPLY') {
          if (lead.has_new_unread_email) {
            // If this is the most recent reply and lead has unread emails, it's unread
            isRead = email.time !== mostRecentReplyTime
          } else {
            // If lead has no unread emails, all replies are read
            isRead = true
          }
        }
        
        // Filter by status if requested (only filter when status is explicitly set)
        // When status is undefined (for 'ALL'), include all messages
        // Note: 'UNREAD' status is handled earlier by fetchUnreadReplies, so status here can only be 'READ' or 'SNOOZED'
        if (status) {
          if (email.type === 'REPLY') {
            if (status === 'READ' && !isRead) return
            if (status === 'SNOOZED' && !lead.is_snoozed) return
          }
        }
        
        messages.push({
          reply_id: email.stats_id,
          lead_id: lead.email_lead_id?.toString(),
          lead_email: lead.lead_email,
          campaign_id: lead.email_campaign_id?.toString(),
          first_name: lead.lead_first_name,
          last_name: lead.lead_last_name,
          email: lead.lead_email,
          company_name: null, // Not in API response
          subject: email.subject || '',
          email_body: email.email_body,
          time: email.time,
          received_at: email.time, // Alias for received_at
          is_read: isRead,
          type: email.type,
          stats_id: email.stats_id,
          email_stats_id: email.stats_id, // Alias for email_stats_id
          message_id: email.message_id,
          campaign_name: lead.email_campaign_name,
          organization_name: null, // Not in API response
          sentiment: null, // Not in API response
          // Additional fields from API
          lead_category_id: lead.lead_category_id,
          last_sent_time: lead.last_sent_time,
          last_reply_time: lead.last_reply_time,
          email_account_id: lead.email_account_id,
          revenue: lead.revenue,
          lead_status: lead.lead_status,
          current_sequence_number: lead.current_sequence_number,
          is_important: lead.is_important,
          is_archived: lead.is_archived,
          is_snoozed: lead.is_snoozed,
          client_id: lead.client_id
        })
      })
    })

    // Sort by time (most recent first)
    messages.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return NextResponse.json(messages)
  } catch (error: any) {
    console.error('[Admin Inbox API] Error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

