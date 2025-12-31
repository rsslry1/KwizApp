'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Clock,
  BookOpen,
  UserPlus,
  Settings,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'quiz_assigned' | 'quiz_reminder' | 'deadline_approaching' | 'quiz_result' | 'account_locked' | 'password_reset' | 'system_message' | 'user_created' | 'class_created'
  title: string
  message: string
  read: boolean
  createdAt: string
  link?: string
  icon?: React.ReactNode
}

interface NotificationDropdownProps {
  className?: string
}

export default function NotificationDropdown({ className }: NotificationDropdownProps) {
  const { user, token } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !token) return

      setLoading(true)
      try {
        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setNotifications(data.notifications || [])
          setUnreadCount(data.unreadCount || 0)
        } else {
          console.error('Failed to fetch notifications')
          setNotifications([])
          setUnreadCount(0)
        }
      } catch (error) {
        console.error('Error fetching notifications:', error)
        setNotifications([])
        setUnreadCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user, token])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quiz_assigned':
        return <BookOpen className="w-4 h-4 text-blue-500" />
      case 'quiz_reminder':
      case 'deadline_approaching':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'quiz_result':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'account_locked':
        return <Shield className="w-4 h-4 text-red-500" />
      case 'password_reset':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'system_message':
        return <Info className="w-4 h-4 text-gray-500" />
      case 'user_created':
        return <UserPlus className="w-4 h-4 text-blue-500" />
      case 'class_created':
        return <BookOpen className="w-4 h-4 text-green-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className={cn("relative", className)}>
        <Bell className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
          0
        </span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("relative", className)}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end">
        <DropdownMenuLabel className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-0 focus:bg-transparent"
                onSelect={() => handleMarkAsRead(notification.id)}
              >
                <div
                  className={cn(
                    "w-full p-3 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    !notification.read && "bg-muted/30"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {notification.icon || getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      !notification.read && "font-semibold"
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="p-2">
              <Button variant="outline" size="sm" className="w-full">
                View all notifications
              </Button>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
