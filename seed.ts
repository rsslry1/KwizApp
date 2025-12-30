import { PrismaClient } from '@prisma/client'
import { hashPassword } from './src/lib/auth/security'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Admin
  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      email: 'admin@school.edu',
      role: 'ADMIN',
      status: 'ACTIVE',
      fullName: 'System Administrator',
      isFirstLogin: false,
      mfaEnabled: false,
      failedLogins: 0,
    },
  })
  console.log('✅ Admin created:', admin.username)

  // Create Instructors
  const instructorPassword = await hashPassword('password123')

  const instructor1 = await prisma.user.upsert({
    where: { username: 'instructor1' },
    update: {},
    create: {
      username: 'instructor1',
      password: instructorPassword,
      email: 'smith@school.edu',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
      fullName: 'Professor Smith',
      isFirstLogin: false,
      mfaEnabled: false,
      failedLogins: 0,
    },
  })

  const instructor1Record = await prisma.instructor.upsert({
    where: { userId: instructor1.id },
    update: {},
    create: {
      userId: instructor1.id,
      classIds: '', // Will be set after classes are created
    },
  })
  console.log('✅ Instructor created:', instructor1.username)

  const instructor2 = await prisma.user.upsert({
    where: { username: 'instructor2' },
    update: {},
    create: {
      username: 'instructor2',
      password: instructorPassword,
      email: 'johnson@school.edu',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
      fullName: 'Professor Johnson',
      isFirstLogin: false,
      mfaEnabled: false,
      failedLogins: 0,
    },
  })

  const instructor2Record = await prisma.instructor.upsert({
    where: { userId: instructor2.id },
    update: {},
    create: {
      userId: instructor2.id,
      classIds: '', // Will be set after classes are created
    },
  })
  console.log('✅ Instructor created:', instructor2.username)

  // Create Classes
  const class2A = await prisma.class.upsert({
    where: { name: '2A' },
    update: {},
    create: {
      name: '2A',
      section: '2A',
      description: 'Grade 2 - Section A',
      instructorIds: instructor1Record.id,
      quizCount: 0,
      studentCount: 0,
    },
  })

  const class2B = await prisma.class.upsert({
    where: { name: '2B' },
    update: {},
    create: {
      name: '2B',
      section: '2B',
      description: 'Grade 2 - Section B',
      instructorIds: instructor1Record.id,
      quizCount: 0,
      studentCount: 0,
    },
  })

  const class3A = await prisma.class.upsert({
    where: { name: '3A' },
    update: {},
    create: {
      name: '3A',
      section: '3A',
      description: 'Grade 3 - Section A',
      instructorIds: instructor2Record.id,
      quizCount: 0,
      studentCount: 0,
    },
  })

  const class3B = await prisma.class.upsert({
    where: { name: '3B' },
    update: {},
    create: {
      name: '3B',
      section: '3B',
      description: 'Grade 3 - Section B',
      instructorIds: instructor2Record.id,
      quizCount: 0,
      studentCount: 0,
    },
  })
  console.log('✅ Classes created: 2A, 2B, 3A, 3B')

  // Now update instructors with actual class IDs
  await prisma.instructor.update({
    where: { id: instructor1Record.id },
    data: { classIds: `${class2A.id},${class2B.id}` }
  })

  await prisma.instructor.update({
    where: { id: instructor2Record.id },
    data: { classIds: `${class3A.id},${class3B.id}` }
  })
  console.log('✅ Instructor class assignments updated')

  // Create Sample Students
  const studentPassword = await hashPassword('DefaultPass@2025')

  for (let i = 1; i <= 5; i++) {
    const student = await prisma.user.upsert({
      where: { username: `Student${String(i).padStart(3, '0')}` },
      update: {},
      create: {
        username: `Student${String(i).padStart(3, '0')}`,
        password: studentPassword,
        role: 'STUDENT',
        status: 'ACTIVE',
        isFirstLogin: true,
        mfaEnabled: false,
        failedLogins: 0,
      },
    })

    await prisma.student.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        classIds: i <= 2 ? class2A.id : class2B.id,
        studentNumber: `STU${String(i).padStart(4, '0')}`,
        passwordHistory: '[]',
      },
    })

    // Update class student count
    if (i <= 2) {
      await prisma.class.update({
        where: { id: class2A.id },
        data: { studentCount: { increment: 1 } },
      })
    } else {
      await prisma.class.update({
        where: { id: class2B.id },
        data: { studentCount: { increment: 1 } },
      })
    }
  }
  console.log('✅ 5 sample students created')

  // Create Sample Quiz
  const sampleQuestions = [
    {
      id: 'q1',
      type: 'MULTIPLE_CHOICE',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1, // Index of correct option
      points: 10,
      explanation: '2 + 2 equals 4',
    },
    {
      id: 'q2',
      type: 'TRUE_FALSE',
      question: 'The Earth is flat.',
      options: ['True', 'False'],
      correctAnswer: 1,
      points: 10,
      explanation: 'The Earth is a sphere, not flat.',
    },
    {
      id: 'q3',
      type: 'SHORT_ANSWER',
      question: 'What is the capital of France?',
      correctAnswer: 'Paris',
      points: 10,
      explanation: 'Paris is the capital and largest city of France.',
    },
  ]

  const quiz = await prisma.quiz.create({
    data: {
      title: 'Mathematics - Chapter 1',
      description: 'Basic mathematics quiz covering addition, subtraction, and multiplication.',
      instructions: 'Read each question carefully. You have 30 minutes to complete the quiz.',
      questions: JSON.stringify(sampleQuestions),
      timeLimit: 30,
      allowedAttempts: 2,
      passingScore: 70,
      showResults: true,
      shuffleQuestions: false,
      randomizeOptions: true,
      availableFrom: new Date(),
      availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      fullscreenMode: false,
      disableCopyPaste: false,
      requireProctoring: false,
      classIds: class2A.id,
      createdById: instructor1Record.id,
      status: 'PUBLISHED',
      totalPoints: 30,
    },
  })
  console.log('✅ Sample quiz created')

  // Update class quiz count
  await prisma.class.update({
    where: { id: class2A.id },
    data: { quizCount: { increment: 1 } },
  })

  console.log('🎉 Database seeding completed!')
  console.log('\n📋 Login Credentials:')
  console.log('   Admin: admin / admin123')
  console.log('   Instructor: instructor1 / password123')
  console.log('   Instructor: instructor2 / password123')
  console.log('   Students: Student001-005 / DefaultPass@2025 (first login required)')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
