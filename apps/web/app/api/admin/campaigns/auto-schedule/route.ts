/**
 * Auto Schedule API - DISABLED
 * 
 * Batch email scheduling has been disabled as part of the Smartlead migration.
 * Campaign management is now handled through Smartlead, while Brevo is used
 * only for individual email sending and tracking.
 * 
 * See: SMARTLEAD_MIGRATION_PLAN.md
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Batch email scheduling is disabled',
      message: 'Campaign management is now handled through Smartlead. Use the Smartlead dashboard to manage campaign sends.'
    },
    { status: 410 } // 410 Gone - resource is no longer available
  );
}
