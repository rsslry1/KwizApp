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

// GET all quizzes with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const classId = searchParams.get('classId') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status && status !== 'all') {
      whereClause.status = status
    }

    if (classId) {
      whereClause.classIds = { contains: classId }
    }

    const [quizzes, total] = await Promise.all([
      db.quiz.findMany({
        where: whereClause,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.quiz.count({ where: whereClause })
    ])

    // Add class and creator details
    const quizzesWithDetails = await Promise.all(
      quizzes.map(async (quiz) => {
        const classIds = quiz.classIds?.split(',').filter(Boolean) || []
        const classes = classIds.length > 0
          ? await db.class.findMany({
              where: { id: { in: classIds } },
              select: { id: true, name: true }
            })
          : []

        return {
          ...quiz,
          classes,
          creatorName: quiz.createdBy.user?.fullName || quiz.createdBy.user?.username
        }
      })
    )

    return NextResponse.json({
      quizzes: quizzesWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get quizzes error:', error)
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
