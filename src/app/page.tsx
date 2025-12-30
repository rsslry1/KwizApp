'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import DashboardRouter from '@/components/DashboardRouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, UserCog, Users, Lock, ArrowRight, BookOpen, Loader2 } from 'lucide-react'

export default function Home() {
  const { isAuthenticated, user } = useAuthStore()

  // Show dashboard if authenticated
  if (isAuthenticated && user) {
    return <DashboardRouter />
  }

  // Show login page if not authenticated
  return <LandingPage />
}

function LandingPage() {
  const { setAuth } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Demo login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Call login API - role will be auto-detected
      const response = await fetch('/api/auth/login?XTransformPort=3000', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setIsLoading(false)
        return
      }

      // Set auth state - role is auto-detected from server
      setAuth(
        {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          fullName: data.user.fullName,
          avatar: data.user.avatar,
          isFirstLogin: data.user.isFirstLogin,
          classIds: data.user.classIds,
        },
        data.token
      )
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/img/ICAS Logo Blue TRBG White Logo BG v2.png" 
              alt="ICAS Logo" 
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">ICAS - QAMS</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Inabanga College of Arts and Sciences - Quiz & Activity Management</p>
            </div>
          </div>
          <nav className="hidden md:flex flex-row items-center justify-center gap-6">
            <a href="#" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              About
            </a>
            <a href="#" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              Help
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Lock className="w-4 h-4" />
            ICAS Secure Learning Platform
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
            Inabanga College of Arts and Sciences
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"> Quiz Management System</span>
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
            A comprehensive quiz and activity management system designed for ICAS students and faculty.
            Secure, scalable, and user-friendly for modern educational assessment and learning activities.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Role-Based Access
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Class Isolation
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Real-time Feedback
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="max-w-md mx-auto">
          <Card className="border-2 shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !username || !password}
                  className="w-full text-white font-semibold transition-all duration-200"
                  style={{
                    background: 'linear-gradient(to right, #05166E, #031247)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #031247, #020d2e)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #05166E, #031247)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

        
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <img 
                  src="/img/ICAS Logo Blue TRBG White Logo BG v2.png" 
                  alt="ICAS Logo" 
                  className="w-8 h-8 rounded"
                />
              </div>
              <CardTitle className="text-lg">For Students</CardTitle>
              <CardDescription className="text-sm">
                Take quizzes, track progress, and receive instant feedback. Access only your class materials.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-lg">For Instructors</CardTitle>
              <CardDescription className="text-sm">
                Create and manage quizzes, monitor student progress, and generate detailed reports.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-4">
                <UserCog className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-lg">For Administrators</CardTitle>
              <CardDescription className="text-sm">
                Manage users, classes, and system settings. Full control over the educational platform.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
              <img 
                src="/img/ICAS Logo Blue TRBG White Logo BG v2.png" 
                alt="ICAS Logo" 
                className="w-5 h-5 rounded"
              />
              <span>© 2025 Inabanga College of Arts and Sciences. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
