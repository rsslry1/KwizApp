'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import QuizTaking from '@/components/quiz/QuizTaking'
import QuizResults from '@/components/quiz/QuizResults'
import NotificationDropdown from '@/components/ui/NotificationDropdown'
import StudentSettings from '@/components/student/StudentSettings'
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Clock,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Bell,
  Search,
  Filter,
  Loader2,
  Settings,
  Users,
  X,
} from 'lucide-react'

type View = 'dashboard' | 'quiz' | 'results' | 'list' | 'instructors'

export interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  passingScore?: number
  availableFrom?: string
  availableUntil?: string
  questions: any[]
  isCompleted: boolean
}

export default function StudentDashboard() {
  const { user, token, logout } = useAuthStore()
  const [view, setView] = useState<View>('dashboard')
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [showInstructors, setShowInstructors] = useState(false)
  const [instructors, setInstructors] = useState<any[]>([])
  const [instructorsLoading, setInstructorsLoading] = useState(false)
  const [quizStartTime, setQuizStartTime] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (token) {
      fetchQuizzes()
    }
  }, [token])

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/quizzes?XTransformPort=3000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch quizzes')
      }

      const data = await response.json()
      setQuizzes(data.quizzes || [])
    } catch (error) {
      console.error('Error fetching quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setQuizStartTime(new Date().toISOString())
    setView('quiz')
  }

  const handleViewResults = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setQuizStartTime(null)
    setView('results')
  }

  const handleQuizSubmit = async (answers: Record<string, any>) => {
    if (!quizStartTime) {
      console.error('Quiz start time not set')
      return
    }

    try {
      const response = await fetch('/api/student/quizzes/submit?XTransformPort=3000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId: selectedQuiz?.id,
          answers,
          startedAt: quizStartTime,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit quiz')
      }

      const data = await response.json()
      console.log('Quiz submitted successfully:', data)

      // After submission, show results
      setView('results')
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit quiz')
    }
  }

  const handleExitQuiz = () => {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
      setSelectedQuiz(null)
      setQuizStartTime(null)
      setView('dashboard')
    }
  }

  const handleBackToDashboard = () => {
    setView('dashboard')
    setSelectedQuiz(null)
    fetchQuizzes() // Refresh quizzes
  }

  const handleViewAllQuizzes = () => {
    setView('list')
    setSelectedQuiz(null)
  }

  const handleViewLeaderboard = () => {
    alert('Leaderboard feature coming soon!')
  }

  const handleViewInstructors = async () => {
    setShowInstructors(true)
    setInstructorsLoading(true)
    try {
      const response = await fetch('/api/student/instructors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setInstructors(data.instructors || [])
      } else {
        console.error('Failed to fetch instructors')
      }
    } catch (error) {
      console.error('Error fetching instructors:', error)
    } finally {
      setInstructorsLoading(false)
    }
  }

  const handleSettings = () => {
    setSettingsOpen(true)
  }

  // Show Quiz Taking View
  if (view === 'quiz' && selectedQuiz) {
    return (
      <QuizTaking
        quizId={selectedQuiz.id}
        title={selectedQuiz.title}
        description={selectedQuiz.description || ''}
        instructions={''}
        timeLimit={selectedQuiz.timeLimit}
        questions={selectedQuiz.questions}
        shuffleQuestions={false}
        randomizeOptions={false}
        fullscreenMode={false}
        disableCopyPaste={false}
        onSubmit={handleQuizSubmit}
        onExit={handleExitQuiz}
      />
    )
  }

  // Show Quiz Results View
  if (view === 'results' && selectedQuiz && token) {
    return (
      <QuizResults
        quizId={selectedQuiz.id}
        token={token}
        onBack={handleBackToDashboard}
      />
    )
  }

  const handleLogout = () => {
    logout()
  }

  const availableQuizzes = quizzes.filter(q => !q.isCompleted)
  const completedQuizzes = quizzes.filter(q => q.isCompleted)

  const now = new Date()
  const pendingQuizzes = availableQuizzes.filter(q => {
    if (!q.availableFrom) return true
    return new Date(q.availableFrom) <= now
  })

  const upcomingQuizzes = availableQuizzes.filter(q => {
    if (!q.availableFrom) return false
    return new Date(q.availableFrom) > now
  })

  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return undefined
    // If it's already an absolute URL, return as is
    if (avatarPath.startsWith('http')) return avatarPath
    // If it's a relative path, make it absolute
    return `${window.location.origin}${avatarPath}`
  }

  // Main Dashboard View
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
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">ICAS - QAMS Student Dashboard</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Welcome back, {user?.fullName || user?.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                <Settings className="w-5 h-5" />
              </Button>
              <Avatar>
                <AvatarImage src={getAvatarUrl(user?.avatar)} />
                <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || user?.username?.substring(0, 2).toUpperCase() || 'ST'}
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome back, {user?.fullName || user?.username}!
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Here's an overview of your progress and upcoming activities.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                Completed Quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{completedQuizzes.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Available Quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{pendingQuizzes.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Upcoming Quizzes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{upcomingQuizzes.length}</div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Completion Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {quizzes.length > 0 ? Math.round((completedQuizzes.length / quizzes.length) * 100) : 0}%
              </div>
              <Progress
                value={quizzes.length > 0 ? (completedQuizzes.length / quizzes.length) * 100 : 0}
                className="h-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        )}

        {/* Main Content Grid */}
        {!loading && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Pending Quizzes */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Available Quizzes
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={fetchQuizzes}>
                    <Search className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              {pendingQuizzes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-300">No available quizzes at the moment</p>
                  </CardContent>
                </Card>
              ) : (
                pendingQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="border-2 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{quiz.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 text-sm">
                            {quiz.timeLimit && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {quiz.timeLimit} minutes
                              </span>
                            )}
                            {quiz.availableUntil && (
                              <span className="flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                Deadline: {new Date(quiz.availableUntil).toLocaleDateString()}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        {quiz.passingScore && (
                          <Badge variant="outline">{quiz.passingScore}% to pass</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => handleStartQuiz(quiz)}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      >
                        Start Quiz
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Upcoming Quizzes */}
              {upcomingQuizzes.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-4 mt-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Upcoming Quizzes
                    </h3>
                  </div>

                  {upcomingQuizzes.map((quiz) => (
                    <Card key={quiz.id} className="border-2 opacity-75">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1">{quiz.title}</CardTitle>
                            <CardDescription className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Available: {quiz.availableFrom ? new Date(quiz.availableFrom).toLocaleDateString() : 'Soon'}
                              </span>
                            </CardDescription>
                          </div>
                          <Badge className="bg-blue-600 hover:bg-blue-600">Coming Soon</Badge>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </>
              )}

              {/* Completed Quizzes */}
              <div className="flex items-center justify-between mb-4 mt-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Completed Quizzes
                </h3>
              </div>

              {completedQuizzes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-300">No completed quizzes yet</p>
                  </CardContent>
                </Card>
              ) : (
                completedQuizzes.map((quiz) => (
                  <Card key={quiz.id} className="border-2">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{quiz.title}</CardTitle>
                          <CardDescription className="text-sm">
                            View your detailed results and performance
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        onClick={() => handleViewResults(quiz)}
                        className="w-full"
                      >
                        View Results
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Notifications */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingQuizzes.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Quiz Available
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        {pendingQuizzes.length} quiz{pendingQuizzes.length > 1 ? 'es are' : ' is'} ready to take
                      </p>
                    </div>
                  )}
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      Keep Up the Good Work!
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Continue learning by completing your quizzes
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={handleViewAllQuizzes}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    View All Quizzes
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleViewLeaderboard}>
                    <Trophy className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleViewInstructors}>
                    <Users className="w-4 h-4 mr-2" />
                    View Instructors
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleSettings}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Instructors View */}
      {showInstructors && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Instructors</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowInstructors(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              {instructorsLoading ? (
                <div className="text-center text-slate-600 dark:text-slate-300 mb-4">
                  <Users className="w-12 h-12 mx-auto text-slate-400" />
                  <p className="mt-2">Loading instructors...</p>
                </div>
              ) : instructors.length === 0 ? (
                <div className="text-center text-slate-600 dark:text-slate-300 mb-4">
                  <Users className="w-12 h-12 mx-auto text-slate-400" />
                  <p className="mt-2">No instructors assigned to your classes</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {instructors.map((instructor) => (
                    <div key={instructor.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getAvatarUrl(instructor.user.avatar)} />
                        <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                          {instructor.user.fullName?.split(' ').map(n => n[0]).join('') || instructor.user.username?.substring(0, 2).toUpperCase() || 'IN'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {instructor.user.fullName || instructor.user.username}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          @{instructor.user.username}
                        </p>
                        {instructor.user.email && (
                          <p className="text-sm text-slate-500 dark:text-slate-500">
                            {instructor.user.email}
                          </p>
                        )}
                        {instructor.classes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {instructor.classes.map((cls: any) => (
                              <Badge key={cls.id} variant="outline" className="text-xs">
                                {cls.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t mt-12 bg-white dark:bg-slate-900 py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-slate-600 dark:text-slate-400">
            2025 QAMS - Quiz & Activity Management System
            © 2025 QAMS - Quiz & Activity Management System
          </p>
        </div>
      </footer>

      {/* Student Settings Modal */}
      <StudentSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
