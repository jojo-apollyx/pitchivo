'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Clock, 
  Send, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Zap, 
  AlertCircle,
  Mail,
  Play,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'

interface EmailStats {
  pending: number
  scheduled_today: number
  sent_today: number
  failed_today: number
  last_run_time: string | null
  last_run_status: 'success' | 'failed' | null
  last_run_processed: number
  last_run_sent: number
  last_run_failed: number
}

export function EmailProcessorMonitor() {
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [batchSize, setBatchSize] = useState(100)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadStats()
    
    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(loadStats, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  async function loadStats() {
    try {
      const response = await fetch('/api/admin/email-processor/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading email processor stats:', error)
      toast.error('Failed to load email processor stats')
    } finally {
      setLoading(false)
    }
  }

  async function handleManualTrigger() {
    if (batchSize < 1 || batchSize > 500) {
      toast.error('Batch size must be between 1 and 500')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/email-processor/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: batchSize })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to trigger email processor')
      }

      const result = await response.json()
      
      toast.success(
        `Email processor completed! ${result.sent} sent, ${result.failed} failed`,
        { duration: 5000 }
      )
      
      // Refresh stats after processing
      setTimeout(loadStats, 1000)
    } catch (error: any) {
      console.error('Error triggering email processor:', error)
      toast.error(error.message || 'Failed to trigger email processor')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const getStatusColor = (status: string | null) => {
    if (status === 'success') return 'text-green-600'
    if (status === 'failed') return 'text-red-600'
    return 'text-gray-400'
  }

  const getStatusIcon = (status: string | null) => {
    if (status === 'success') return <CheckCircle2 className="h-5 w-5 text-green-600" />
    if (status === 'failed') return <XCircle className="h-5 w-5 text-red-600" />
    return <AlertCircle className="h-5 w-5 text-gray-400" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-1">Email Processor Monitor</h3>
          <p className="text-sm text-muted-foreground">
            Monitor scheduled email processing and trigger manual runs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Emails */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-2">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
              Pending
            </Badge>
          </div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
            {stats?.pending || 0}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-300">
            Emails waiting to send
          </div>
        </div>

        {/* Scheduled Today */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
              Today
            </Badge>
          </div>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
            {stats?.scheduled_today || 0}
          </div>
          <div className="text-xs text-purple-700 dark:text-purple-300">
            Scheduled for today
          </div>
        </div>

        {/* Sent Today */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
              Sent
            </Badge>
          </div>
          <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
            {stats?.sent_today || 0}
          </div>
          <div className="text-xs text-green-700 dark:text-green-300">
            Successfully sent today
          </div>
        </div>

        {/* Failed Today */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700">
              Failed
            </Badge>
          </div>
          <div className="text-3xl font-bold text-red-900 dark:text-red-100 mb-1">
            {stats?.failed_today || 0}
          </div>
          <div className="text-xs text-red-700 dark:text-red-300">
            Failed deliveries today
          </div>
        </div>
      </div>

      {/* Last Run Status */}
      <div className="bg-card/50 rounded-lg p-6 border border-border/30">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">Last Processor Run</h4>
            <p className="text-xs text-muted-foreground">
              Automatic cron job runs hourly
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(stats?.last_run_status || null)}
          </div>
        </div>

        {stats?.last_run_time ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last run:</span>
              <span className="font-medium">
                {format(new Date(stats.last_run_time), 'PPp')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge 
                variant="outline" 
                className={
                  stats.last_run_status === 'success'
                    ? 'bg-green-100 text-green-700 border-green-300'
                    : 'bg-red-100 text-red-700 border-red-300'
                }
              >
                {stats.last_run_status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processed:</span>
              <span className="font-medium">{stats.last_run_processed} emails</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/30">
              <div className="text-sm">
                <span className="text-muted-foreground">Sent:</span>
                <span className="ml-2 font-medium text-green-600">{stats.last_run_sent}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Failed:</span>
                <span className="ml-2 font-medium text-red-600">{stats.last_run_failed}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No processor runs recorded yet
          </div>
        )}
      </div>

      {/* Manual Trigger Section */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-6 border border-primary/20">
        <div className="flex items-start gap-3 mb-4">
          <Zap className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold mb-1">Manual Trigger</h4>
            <p className="text-xs text-muted-foreground">
              Run the email processor immediately without waiting for the hourly cron job.
              Useful for testing or processing urgent emails.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="batchSize" className="text-sm font-medium mb-2 block">
              Batch Size (number of emails to process)
            </Label>
            <div className="flex gap-3">
              <Input
                id="batchSize"
                type="number"
                min="1"
                max="500"
                value={batchSize}
                onChange={(e) => setBatchSize(Math.min(500, Math.max(1, parseInt(e.target.value) || 100)))}
                className="flex-1"
                disabled={processing}
              />
              <Button
                onClick={handleManualTrigger}
                disabled={processing || (stats?.pending || 0) === 0}
                className="gap-2 min-w-[140px]"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Trigger Now
                  </>
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                Default: 100 | Maximum: 500
              </p>
              {(stats?.pending || 0) === 0 && (
                <p className="text-xs text-amber-600">
                  No pending emails to process
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> Manual triggers will process emails scheduled up to 10 minutes in the future.
                This matches the behavior of the automatic cron job.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

