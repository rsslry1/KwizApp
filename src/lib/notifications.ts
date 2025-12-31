import { db } from '@/lib/db'

export async function createNotification({
  userId,
  type,
  title,
  message,
  link
}: {
  userId: string
  type: 'QUIZ_ASSIGNED' | 'QUIZ_REMINDER' | 'DEADLINE_APPROACHING' | 'QUIZ_RESULT' | 'ACCOUNT_LOCKED' | 'PASSWORD_RESET' | 'SYSTEM_MESSAGE'
  title: string
  message: string
  link?: string
}) {
  try {
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
        read: false
      }
    })

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

// Helper functions for specific notification types
export async function notifyQuizAssigned(userId: string, quizTitle: string, instructorName?: string) {
  return createNotification({
    userId,
    type: 'QUIZ_ASSIGNED',
    title: 'New Quiz Posted',
    message: `${quizTitle} has been posted${instructorName ? ` by ${instructorName}` : ''}`,
    link: '/quizzes'
  })
}

export async function notifyQuizResult(instructorId: string, studentName: string, quizTitle: string, className: string) {
  return createNotification({
    userId: instructorId,
    type: 'QUIZ_RESULT',
    title: 'Quiz Submission Completed',
    message: `${studentName} from ${className} has submitted ${quizTitle}`,
    link: '/quiz-results'
  })
}

export async function notifyAccountLocked(adminId: string, studentName: string, className: string, reason: string) {
  return createNotification({
    userId: adminId,
    type: 'ACCOUNT_LOCKED',
    title: 'Student Account Locked',
    message: `${studentName} (${className}) account has been locked: ${reason}`,
    link: '/students'
  })
}

export async function notifyPasswordReset(userId: string) {
  return createNotification({
    userId,
    type: 'PASSWORD_RESET',
    title: 'Password Reset',
    message: 'Your password has been reset. Please update it.',
    link: '/settings'
  })
}
