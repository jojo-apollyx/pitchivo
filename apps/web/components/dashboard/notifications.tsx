'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, Mail, Loader2, CheckCheck, Inbox } from 'lucide-react'
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
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)

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

  const markAllAsRead = async () => {
    if (unreadCount === 0) return
    
    setIsMarkingAllRead(true)
    try {
      // Optimistically mark all as read
      const newReadIds = new Set(readIds)
      unreadNotifications.forEach(notification => {
        newReadIds.add(`${notification.type}:${notification.id}`)
      })
      setReadIds(newReadIds)

      // Mark all as read in database
      await Promise.all(
        unreadNotifications.map(notification =>
          fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              notificationType: notification.type,
              notificationId: notification.id,
            }),
          })
        )
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      // On error, we could revert, but for simplicity we'll keep the optimistic update
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!isRead(notification)) {
      markAsRead(notification)
    }
    setOpen(false)
    router.push(notification.href)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          id="notifications-trigger-button"
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-md hover:bg-background-secondary touch-manipulation"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span 
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-semantic-error"
              aria-hidden="true"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[calc(100vw-2rem)] sm:w-96 max-w-[calc(100vw-2rem)] p-0"
        sideOffset={8}
        aria-label="Notifications"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h3 className="text-base font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge 
                variant="secondary" 
                className="text-xs font-medium bg-accent-surface text-primary-dark border-0"
              >
                {unreadCount} {unreadCount === 1 ? 'new' : 'new'}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              id="notifications-mark-all-read-button"
              onClick={markAllAsRead}
              disabled={isMarkingAllRead}
              className={cn(
                "flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 touch-manipulation min-h-[44px] px-2 -mx-2 rounded-md hover:bg-background-secondary",
                isMarkingAllRead && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Mark all notifications as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="max-h-[min(500px,calc(100vh-12rem))] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading notifications...</p>
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <div className="h-12 w-12 rounded-full bg-background-secondary flex items-center justify-center">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-1">All caught up!</p>
                <p className="text-xs text-muted-foreground">You don't have any notifications right now.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {allNotifications.map((notification) => {
                const notificationIsRead = isRead(notification)
                const Icon = notification.type === 'rfq' ? MessageSquare : Mail
                
                return (
                  <button
                    key={`${notification.type}-${notification.id}`}
                    id={`notification-${notification.type}-${notification.id}`}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3.5 hover:bg-muted transition-colors duration-200 touch-manipulation group text-left",
                      !notificationIsRead && "bg-background-secondary/50"
                    )}
                    aria-label={`${notification.title}. ${notification.description}. ${formatRelativeTime(new Date(notification.timestamp))}`}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                      notificationIsRead 
                        ? "bg-background-secondary group-hover:bg-accent-surface/50" 
                        : "bg-accent-surface group-hover:bg-accent-color/20"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5 transition-colors duration-200",
                        notificationIsRead 
                          ? "text-muted-foreground group-hover:text-primary-dark" 
                          : "text-primary-dark"
                      )} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <div className="flex items-start gap-2">
                        <p className={cn(
                          "text-sm transition-colors duration-200 flex-1",
                          notificationIsRead 
                            ? "font-normal text-foreground group-hover:text-foreground" 
                            : "font-semibold text-foreground"
                        )}>
                          {notification.title}
                        </p>
                        {!notificationIsRead && (
                          <div 
                            className="h-2 w-2 rounded-full bg-primary-dark flex-shrink-0 mt-1.5"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.description}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(notification.timestamp))}
                      </span>
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

