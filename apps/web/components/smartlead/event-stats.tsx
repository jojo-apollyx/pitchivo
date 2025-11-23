'use client'

import { useEffect, useState } from 'react'
import { 
  Mail, 
  MailCheck, 
  MousePointerClick, 
  MessageSquare, 
  XCircle, 
  UserX, 
  MailOpen,
  Send,
  TrendingUp,
  Activity
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SmartleadEventStatsProps {
  campaignId: string
  isAdmin?: boolean
  showChart?: boolean
}

interface EventStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  replied: number
  bounced: number
  unsubscribed: number
  category_updated?: number
}

const STAT_CONFIG = {
  sent: {
    icon: Send,
    label: 'Sent',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-500',
    description: 'Total emails sent',
    order: 1
  },
  delivered: {
    icon: MailCheck,
    label: 'Delivered',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    borderColor: 'border-emerald-500',
    description: 'Successfully delivered',
    order: 2
  },
  opened: {
    icon: MailOpen,
    label: 'Opened',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-500',
    description: 'Emails opened by leads',
    order: 3
  },
  clicked: {
    icon: MousePointerClick,
    label: 'Clicked',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    borderColor: 'border-indigo-500',
    description: 'Links clicked',
    order: 4
  },
  replied: {
    icon: MessageSquare,
    label: 'Replied',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-500',
    description: 'Leads who replied',
    order: 5
  },
  bounced: {
    icon: XCircle,
    label: 'Bounced',
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-500',
    description: 'Email bounces',
    order: 6
  },
  unsubscribed: {
    icon: UserX,
    label: 'Unsubscribed',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950/20',
    borderColor: 'border-gray-500',
    description: 'Unsubscribes',
    order: 7
  },
}

export function SmartleadEventStats({ 
  campaignId, 
  isAdmin = false,
  showChart = true 
}: SmartleadEventStatsProps) {
  const [stats, setStats] = useState<EventStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadStats, 60000)
    return () => clearInterval(interval)
  }, [campaignId])

  async function loadStats() {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/smartlead-events?limit=1000`)
      
      if (!response.ok) {
        throw new Error('Failed to load stats')
      }

      const data = await response.json()
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error loading smartlead event stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card className="p-6 text-center">
        <Activity className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No event data available</p>
      </Card>
    )
  }

  const totalSent = stats.sent || 0
  const delivered = stats.delivered || 0
  const opened = stats.opened || 0
  const clicked = stats.clicked || 0
  const replied = stats.replied || 0
  const bounced = stats.bounced || 0
  const unsubscribed = stats.unsubscribed || 0

  // Calculate rates based on sent count (Smartlead doesn't send delivery events)
  const openRate = totalSent > 0 ? (opened / totalSent) * 100 : 0
  const clickRate = totalSent > 0 ? (clicked / totalSent) * 100 : 0
  const replyRate = totalSent > 0 ? (replied / totalSent) * 100 : 0
  const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0

  // Get stats to display (filter out zero values unless admin)
  const statsToDisplay = Object.entries(STAT_CONFIG)
    .filter(([key]) => {
      const value = stats[key as keyof EventStats] || 0
      return isAdmin || value > 0 // Show all for admin, only non-zero for users
    })
    .sort((a, b) => a[1].order - b[1].order)

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {statsToDisplay.map(([key, config]) => {
          const Icon = config.icon
          const value = stats[key as keyof EventStats] || 0
          
          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className={`p-4 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer border-l-4 ${config.borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div className={`${config.bgColor} p-2 rounded-lg`}>
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {value.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium">
                          {config.label}
                        </div>
                      </div>
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{config.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>

      {/* Conversion Funnel */}
      {showChart && totalSent > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Email Engagement Funnel</h3>
          </div>
          
          <div className="space-y-4">
            {/* Open Rate */}
            {opened > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="font-medium">Open Rate</span>
                  </div>
                  <span className="font-semibold">
                    {openRate.toFixed(1)}% 
                    <span className="text-muted-foreground ml-1">
                      ({opened}/{totalSent})
                    </span>
                  </span>
                </div>
                <Progress value={openRate} className="h-2 [&>div]:bg-purple-500" />
              </div>
            )}

            {/* Click Rate */}
            {clicked > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className="font-medium">Click Rate</span>
                  </div>
                  <span className="font-semibold">
                    {clickRate.toFixed(1)}% 
                    <span className="text-muted-foreground ml-1">
                      ({clicked}/{totalSent})
                    </span>
                  </span>
                </div>
                <Progress value={clickRate} className="h-2 [&>div]:bg-indigo-500" />
              </div>
            )}

            {/* Reply Rate */}
            {replied > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-medium">Reply Rate</span>
                  </div>
                  <span className="font-semibold">
                    {replyRate.toFixed(1)}% 
                    <span className="text-muted-foreground ml-1">
                      ({replied}/{totalSent})
                    </span>
                  </span>
                </div>
                <Progress value={replyRate} className="h-2 [&>div]:bg-green-500" />
              </div>
            )}

            {/* Bounce Rate */}
            {bounced > 0 && isAdmin && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="font-medium">Bounce Rate</span>
                  </div>
                  <span className="font-semibold">
                    {bounceRate.toFixed(1)}% 
                    <span className="text-muted-foreground ml-1">
                      ({bounced}/{totalSent})
                    </span>
                  </span>
                </div>
                <Progress value={bounceRate} className="h-2 [&>div]:bg-red-500" />
              </div>
            )}
          </div>

          {/* Summary Card */}
          <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Campaign Performance</p>
                <p className="text-xs text-muted-foreground">
                  {replied > 0 && (
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {replied} {replied === 1 ? 'reply' : 'replies'}
                    </span>
                  )}
                  {replied > 0 && opened > 0 && ' · '}
                  {opened > 0 && (
                    <span>
                      {opened} {opened === 1 ? 'open' : 'opens'}
                    </span>
                  )}
                  {(replied > 0 || opened > 0) && clicked > 0 && ' · '}
                  {clicked > 0 && (
                    <span>
                      {clicked} {clicked === 1 ? 'click' : 'clicks'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

