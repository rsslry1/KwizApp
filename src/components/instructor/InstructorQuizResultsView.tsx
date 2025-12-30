'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { 
  BarChart3, 
  ArrowLeft, 
  Search, 
  Users, 
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  Download,
  Eye,
  GraduationCap
} from 'lucide-react'

interface QuizResult {
  id: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  timeSpent: number
  attemptNumber: number
  isLate: boolean
  completedAt: string
  studentId: string
  studentName: string
  studentNumber?: string
  studentAvatar?: string
}

interface QuizInfo {
  id: string
  title: string
  description?: string
  timeLimit?: number
  totalPoints: number
  availableFrom?: string
  availableUntil?: string
}

interface InstructorQuizResultsViewProps {
  quizInfo: QuizInfo
  onClose: () => void
}

export default function InstructorQuizResultsView({ quizInfo, onClose }: InstructorQuizResultsViewProps) {
  const { token } = useAuthStore()
  const [results, setResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResult, setSelectedResult] = useState<QuizResult | null>(null)

  useEffect(() => {
    fetchResults()
  }, [])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/instructor/quizzes/${quizInfo.id}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
      } else {
        // Fallback: show message that results endpoint is not implemented yet
        console.log('Results endpoint not implemented yet')
        setResults([])
      }
    } catch (error) {
      console.error('Failed to fetch results:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const filteredResults = results.filter(result =>
    result.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (result.studentNumber && result.studentNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return undefined
    if (avatarPath.startsWith('http')) return avatarPath
    return `${window.location.origin}${avatarPath}`
  }

  const stats = {
    totalAttempts: results.length,
    averageScore: results.length > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length : 0,
    passRate: results.length > 0 ? (results.filter(r => r.passed).length / results.length) * 100 : 0,
    averageTime: results.length > 0 ? results.reduce((sum, r) => sum + r.timeSpent, 0) / results.length : 0
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading quiz results...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <VisuallyHidden>
        <DialogTitle>Quiz Results</DialogTitle>
      </VisuallyHidden>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Quiz Results - {quizInfo.title}
              </DialogTitle>
              <DialogDescription>
                {quizInfo.description && `${quizInfo.description} • `}
                {stats.totalAttempts} attempts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Attempts</p>
                    <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pass Rate</p>
                    <p className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Time</p>
                    <p className="text-2xl font-bold">{formatTime(Math.round(stats.averageTime))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search students by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results List */}
          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No results found' : 'No quiz attempts yet'}
                </h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? 'Try adjusting your search terms' : 'Students haven\'t taken this quiz yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedResult(result)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage 
                            src={getAvatarUrl(result.studentAvatar)} 
                            alt={`${result.studentName}'s avatar`}
                          />
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {result.studentName?.split(' ').map(n => n[0]).join('') || result.studentNumber?.slice(0, 2) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {result.studentName}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {result.studentNumber && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                {result.studentNumber}
                              </span>
                            )}
                            <span>Attempt #{result.attemptNumber}</span>
                            {result.isLate && (
                              <Badge variant="destructive" className="text-xs">
                                Late
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(result.percentage)}`}>
                          {result.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {result.score}/{result.maxScore} • {formatTime(result.timeSpent)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(result.completedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => alert('Export functionality coming soon!')}>
              <Download className="w-4 h-4 mr-2" />
              Export Results
            </Button>
          </div>
        </div>

        {/* Result Details Modal */}
        {selectedResult && (
          <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
            <VisuallyHidden>
              <DialogTitle>Quiz Result Details</DialogTitle>
            </VisuallyHidden>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Quiz Result Details</DialogTitle>
                <DialogDescription>
                  {selectedResult.studentName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(selectedResult.percentage)}`}>
                    {selectedResult.percentage.toFixed(1)}%
                  </div>
                  <div className="text-lg text-slate-600 dark:text-slate-400">
                    {selectedResult.score} / {selectedResult.maxScore} points
                  </div>
                  <Badge variant={selectedResult.passed ? 'default' : 'destructive'} className="mt-2">
                    {selectedResult.passed ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Student ID:</span>
                    <span>{selectedResult.studentId}</span>
                  </div>
                  {selectedResult.studentNumber && (
                    <div className="flex justify-between">
                      <span>Student Number:</span>
                      <span>{selectedResult.studentNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Attempt Number:</span>
                    <span>#{selectedResult.attemptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Spent:</span>
                    <span>{formatTime(selectedResult.timeSpent)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Submitted:</span>
                    <span>{new Date(selectedResult.completedAt).toLocaleString()}</span>
                  </div>
                  {selectedResult.isLate && (
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant="destructive">Late Submission</Badge>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
