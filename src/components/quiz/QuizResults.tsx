'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Download,
  ArrowLeft,
} from 'lucide-react'

export interface QuizResult {
  id: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  timeSpent: number
  attemptNumber: number
  isLate: boolean
  startedAt: string
  completedAt: string
  feedback?: string
  instructorNotes?: string
  answers: {
    graded: Array<{
      questionId: string
      userAnswer: any
      correctAnswer: any
      isCorrect: boolean
      points: number
      earnedPoints: number
      explanation?: string
    }>
    raw: Record<string, any>
  }
}

interface QuizResultsProps {
  quizId: string
  token: string
  onBack?: () => void
}

export default function QuizResults({ quizId, token, onBack }: QuizResultsProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{
    quiz: {
      id: string
      title: string
      description?: string
    }
    results: QuizResult[]
  } | null>(null)

  useEffect(() => {
    fetchResults()
  }, [quizId])

  const fetchResults = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/student/quizzes/${quizId}/results?XTransformPort=3000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch results')
      }

      const resultData = await response.json()
      setData(resultData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleExport = (result: QuizResult) => {
    // Create a simple CSV export
    const csvContent = [
      ['Question', 'Your Answer', 'Correct Answer', 'Points', 'Earned'].join(','),
      ...result.answers.graded.map((q) => [
        q.questionId,
        JSON.stringify(q.userAnswer),
        JSON.stringify(q.correctAnswer),
        q.points,
        q.earnedPoints,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data?.quiz.title || 'quiz'}_result_${result.attemptNumber}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">Loading results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2">
          <CardContent className="py-8 text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-300 mb-4">{error}</p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2">
          <CardContent className="py-8 text-center">
            <p className="text-slate-600 dark:text-slate-300 mb-4">No results found for this quiz</p>
            <Button onClick={onBack}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const bestResult = data.results.sort((a, b) => b.percentage - a.percentage)[0]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            {onBack && (
              <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {data.quiz.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              {data.results.length} attempt{data.results.length > 1 ? 's' : ''} completed
            </p>
          </div>
        </div>

        {/* Best Result Overview */}
        <Card className="mb-8 border-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {bestResult.passed ? (
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Best Score</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {bestResult.percentage}%
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {bestResult.score} / {bestResult.maxScore} points
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatTime(bestResult.timeSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    Attempts
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {data.results.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Completed</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {formatDate(bestResult.completedAt)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Tabs */}
        <Card className="border-2">
          <Tabs defaultValue="latest">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
              {data.results.map((result, index) => (
                <TabsTrigger
                  key={result.id}
                  value={result.id}
                  className="border-b-2 rounded-none data-[state=active]:border-purple-600"
                >
                  Attempt {result.attemptNumber}
                </TabsTrigger>
              ))}
            </TabsList>

            {data.results.map((result) => (
              <TabsContent key={result.id} value={result.id} className="mt-6">
                {/* Result Header */}
                <div className="flex items-start justify-between mb-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Score</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {result.percentage}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Points</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {result.score} / {result.maxScore}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Time</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        {formatTime(result.timeSpent)}
                      </p>
                    </div>
                    {result.isLate && (
                      <Badge className="bg-amber-600 hover:bg-amber-600">Late Submission</Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleExport(result)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* Feedback */}
                {result.feedback && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Feedback</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">{result.feedback}</p>
                  </div>
                )}

                {result.instructorNotes && (
                  <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                      Instructor Notes
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {result.instructorNotes}
                    </p>
                  </div>
                )}

                {/* Question Breakdown */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    Question Breakdown
                  </h3>

                  <div className="space-y-3">
                    {result.answers.graded.map((q, index) => (
                      <Card key={q.questionId} className="border">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                Question {index + 1}
                              </span>
                              {q.isCorrect ? (
                                <Badge className="bg-green-600 hover:bg-green-600">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Correct
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Incorrect
                                </Badge>
                              )}
                              <Badge variant="outline">{q.points} pts</Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {q.earnedPoints} / {q.points}
                              </p>
                              <Progress
                                value={(q.earnedPoints / q.points) * 100}
                                className="h-2 w-24"
                              />
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Your Answer</p>
                              <p className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                {typeof q.userAnswer === 'object'
                                  ? JSON.stringify(q.userAnswer)
                                  : q.userAnswer || 'Not answered'}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Correct Answer</p>
                              <p className="text-slate-600 dark:text-slate-400 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
                                {typeof q.correctAnswer === 'object'
                                  ? JSON.stringify(q.correctAnswer)
                                  : q.correctAnswer}
                              </p>
                            </div>
                          </div>

                          {q.explanation && (
                            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                              <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">Explanation</p>
                              <p className="text-sm text-amber-700 dark:text-amber-300">{q.explanation}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
