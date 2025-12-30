# QAMS - Quiz & Activity Management System

A modern, secure, web-based Quiz and Activity Management System designed for educational institutions.

## 🎯 Features

### Core Functionality
- **Role-Based Access Control**: Three distinct user roles (Admin, Instructor, Student) with appropriate permissions
- **Class-Based Data Isolation**: Students can only access quizzes and content from their assigned classes
- **Secure Authentication**: JWT-based authentication with password hashing and account security features
- **Comprehensive Dashboards**: Role-specific dashboards with relevant features and analytics

### Student Features
- Mandatory profile setup on first login
- Secure password with strength validation
- View available and completed quizzes
- Track progress and performance
- Real-time notifications
- Dark/light mode support

### Instructor Features
- Create and manage quizzes with multiple question types
- Assign quizzes to specific classes
- Monitor student progress
- View class-wide analytics
- Bulk question import

### Admin Features
- System-wide user management
- Bulk student account generation
- Class and section management
- Instructor assignment
- System configuration
- Audit logs

## 🚀 Technology Stack

- **Frontend**: Next.js 15 with App Router, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 with shadcn/ui components
- **State Management**: Zustand for client state
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT tokens with secure password hashing
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-project
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
bun run db:push
bun run db:generate
```

5. Seed sample data (optional):
```bash
bun run seed
```

6. Start the development server:
```bash
bun run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔑 Default Credentials

### Admin
- Username: `admin`
- Password: `admin123`

### Instructors
- Username: `instructor1` / Password: `password123`
- Username: `instructor2` / Password: `password123`

### Students
- Username: `Student001` through `Student005`
- Password: `DefaultPass@2025` (first login - must change on setup)

## 📁 Project Structure

```
my-project/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── admin/         # Admin-only endpoints
│   │   │   ├── instructor/    # Instructor endpoints
│   │   │   └── student/       # Student endpoints
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page & router
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   ├── dashboards/        # Role-specific dashboards
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── auth/              # Authentication utilities
│   │   ├── db.ts              # Prisma client
│   │   └── utils.ts           # Utility functions
│   └── store/
│       └── auth.ts            # Zustand auth store
└── seed.ts                   # Database seeding script
```

## 🔒 Security Features

### Authentication & Authorization
- **JWT-based Authentication**: Secure token generation and verification
- **Password Hashing**: SHA-256 hashing for all passwords
- **Password Strength Validation**: Minimum 12 chars with uppercase, lowercase, number, and symbol
- **Account Lockout**: 5 failed login attempts locks account for 15 minutes
- **Role-Based Access Control**: API endpoints verify user roles
- **Class-Based Isolation**: Database queries filter by user's class assignments

### Data Protection
- **Input Sanitization**: Protection against XSS and injection attacks
- **Audit Logging**: All critical actions are logged
- **Password History**: Prevents reuse of last 5 passwords
- **Secure Defaults**: Strong default passwords for new accounts

## 🎨 UI/UX Features

### Design
- Modern, clean interface with shadcn/ui components
- Responsive design for mobile, tablet, and desktop
- Dark/light mode support
- Consistent color system with accessibility considerations
- Smooth animations and transitions

### Accessibility
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly
- WCAG compliance

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/setup-profile` - Student first-time profile setup
- `POST /api/auth/logout` - User logout

### Admin
- `GET /api/admin/classes` - Get all classes
- `POST /api/admin/classes` - Create new class
- `POST /api/admin/students/generate` - Bulk generate student accounts
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create new user

### Instructor
- `GET /api/instructor/quizzes` - Get instructor's quizzes
- `POST /api/instructor/quizzes` - Create new quiz
- `PUT /api/instructor/quizzes/:id` - Update quiz
- `DELETE /api/instructor/quizzes/:id` - Delete quiz
- `GET /api/instructor/students` - Get students in assigned classes

### Student
- `GET /api/student/quizzes` - Get available quizzes (filtered by class)
- `POST /api/student/quizzes/:id/submit` - Submit quiz
- `GET /api/student/results` - Get quiz results

## 📊 Database Schema

### Core Models
- **User**: Base user model with authentication data
- **Student**: Student-specific data and class assignments
- **Instructor**: Instructor-specific data and class assignments
- **Class**: Class/section information
- **Quiz**: Quiz questions and configuration
- **QuizResult**: Student quiz submissions and scores
- **Notification**: User notifications
- **AuditLog**: System audit trail
- **PasswordResetToken**: Password reset management

## 🚦 Development

### Available Scripts
- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run db:push` - Push schema to database
- `bun run db:generate` - Generate Prisma client
- `bun run seed` - Seed sample data

### Code Style
- TypeScript for type safety
- ESLint for code quality
- shadcn/ui components for UI
- Prisma for database operations

## 📝 User Roles

### Admin (Super Admin)
- Full system access
- User and class management
- Bulk student account generation
- Instructor management and assignment
- System-wide analytics
- Configuration and settings

### Instructor (Teacher)
- Manage quizzes for assigned classes
- Monitor student progress
- Grade subjective questions
- View class analytics
- Generate reports

### Student
- Access quizzes from assigned classes
- Complete profile setup on first login
- View results and feedback
- Track personal progress
- Manage profile settings

## 🔐 Security Best Practices

1. **Never commit sensitive data**: Keep `.env` file secure
2. **Change default passwords**: Update all default credentials in production
3. **Use HTTPS**: Always use HTTPS in production
4. **Enable MFA**: Consider enabling multi-factor authentication
5. **Regular updates**: Keep dependencies updated
6. **Audit logs**: Regularly review audit logs for suspicious activity
7. **Rate limiting**: Implement rate limiting on public endpoints
8. **Input validation**: Always validate and sanitize user input

## 🎯 Future Enhancements

- WebSocket support for real-time updates
- Email notifications for deadlines and alerts
- Advanced analytics and reporting
- AI-powered question generation
- Integration with LMS platforms (Moodle, Google Classroom)
- Mobile app (PWA/Native)
- Gamification features (badges, leaderboards)
- Plagiarism detection integration
- Video proctoring
- Multiple language support

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For support and questions, please contact the development team.

---

**Version**: 1.0.0
**Last Updated**: January 2025
