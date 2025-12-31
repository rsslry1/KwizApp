import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/security'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Fetch notifications based on user role
    let notifications: any[] = []

    if (decoded.role === 'ADMIN') {
      // Admin: Student account lock/unlock notifications
      notifications = await db.notification.findMany({
        where: {
          userId: decoded.userId,
          type: {
            in: ['ACCOUNT_LOCKED', 'PASSWORD_RESET']
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })
    } else if (decoded.role === 'INSTRUCTOR') {
      // Instructor: Quiz submission notifications from their students
      notifications = await db.notification.findMany({
        where: {
          userId: decoded.userId,
          type: 'QUIZ_RESULT'
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })
    } else if (decoded.role === 'STUDENT') {
      // Student: Quiz/activity assignments from instructors
      notifications = await db.notification.findMany({
        where: {
          userId: decoded.userId,
          type: {
            in: ['QUIZ_ASSIGNED', 'QUIZ_REMINDER', 'DEADLINE_APPROACHING']
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50
      })
    }

    // Format notifications for frontend
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type.toLowerCase(),
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      link: notification.link
    }))

    const unreadCount = formattedNotifications.filter(n => !n.read).length

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { notificationId, markAllAsRead } = await request.json()

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      await db.notification.updateMany({
        where: {
          userId: decoded.userId,
          read: false
        },
        data: {
          read: true
        }
      })

      return NextResponse.json({ message: 'All notifications marked as read' })
    } else if (notificationId) {
      // Mark specific notification as read
      const updatedNotification = await db.notification.update({
        where: {
          id: notificationId,
          userId: decoded.userId
        },
        data: {
          read: true
        }
      })

      return NextResponse.json(updatedNotification)
    }

    return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 })
  }
}
