'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ClassManager from '@/components/admin/ClassManager'
import StudentManager from '@/components/admin/StudentManager'
import InstructorManager from '@/components/admin/InstructorManager'
import AdminQuizManager from '@/components/admin/AdminQuizManager'
import BulkStudentGenerator from '@/components/admin/BulkStudentGenerator'
import BulkInstructorGenerator from '@/components/admin/BulkInstructorGenerator'
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  Plus,
  MoreHorizontal,
  LogOut,
  Bell,
  Building2,
  Shield,
  Settings,
  FileText,
  Activity,
} from 'lucide-react'

interface Stats {
  totalStudents: number
  totalInstructors: number
  totalClasses: number
  totalQuizzes: number
}

interface Activity {
  id: number
  action: string
  details: string
  time: string
  type: 'user' | 'class' | 'instructor' | 'quiz' | 'system'
}

export default function AdminDashboard() {
  const { user, logout, token } = useAuthStore()
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalInstructors: 0,
    totalClasses: 0,
    totalQuizzes: 0
  })
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [classFilter, setClassFilter] = useState<string>('')

  const handleNavigateToStudents = (classId: string) => {
    setClassFilter(classId)
    setActiveTab('students')
  }

  const handleNavigateToQuizzes = (classId: string) => {
    setClassFilter(classId)
    // Note: You'll need to add a quizzes tab or handle this differently
    console.log('Navigate to quizzes for class:', classId)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [studentsRes, instructorsRes, classesRes] = await Promise.all([
        fetch('/api/admin/students?limit=1', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/instructors?limit=1', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/classes', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStats(prev => ({ ...prev, totalStudents: studentsData.pagination?.total || 0 }))
      }

      if (instructorsRes.ok) {
        const instructorsData = await instructorsRes.json()
        setStats(prev => ({ ...prev, totalInstructors: instructorsData.pagination?.total || 0 }))
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json()
        setStats(prev => ({ ...prev, totalClasses: classesData.classes?.length || 0 }))
      }

      // Mock recent activities for now
      setRecentActivities([
        {
          id: 1,
          action: 'System initialized',
          details: 'Database setup completed',
          time: 'Just now',
          type: 'system'
        },
        {
          id: 2,
          action: 'Admin dashboard loaded',
          details: 'All systems operational',
          time: '1 minute ago',
          type: 'system'
        }
      ])

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-5 h-5" />
      case 'class':
        return <Building2 className="w-5 h-5" />
      case 'instructor':
        return <UserCog className="w-5 h-5" />
      case 'quiz':
        return <BookOpen className="w-5 h-5" />
      default:
        return <Activity className="w-5 h-5" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
      case 'class':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      case 'instructor':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
      case 'quiz':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
      default:
        return 'bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/img/ICAS Logo Blue TRBG White Logo BG v2.png" 
                alt="ICAS Logo" 
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  ICAS - QAMS Admin Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Inabanga College of Arts and Sciences - Quiz & Activity Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  5
                </span>
              </Button>
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'AD'}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome back, {user?.fullName || user?.username}!
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Full system control and management capabilities.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              System Settings
            </Button>
            <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
              <Plus className="w-4 h-4 mr-2" />
              Quick Actions
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Total Students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalStudents}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active accounts</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <UserCog className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Instructors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalInstructors}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all classes</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                Classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalClasses}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active sections</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Total Quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalQuizzes}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="instructors">Instructors</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{activity.action}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{activity.details}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('classes')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Class
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('tools')}>
                      <Users className="w-4 h-4 mr-2" />
                      Bulk Generate Students
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('instructors')}>
                      <UserCog className="w-4 h-4 mr-2" />
                      Add Instructor
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('tools')}>
                      <Shield className="w-4 h-4 mr-2" />
                      View Audit Logs
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      System Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">System Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Database</span>
                      <Badge variant="default">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">API Server</span>
                      <Badge variant="default">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Authentication</span>
                      <Badge variant="default">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Last Backup</span>
                      <span className="text-sm text-slate-900 dark:text-white">Just now</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="classes">
            <ClassManager 
              onNavigateToStudents={handleNavigateToStudents}
              onNavigateToQuizzes={handleNavigateToQuizzes}
            />
          </TabsContent>

          <TabsContent value="students">
            <StudentManager initialClassFilter={classFilter} />
          </TabsContent>

          <TabsContent value="instructors">
            <InstructorManager />
          </TabsContent>

          <TabsContent value="quizzes">
            <AdminQuizManager />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <BulkStudentGenerator />
              <BulkInstructorGenerator />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 bg-white dark:bg-slate-900 py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            © 2025 QAMS - Quiz & Activity Management System | Admin Panel
          </p>
        </div>
      </footer>
    </div>
  )
}
