# QAMS - Quiz & Activity Management System

A modern, secure, web-based educational platform for managing quizzes and activities with role-based access control.

## Features

### For Students
- ✅ Secure login with first-time profile setup
- ✅ Take quizzes with timer and auto-submit
- ✅ View detailed results and explanations
- ✅ Track progress and performance
- ✅ Class-based quiz isolation

### For Instructors
- ✅ Create quizzes with multiple question types
- ✅ Manage classes and students
- ✅ View class performance analytics
- ✅ Auto-grade objective questions
- ✅ Manual grading support for essays

### For Administrators
- ✅ Full system control
- ✅ Bulk generate student accounts
- ✅ Manage classes and instructors
- ✅ Monitor all system activity
- ✅ Audit logs for compliance

### Security Features
- 🔐 JWT-based authentication
- 🔐 Password strength enforcement (min 12 chars, uppercase, lowercase, number, symbol)
- 🔐 Account lockout after 5 failed attempts (15 min timeout)
- 🔐 Role-based access control (RBAC)
- 🔐 Class-based data isolation
- 🔐 Input sanitization to prevent XSS/SQL injection
- 🔐 Password history tracking (last 5 passwords)

### Quiz Features
- 📝 Multiple question types:
  - Multiple Choice
  - True/False
  - Short Answer
  - Essay (manual grading)
  - Fill in the Blank
- ⏱️ Optional time limits with auto-submit
- 🔀 Question and option randomization
- 📊 Real-time progress tracking
- 🚫 Anti-cheating measures (fullscreen mode, disable copy-paste)
- 💾 Save and resume functionality
- 📈 Detailed results with explanations

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: SQLite with Prisma ORM
- **State Management**: Zustand
- **Authentication**: JWT (jose library)

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- SQLite

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Push database schema:
   ```bash
   bun run db:push
   ```

5. Seed the database with sample data:
   ```bash
   bun seed.ts
   ```

6. Start the development server:
   ```bash
   bun run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Demo Credentials

After running the seed script, use these credentials:

### Administrator
- **Username**: admin
- **Password**: admin123

### Instructors
- **Username**: instructor1
- **Password**: password123

### Students (First login required)
- **Student001** / DefaultPass@2025
- **Student002** / DefaultPass@2025
- **Student003** / DefaultPass@2025
- **Student004** / DefaultPass@2025
- **Student005** / DefaultPass@2025

Note: Students must complete profile setup on first login (change password, set full name).

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── admin/               # Admin APIs
│   │   ├── instructor/          # Instructor APIs
│   │   └── student/             # Student APIs
│   ├── page.tsx                 # Landing page
│   ├── layout.tsx               # Root layout
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── quiz/                   # Quiz components
│   │   ├── QuizBuilder.tsx      # Quiz creation interface
│   │   ├── QuizTaking.tsx       # Quiz taking interface
│   │   └── QuizResults.tsx     # Results display
│   ├── auth/                    # Auth components
│   │   └── StudentProfileSetup.tsx
│   └── dashboards/              # Dashboard components
│       ├── StudentDashboard.tsx
│       ├── InstructorDashboard.tsx
│       └── AdminDashboard.tsx
├── lib/
│   ├── db.ts                    # Prisma client
│   ├── auth/                    # Authentication utilities
│   │   └── security.ts
│   └── utils.ts                 # Utility functions
└── store/
    └── auth.ts                  # Zustand auth store
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/setup-profile` - Student first-time setup

### Admin
- `GET /api/admin/classes` - List all classes
- `POST /api/admin/classes` - Create new class
- `POST /api/admin/students/generate` - Bulk generate students

### Instructor
- `GET /api/instructor/quizzes` - List instructor's quizzes
- `POST /api/instructor/quizzes` - Create new quiz
- `GET /api/instructor/quizzes/[id]/results` - View quiz results

### Student
- `GET /api/student/quizzes` - List available quizzes (class-filtered)
- `POST /api/student/quizzes/submit` - Submit quiz answers
- `GET /api/student/quizzes/[id]/results` - View quiz results

## Database Schema

### Core Models
- **User** - Base user model (Admin/Instructor/Student)
- **Student** - Student-specific data (class assignments, password history)
- **Instructor** - Instructor-specific data (class assignments)
- **Class** - Class/Section information
- **Quiz** - Quiz content and settings
- **QuizResult** - Quiz submission results
- **Notification** - User notifications
- **AuditLog** - System activity tracking
- **PasswordResetToken** - Password reset tokens

## Development

### Code Quality
```bash
bun run lint
```

### Database Operations
```bash
bun run db:push      # Push schema changes
bun run db:generate   # Generate Prisma Client
bun run db:migrate    # Run migrations
bun run db:reset      # Reset database
```

## Security Considerations

1. **Password Policy**: Minimum 12 characters, must include uppercase, lowercase, number, and symbol
2. **Account Lockout**: 5 failed attempts → 15 minute lock
3. **First Login**: Students must complete profile setup before accessing quizzes
4. **Class Isolation**: Students can only access quizzes assigned to their classes
5. **RBAC**: Instructors only see their assigned classes; Admins see everything
6. **Audit Logging**: All critical actions are logged for compliance

## Future Enhancements

- [ ] WebSocket service for real-time notifications
- [ ] Email notifications for deadlines and password resets
- [ ] File upload for quiz media and profile pictures
- [ ] Analytics dashboard with charts
- [ ] Export results as PDF/CSV
- [ ] Leaderboard with privacy options
- [ ] MFA support (TOTP/Email OTP)
- [ ] AI-powered question generation
- [ ] Plagiarism detection for essays
- [ ] Mobile PWA support

## License

Private - All Rights Reserved
