import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_role')
      .eq('id', user.id)
      .single()

    if (profile?.org_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Get pending emails count
    const { count: pendingCount } = await supabase
      .from('scheduled_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Get emails scheduled for today
    const { count: scheduledTodayCount } = await supabase
      .from('scheduled_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('scheduled_time', todayStart.toISOString())
      .lt('scheduled_time', new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString())

    // Get emails sent today
    const { count: sentTodayCount } = await supabase
      .from('scheduled_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', todayStart.toISOString())

    // Get emails failed today
    const { count: failedTodayCount } = await supabase
      .from('scheduled_emails')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('updated_at', todayStart.toISOString())

    // Get last processor run info
    // We'll use the most recent sent/failed email to determine last run
    const { data: lastProcessed } = await supabase
      .from('scheduled_emails')
      .select('sent_at, status, updated_at')
      .in('status', ['sent', 'failed'])
      .order('updated_at', { ascending: false })
      .limit(100)

    let lastRunTime = null
    let lastRunStatus = null
    let lastRunProcessed = 0
    let lastRunSent = 0
    let lastRunFailed = 0

    if (lastProcessed && lastProcessed.length > 0) {
      // Group by time window (assume emails sent within 5 minutes are part of same run)
      const latestTime = new Date(lastProcessed[0].updated_at)
      const runWindow = 5 * 60 * 1000 // 5 minutes
      
      const lastRun = lastProcessed.filter(email => {
        const emailTime = new Date(email.updated_at)
        return Math.abs(latestTime.getTime() - emailTime.getTime()) < runWindow
      })

      lastRunTime = latestTime.toISOString()
      lastRunProcessed = lastRun.length
      lastRunSent = lastRun.filter(e => e.status === 'sent').length
      lastRunFailed = lastRun.filter(e => e.status === 'failed').length
      lastRunStatus = lastRunFailed === 0 ? 'success' : 'failed'
    }

    return NextResponse.json({
      pending: pendingCount || 0,
      scheduled_today: scheduledTodayCount || 0,
      sent_today: sentTodayCount || 0,
      failed_today: failedTodayCount || 0,
      last_run_time: lastRunTime,
      last_run_status: lastRunStatus,
      last_run_processed: lastRunProcessed,
      last_run_sent: lastRunSent,
      last_run_failed: lastRunFailed
    })
  } catch (error: any) {
    console.error('Error fetching email processor stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    )
  }
}

