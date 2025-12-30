'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import QuizManager from '@/components/quiz/QuizManager'
import InstructorStudentsView from '@/components/instructor/InstructorStudentsView'
import InstructorQuizzesView from '@/components/instructor/InstructorQuizzesView'
import InstructorQuizResultsView from '@/components/instructor/InstructorQuizResultsView'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Plus,
  MoreHorizontal,
  LogOut,
  Bell,
  BarChart3,
  Clock,
} from 'lucide-react'

interface Quiz {
  id: string
  title: string
  status: string
  totalPoints: number
  description?: string
  timeLimit?: number
  availableFrom?: string
  availableUntil?: string
  _count: {
    quizResults: number
  }
}

interface Class {
  id: string
  name: string
  studentCount: number
  quizCount: number
}

interface Instructor {
  id: string
  userId: string
  classIds: string
}

export default function InstructorDashboard() {
  const { user, logout, token } = useAuthStore()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [instructor, setInstructor] = useState<Instructor | null>(null)
  const [quizResults, setQuizResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [showStudentsView, setShowStudentsView] = useState(false)
  const [showQuizzesView, setShowQuizzesView] = useState(false)
  const [showQuizResultsView, setShowQuizResultsView] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)

  const handleViewStudents = (cls: Class) => {
    setSelectedClass(cls)
    setShowStudentsView(true)
  }

  const handleViewQuizzes = (cls: Class) => {
    setSelectedClass(cls)
    setShowQuizzesView(true)
  }

  const handleViewQuizResults = (quiz: any) => {
    // Create a quiz object that matches the interface
    const quizData: Quiz = {
      id: quiz.id,
      title: quiz.title,
      status: quiz.status,
      totalPoints: quiz.totalPoints || 0,
      description: quiz.description || '',
      timeLimit: quiz.timeLimit,
      availableFrom: quiz.availableFrom,
      availableUntil: quiz.availableUntil,
      _count: {
        quizResults: quiz.studentsCompleted || 0
      }
    }
    setSelectedQuiz(quizData)
    setShowQuizResultsView(true)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch instructor info
      const instructorResponse = await fetch('/api/instructor/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (instructorResponse.ok) {
        const instructorData = await instructorResponse.json()
        setInstructor(instructorData.instructor)
      }

      // Fetch quizzes
      const quizzesResponse = await fetch('/api/instructor/quizzes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (quizzesResponse.ok) {
        const quizzesData = await quizzesResponse.json()
        setQuizzes(quizzesData.quizzes || [])
      }

      // Fetch classes
      const classesResponse = await fetch('/api/instructor/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (classesResponse.ok) {
        const profileData = await classesResponse.json()
        setClasses(profileData.classes || [])
      }

      // Fetch quiz results for average score calculation
      const resultsResponse = await fetch('/api/instructor/quizzes/results', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json()
        setQuizResults(resultsData.results || [])
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  // Calculate stats from real data
  const stats = {
    totalQuizzes: quizzes.length,
    activeQuizzes: quizzes.filter(q => q.status === 'PUBLISHED').length,
    totalStudents: classes.reduce((sum, cls) => sum + cls.studentCount, 0),
    averageScore: quizResults.length > 0 
      ? quizResults.reduce((sum, result) => sum + result.percentage, 0) / quizResults.length 
      : 0
  }

  const recentQuizzes = quizzes.slice(0, 5).map(quiz => {
    // Find results for this specific quiz
    const quizSpecificResults = quizResults.filter(result => result.quizId === quiz.id)
    const avgScore = quizSpecificResults.length > 0 
      ? quizSpecificResults.reduce((sum, result) => sum + result.percentage, 0) / quizSpecificResults.length 
      : 0
    
    return {
      id: quiz.id,
      title: quiz.title,
      class: 'N/A', // Would need to join with class data
      studentsCompleted: quiz._count?.quizResults || 0,
      totalStudents: 25, // Would need to calculate from assigned classes
      averageScore: avgScore,
      status: quiz.status.toLowerCase(),
    }
  })

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
                  ICAS - QAMS Instructor Dashboard
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {classes.map(c => c.name).join(', ') || 'No classes assigned'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  3
                </span>
              </Button>
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || user?.username.slice(0, 2)}
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
              Manage your classes, quizzes, and track student progress.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Total Quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalQuizzes}</div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                Active Quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.activeQuizzes}</div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Total Students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Average Score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{stats.averageScore}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quizzes">Quiz Management</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Quizzes */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    Recent Quizzes
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('quizzes')}>
                    View All
                  </Button>
                </div>

                {recentQuizzes.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Create your first quiz to get started
                      </p>
                      <Button onClick={() => setActiveTab('quizzes')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Quiz
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  recentQuizzes.map((quiz) => (
                    <Card key={quiz.id} className="border-2 hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{quiz.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 text-sm">
                              <span>Class: {quiz.class}</span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {quiz.studentsCompleted}/{quiz.totalStudents} students
                              </span>
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={quiz.status === 'published' ? 'default' : 'secondary'}
                            >
                              {quiz.status}
                            </Badge>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Average Score</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                              {quiz.averageScore}%
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleViewQuizResults(quiz)}>
                              View Results
                            </Button>
                            <Button onClick={() => setActiveTab('quizzes')}>Edit</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Classes Sidebar */}
              <div className="space-y-4">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      My Classes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {classes.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No classes assigned
                      </p>
                    ) : (
                      classes.map((cls) => (
                        <div
                          key={cls.id}
                          className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900 dark:text-white">{cls.name}</h4>
                            <Badge variant="outline">{cls.quizCount} quizzes</Badge>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {cls.studentCount} students
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('quizzes')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Quiz
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('classes')}>
                      <Users className="w-4 h-4 mr-2" />
                      Manage Classes
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quizzes">
            <QuizManager />
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Class Management</CardTitle>
                <CardDescription>
                  View and manage your assigned classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No classes assigned</h3>
                    <p className="text-muted-foreground">
                      Contact an administrator to get assigned to classes
                    </p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls) => (
                      <Card key={cls.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          <CardDescription>
                            {cls.studentCount} students • {cls.quizCount} quizzes
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleViewStudents(cls)}
                              disabled={cls.studentCount === 0}
                            >
                              View Students
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handleViewQuizzes(cls)}
                              disabled={cls.quizCount === 0}
                            >
                              View Quizzes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* View Modals */}
      {showStudentsView && selectedClass && (
        <InstructorStudentsView
          classInfo={selectedClass}
          onClose={() => {
            setShowStudentsView(false)
            setSelectedClass(null)
          }}
        />
      )}

      {showQuizzesView && selectedClass && (
        <InstructorQuizzesView
          classInfo={selectedClass}
          onClose={() => {
            setShowQuizzesView(false)
            setSelectedClass(null)
          }}
        />
      )}

      {showQuizResultsView && selectedQuiz && (
        <InstructorQuizResultsView
          quizInfo={selectedQuiz}
          onClose={() => {
            setShowQuizResultsView(false)
            setSelectedQuiz(null)
          }}
        />
      )}

      {/* Footer */}
      <footer className="border-t mt-12 bg-white dark:bg-slate-900 py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            © 2025 QAMS - Quiz & Activity Management System
          </p>
        </div>
      </footer>
    </div>
  )
}
