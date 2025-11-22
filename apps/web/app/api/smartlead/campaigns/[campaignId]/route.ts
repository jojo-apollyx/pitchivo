/**
 * Smartlead Campaign Management API
 * 
 * DELETE /api/smartlead/campaigns/[campaignId]
 * - Delete campaign from Smartlead
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSmartleadClient } from '@/lib/smartlead';

/**
 * DELETE /api/smartlead/campaigns/[campaignId]
 * Delete a campaign from Smartlead
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { campaignId } = await params;

    console.log(`[Smartlead Campaign Delete] Deleting campaign:`, {
      smartlead_campaign_id: campaignId,
    });

    // Create Smartlead client and delete campaign
    const smartlead = createSmartleadClient();
    const result = await smartlead.deleteCampaign(campaignId);

    if (!result.success) {
      console.error('[Smartlead Campaign Delete] Failed to delete campaign:', {
        error: result.error,
        smartlead_campaign_id: campaignId,
      });

      return NextResponse.json(
        { 
          error: 'Failed to delete campaign',
          details: result.error?.message || result.error?.error || 'Unknown error',
          status_code: result.error?.status_code,
        },
        { status: 500 }
      );
    }

    console.log('[Smartlead Campaign Delete] Campaign deleted successfully:', {
      smartlead_campaign_id: campaignId,
    });

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully from Smartlead'
    });

  } catch (error) {
    console.error('[Smartlead Campaign Delete] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

