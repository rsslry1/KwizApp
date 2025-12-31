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

// GET all instructors with pagination and filtering
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

    const [instructors, total] = await Promise.all([
      db.instructor.findMany({
        where: whereClause,
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
              lastLoginAt: true,
              isFirstLogin: true,
              avatar: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.instructor.count({ where: whereClause })
    ])

    // Add class details to each instructor
    const instructorsWithClasses = await Promise.all(
      instructors.map(async (instructor) => {
        const classIds = instructor.classIds?.split(',').filter(Boolean) || []
        const classes = classIds.length > 0
          ? await db.class.findMany({
              where: { id: { in: classIds } },
              select: { id: true, name: true, studentCount: true }
            })
          : []

        return {
          ...instructor,
          classes,
          totalStudents: classes.reduce((sum, cls) => sum + cls.studentCount, 0)
        }
      })
    )

    return NextResponse.json({
      instructors: instructorsWithClasses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get instructors error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new instructor
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
      classIds,
    } = await request.json()

    console.log('=== Instructor Creation API Debug ===')
    console.log('Request body:', { username, fullName, email, phoneNumber, classIds })
    console.log('Class IDs received:', classIds)
    console.log('Class IDs type:', typeof classIds)
    console.log('Class IDs is array:', Array.isArray(classIds))

    // Validate required fields
    if (!username || !password || !fullName || !classIds || !Array.isArray(classIds)) {
      console.log('Validation failed:', { username: !!username, password: !!password, fullName: !!fullName, classIds: !!classIds, isArray: Array.isArray(classIds) })
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

    // Validate classes exist
    console.log('Looking for classes with IDs:', classIds)
    const classes = await db.class.findMany({
      where: { id: { in: classIds } },
    })

    console.log('Found classes:', classes)
    console.log('Expected count:', classIds.length, 'Actual count:', classes.length)

    if (classes.length !== classIds.length) {
      const foundIds = classes.map(c => c.id)
      const missingIds = classIds.filter(id => !foundIds.includes(id))
      console.log('Missing class IDs:', missingIds)
      return NextResponse.json(
        { error: 'One or more classes not found', missingIds, foundIds },
        { status: 404 }
      )
    }

    // Hash password
    const { hashPassword } = await import('@/lib/auth/security')
    const hashedPassword = await hashPassword(password)

    // Create user
    console.log('Creating user with data:', { username, fullName, email, phoneNumber, role: 'INSTRUCTOR' })
    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        email,
        phoneNumber,
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
        isFirstLogin: true,
        mfaEnabled: false,
        failedLogins: 0,
      },
    })

    console.log('User created successfully:', user.id)

    // Create instructor
    console.log('Creating instructor with userId:', user.id, 'classIds:', classIds.join(','))
    const instructor = await db.instructor.create({
      data: {
        userId: user.id,
        classIds: classIds.join(','),
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

    console.log('Instructor created successfully:', instructor.id)

    // Update instructor count in classes
    console.log('Updating instructor counts in classes')
    await Promise.all(
      classIds.map(classId =>
        db.class.update({
          where: { id: classId },
          data: {
            instructorIds: {
              set: Array.from(new Set([
                ...(classes.find(c => c.id === classId)?.instructorIds?.split(',').filter(Boolean) || []),
                instructor.id
              ])).join(',')
            }
          }
        })
      )
    )

    console.log('Class instructor counts updated')

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'USER_CREATED',
        userId: adminUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Instructor',
        resourceId: instructor.id,
        details: JSON.stringify({
          username,
          fullName,
          classIds,
        }),
      },
    })

    console.log('Audit log created')

    return NextResponse.json({
      success: true,
      instructor,
    })
  } catch (error) {
    console.error('=== Instructor Creation Error ===')
    console.error('Error details:', error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'constructor' in error && error.constructor.name === 'PrismaClientKnownRequestError') {
      const prismaError = error as any
      console.error('Prisma error code:', prismaError.code)
      console.error('Prisma error meta:', prismaError.meta)
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
