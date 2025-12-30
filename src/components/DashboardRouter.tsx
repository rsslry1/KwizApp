'use client'

import { useAuthStore } from '@/store/auth'
import { useEffect } from 'react'
import StudentDashboard from '@/components/dashboards/StudentDashboard'
import InstructorDashboard from '@/components/dashboards/InstructorDashboard'
import AdminDashboard from '@/components/dashboards/AdminDashboard'
import StudentProfileSetup from '@/components/auth/StudentProfileSetup'
import { Loader2 } from 'lucide-react'

export default function DashboardRouter() {
  const { user, isAuthenticated, logout } = useAuthStore()

  // Show loader or redirect if not authenticated
  if (!isAuthenticated || !user) {
    return null
  }

  // Student first login setup
  if (user.role === 'STUDENT' && user.isFirstLogin) {
    return <StudentProfileSetup />
  }

  // Role-based dashboard routing
  switch (user.role) {
    case 'STUDENT':
      return <StudentDashboard />
    case 'INSTRUCTOR':
      return <InstructorDashboard />
    case 'ADMIN':
      return <AdminDashboard />
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading...</p>
          </div>
        </div>
      )
  }
}
