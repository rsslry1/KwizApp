import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth/security'

// Helper function to verify admin access
async function verifyAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const payload = await verifyToken(token)

  if (!payload || payload.role !== 'ADMIN') {
    return null
  }

  return payload
}

// GET single quiz
export async function GET(request: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { quizId } = params

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        createdBy: {
          select: {
            id: true,
            user: {
              select: {
                username: true,
                fullName: true
              }
            }
          }
        },
        _count: {
          select: { quizResults: true }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Add class details
    const classIds = quiz.classIds?.split(',').filter(Boolean) || []
    const classes = classIds.length > 0
      ? await db.class.findMany({
          where: { id: { in: classIds } },
          select: { id: true, name: true }
        })
      : []

    return NextResponse.json({
      quiz: {
        ...quiz,
        classes,
        creatorName: quiz.createdBy.user?.fullName || quiz.createdBy.user?.username
      }
    })
  } catch (error) {
    console.error('Get quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE a quiz
export async function DELETE(request: NextRequest, { params }: { params: { quizId: string } }) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { quizId } = params

    // Check if quiz exists
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        _count: {
          select: { quizResults: true }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if quiz has results (prevent deletion if students have taken it)
    if (quiz._count.quizResults > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete quiz with existing results',
          details: `${quiz._count.quizResults} students have already taken this quiz`
        },
        { status: 400 }
      )
    }

    // Delete the quiz
    await db.quiz.delete({
      where: { id: quizId }
    })

    // Update quiz counts in affected classes
    const classIds = quiz.classIds?.split(',').filter(Boolean) || []
    if (classIds.length > 0) {
      await Promise.all(
        classIds.map(classId =>
          db.class.update({
            where: { id: classId },
            data: {
              quizCount: {
                decrement: 1
              }
            }
          })
        )
      )
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'QUIZ_DELETED',
        userId: adminUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Quiz',
        resourceId: quizId,
        details: JSON.stringify({
          quizTitle: quiz.title,
          deletedBy: adminUser.username
        }),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully'
    })
  } catch (error) {
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
