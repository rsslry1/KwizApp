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

// GET all classes
export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const classes = await db.class.findMany({
      orderBy: { name: 'asc' },
    })

    console.log('=== Classes API Debug ===')
    console.log('Found classes in database:', classes)
    console.log('Classes count:', classes.length)

    return NextResponse.json({ classes })
  } catch (error) {
    console.error('Get classes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create new class
export async function POST(request: NextRequest) {
  try {
    const adminUser = await verifyAdminAccess(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, section, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Class name is required' },
        { status: 400 }
      )
    }

    // Check if class already exists
    const existingClass = await db.class.findUnique({
      where: { name },
    })

    if (existingClass) {
      return NextResponse.json(
        { error: 'Class with this name already exists' },
        { status: 400 }
      )
    }

    // Create class
    const newClass = await db.class.create({
      data: {
        name,
        section,
        description,
        instructorIds: '',
        quizCount: 0,
        studentCount: 0,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CLASS_CREATED',
        userId: adminUser.userId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        resourceType: 'Class',
        resourceId: newClass.id,
        details: JSON.stringify({ className: name }),
      },
    })

    return NextResponse.json({
      success: true,
      class: newClass,
    })
  } catch (error) {
    console.error('Create class error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
