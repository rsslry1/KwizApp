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

// GET all students with pagination and filtering
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
    const classId = searchParams.get('classId') || ''
    const status = searchParams.get('status') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const whereClause: any = {
      user: {
        ...(search && {
          OR: [
            { username: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        }),
        ...(status && { status: status as any }),
      }
    }

    if (classId) {
      whereClause.classIds = { contains: classId }
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
              avatar: true,
              role: true,
              status: true,
              createdAt: true,
              lastLoginAt: true,
              isFirstLogin: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.student.count({ where: whereClause })
    ])

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new student
export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const {
      username,
      password,
      fullName,
      email,
      phoneNumber,
      studentNumber,
      classIds,
    } = await request.json()

    // Validate required fields
    if (!username || !password || !fullName || !classIds || !Array.isArray(classIds)) {
      return NextResponse.json(
        { error: 'Username, password, full name, and class assignments are required' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if student number already exists
    if (studentNumber) {
      const existingStudent = await db.student.findUnique({
        where: { studentNumber },
      })

      if (existingStudent) {
        return NextResponse.json(
          { error: 'Student number already exists' },
          { status: 400 }
        )
      }
    }

    // Validate classes exist
    const classes = await db.class.findMany({
      where: { id: { in: classIds } },
    })

    if (classes.length !== classIds.length) {
      return NextResponse.json(
        { error: 'One or more classes not found' },
        { status: 404 }
      )
    }

    // Hash password
    const { hashPassword } = await import('@/lib/auth/security')
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        email,
        phoneNumber,
        role: 'STUDENT',
        status: 'ACTIVE',
        isFirstLogin: true,
        mfaEnabled: false,
        failedLogins: 0,
      },
    })

    // Create student
    const student = await db.student.create({
      data: {
        userId: user.id,
        classIds: classIds.join(','),
        studentNumber,
        passwordHistory: JSON.stringify([]),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          }
        }
      }
    })

    // Update student count in classes
    await db.class.updateMany({
      where: { id: { in: classIds } },
      data: { studentCount: { increment: 1 } },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'USER_CREATED',
        userId: adminUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Student',
        resourceId: student.id,
        details: JSON.stringify({
          username,
          fullName,
          studentNumber,
          classIds,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      student,
    })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
