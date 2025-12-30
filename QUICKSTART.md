# QAMS - Quick Start Guide

## 🚀 Getting Started Quickly

### 1. Database Setup (if not already done)

```bash
# Push the schema to database
bun run db:push

# Generate Prisma client
bun run db:generate

# Seed with sample data
bun run seed
```

### 2. Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

## 🔑 Demo Login Credentials

### Admin Dashboard
- **Username**: `admin`
- **Password**: `admin123`
- **Access**: Full system management, user accounts, classes, bulk generation

### Instructor Dashboard
- **Username**: `instructor1`
- **Password**: `password123`
- **Access**: Class 2A & 2B, quiz creation, student monitoring
- **Username**: `instructor2`
- **Password**: `password123`
- **Access**: Class 3A & 3B

### Student Dashboard
- **Username**: `Student001` through `Student005`
- **Password**: `DefaultPass@2025`
- **Note**: First login requires profile setup with password change

## 📱 Key Features to Test

### Student Flow
1. Login as `Student001` / `DefaultPass@2025`
2. Complete profile setup (one-time mandatory)
   - Enter full name (e.g., "John Doe")
   - Create strong password (12+ chars, uppercase, lowercase, number, symbol)
3. View dashboard with assigned quizzes
4. See progress and pending assignments

### Instructor Flow
1. Login as `instructor1` / `password123`
2. View assigned classes (2A & 2B)
3. See created quizzes and student progress
4. Monitor student completion rates

### Admin Flow
1. Login as `admin` / `admin123`
2. View system overview (stats, classes, instructors)
3. Create new classes
4. Bulk generate student accounts
5. Assign instructors to classes

## 🔒 Security Features Demonstrated

### Authentication
- JWT-based token authentication
- Password hashing (SHA-256)
- Account lockout after 5 failed attempts
- Password strength validation

### Authorization
- Role-based access control (RBAC)
- Class-based data isolation
- API endpoint protection

### Student Security
- Mandatory first-login profile setup
- Locked full name after setup
- Password history tracking
- Cannot self-register (admin only)

## 📊 Data Model Highlights

### Users & Roles
- **Admin**: Full system access
- **Instructor**: Limited to assigned classes
- **Student**: Limited to their own classes

### Classes
- Class sections (2A, 2B, 3A, 3B)
- Student assignments
- Instructor assignments
- Quiz management

### Quizzes
- Multiple question types
- Time limits & scheduling
- Anti-cheating options
- Auto-grade objective questions

## 🎯 Testing Scenarios

### Scenario 1: Student in Class 2A
1. Login as Student001
2. Complete profile setup
3. Verify you can only see Class 2A quizzes
4. Attempt to access other class data (should be blocked)

### Scenario 2: Instructor Managing Classes
1. Login as instructor1
2. View only Classes 2A & 2B
3. Create a quiz for Class 2A
4. Verify it appears for Class 2A students

### Scenario 3: Admin Bulk Generation
1. Login as admin
2. Generate 10 new student accounts
3. Assign to Class 3B
4. Download credentials
5. Verify accounts appear in class list

## 🔧 Common Development Tasks

### Reset Database
```bash
bun run db:reset
bun run seed
```

### Check Code Quality
```bash
bun run lint
```

### Build for Production
```bash
bun run build
bun run start
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/setup-profile` - Student profile setup

### Admin
- `GET /api/admin/classes` - List classes
- `POST /api/admin/classes` - Create class
- `POST /api/admin/students/generate` - Bulk generate students

### Instructor
- `GET /api/instructor/quizzes` - List quizzes
- `POST /api/instructor/quizzes` - Create quiz

### Student
- `GET /api/student/quizzes` - List available quizzes
- `POST /api/student/quizzes/:id/submit` - Submit quiz

## 🎨 UI Features

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly interactive elements

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

### Theme Support
- Dark/light mode toggle
- Consistent color tokens
- Tailwind CSS variables

## 🐛 Troubleshooting

### Database Issues
```bash
# Reset and reseed
bun run db:reset
bun run seed
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Prisma Client Issues
```bash
# Regenerate client
bun run db:generate
```

## 📝 Next Steps

To continue development:

1. **Quiz Builder**: Implement the full quiz creation interface with multiple question types
2. **Quiz Taking**: Build the quiz interface with timer and auto-submit
3. **Real-time Features**: Add WebSocket support for live updates
4. **Analytics**: Implement detailed reporting and charts
5. **Notifications**: Add email/SMS notifications system

## 📚 Documentation

- Full documentation: `README.md`
- Database schema: `prisma/schema.prisma`
- API routes: `src/app/api/`
- Components: `src/components/`

---

**Need Help?** Check the README.md or review the code comments for detailed implementation details.
