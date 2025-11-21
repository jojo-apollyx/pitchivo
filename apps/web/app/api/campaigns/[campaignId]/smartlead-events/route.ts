import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET: Fetch Smartlead email events for a campaign
 * Query params:
 * - limit: number of events to return (default 50, max 500)
 * - offset: pagination offset
 * - event_type: filter by event type (sent, opened, clicked, replied, etc.)
 * - lead_email: filter by lead email
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const eventType = searchParams.get('event_type');
    const leadEmail = searchParams.get('lead_email');

    const supabase = await createClient();

    // Verify user has access to this campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('campaign_id, campaign_name, smartlead_campaign_id')
      .eq('campaign_id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('smartlead_email_events')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaignId)
      .order('event_timestamp', { ascending: false });

    // Apply filters
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (leadEmail) {
      query = query.eq('lead_email', leadEmail);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: events, error: eventsError, count } = await query;

    if (eventsError) {
      console.error('Error fetching smartlead events:', eventsError);
      return NextResponse.json(
        { error: 'Failed to fetch events', details: eventsError.message },
        { status: 500 }
      );
    }

    // Get event type counts for stats
    const { data: eventCounts } = await supabase
      .from('smartlead_email_events')
      .select('event_type')
      .eq('campaign_id', campaignId);

    const stats = eventCounts?.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      success: true,
      events: events || [],
      count: count || 0,
      stats,
      campaign: {
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        smartlead_id: campaign.smartlead_campaign_id
      },
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error: any) {
    console.error('Error in smartlead events API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

