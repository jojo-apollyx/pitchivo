'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils/activities'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'rfq' | 'campaign'
  title: string
  description: string
  timestamp: string
  href: string
  metadata: Record<string, any>
}

interface NotificationsData {
  rfqs: Notification[]
  campaigns: Notification[]
}

export function Notifications() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationsData>({ rfqs: [], campaigns: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true)
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          setNotifications({ rfqs: data.rfqs || [], campaigns: data.campaigns || [] })
          // Set read IDs from API response
          if (data.readIds) {
            setReadIds(new Set(data.readIds))
          }
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Combine and sort notifications
  const allNotifications = [...notifications.rfqs, ...notifications.campaigns]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10) // Show max 10 most recent

  // Check if notification is read (format: "type:id")
  const isRead = (notification: Notification) => {
    return readIds.has(`${notification.type}:${notification.id}`)
  }

  // Filter out read notifications for unread count
  const unreadNotifications = allNotifications.filter(n => !isRead(n))
  const unreadCount = unreadNotifications.length

  const markAsRead = async (notification: Notification) => {
    try {
      // Optimistically update UI
      const newReadIds = new Set(readIds)
      newReadIds.add(`${notification.type}:${notification.id}`)
      setReadIds(newReadIds)

      // Mark as read in database
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationType: notification.type,
          notificationId: notification.id,
        }),
      })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Revert optimistic update on error
      const newReadIds = new Set(readIds)
      newReadIds.delete(`${notification.type}:${notification.id}`)
      setReadIds(newReadIds)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification)
    setOpen(false)
    router.push(notification.href)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-md hover:bg-background-secondary touch-manipulation"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-semantic-error" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-border">
              {allNotifications.map((notification) => {
                const notificationIsRead = isRead(notification)
                const Icon = notification.type === 'rfq' ? MessageSquare : Mail
                
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-background-secondary transition-colors",
                      !notificationIsRead && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-md flex items-center justify-center flex-shrink-0",
                        notification.type === 'rfq' 
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                          : "bg-green-100 text-green-600 dark:bg-green-900/30"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-sm font-medium text-foreground",
                            !notificationIsRead && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          {!notificationIsRead && (
                            <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(new Date(notification.timestamp))}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

