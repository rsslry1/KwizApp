'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle,
  AlertTriangle,
  Maximize2,
} from 'lucide-react'

export interface Question {
  id: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK'
  question: string
  options?: string[]
  points: number
  explanation?: string
  answered?: boolean
}

export interface QuizTakingProps {
  quizId: string
  title: string
  description: string
  instructions: string
  timeLimit?: number
  questions: Question[]
  shuffleQuestions: boolean
  randomizeOptions: boolean
  fullscreenMode: boolean
  disableCopyPaste: boolean
  onSubmit: (answers: Record<string, any>) => Promise<void>
  onExit?: () => void
}

export default function QuizTaking({
  quizId,
  title,
  description,
  instructions,
  timeLimit,
  questions: initialQuestions,
  shuffleQuestions,
  randomizeOptions,
  fullscreenMode,
  disableCopyPaste,
  onSubmit,
  onExit,
}: QuizTakingProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(timeLimit ? timeLimit * 60 : null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [started, setStarted] = useState(false)

  // Shuffle questions if enabled
  const questions = shuffleQuestions
    ? [...initialQuestions].sort(() => Math.random() - 0.5)
    : initialQuestions

  // Shuffle options for each question if enabled
  const getShuffledOptions = (question: Question, originalOptions: string[]) => {
    if (!randomizeOptions || !originalOptions) return originalOptions

    const indices = originalOptions.map((_, i) => i)
    indices.sort(() => Math.random() - 0.5)

    return indices.map(i => originalOptions[i])
  }

  // Timer effect
  useEffect(() => {
    if (!started || timeRemaining === null) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) return prev
        if (prev <= 60) setShowWarning(true)
        if (prev <= 1) {
          // Auto-submit when time runs out
          const syntheticEvent = new Event('submit', { 
            bubbles: true, 
            cancelable: true 
          }) as any
          handleSubmit(syntheticEvent, true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [started])

  // Fullscreen mode
  useEffect(() => {
    if (fullscreenMode && started) {
      const enterFullscreen = async () => {
        try {
          await document.documentElement.requestFullscreen()
        } catch (error) {
          console.warn('Fullscreen not supported or denied')
        }
      }
      enterFullscreen()
    }
  }, [fullscreenMode, started])

  // Disable copy-paste
  useEffect(() => {
    if (!disableCopyPaste || !started) return

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault()
    }

    document.addEventListener('copy', handleCopyPaste)
    document.addEventListener('paste', handleCopyPaste)

    return () => {
      document.removeEventListener('copy', handleCopyPaste)
      document.removeEventListener('paste', handleCopyPaste)
    }
  }, [disableCopyPaste, started])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const toggleFlag = (questionId: string) => {
    setFlagged(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const jumpToQuestion = (index: number) => {
    setCurrentQuestion(index)
  }

  const handleSubmit = async (e: React.FormEvent, autoSubmit = false) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit(answers)
      // Navigation will be handled by parent component
    } catch (error) {
      console.error('Submit error:', error)
      setIsSubmitting(false)
    }
  }

  const answeredCount = Object.keys(answers).length
  const progress = (answeredCount / questions.length) * 100
  const currentQuestionData = questions[currentQuestion]

  // Welcome screen
  if (!started) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-2">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {instructions && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-line">{instructions}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Questions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{questions.length}</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Time Limit</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {timeLimit ? `${timeLimit} min` : 'No limit'}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Points</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {questions.reduce((sum, q) => sum + q.points, 0)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Attempts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">1</p>
              </div>
            </div>

            {fullscreenMode && (
              <Alert>
                <Maximize2 className="h-4 w-4" />
                <AlertDescription>
                  This quiz requires full-screen mode. You will be automatically switched to fullscreen when you start.
                  Exiting fullscreen may affect your submission.
                </AlertDescription>
              </Alert>
            )}

            {disableCopyPaste && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Copy and paste functionality will be disabled during this quiz.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={onExit} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setStarted(true)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{title}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Question {currentQuestion + 1} of {questions.length}
              </p>
            </div>

            {/* Timer */}
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <Clock className={`w-4 h-4 ${showWarning ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-slate-600 dark:text-slate-400'}`} />
                <span className={`font-mono font-bold ${showWarning ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}

            {/* Progress */}
            <div className="flex-1 ml-8">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {answeredCount} of {questions.length} answered
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Area */}
          <div className="lg:col-span-3">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">Question {currentQuestion + 1}</Badge>
                      <Badge variant="secondary">{currentQuestionData.points} pts</Badge>
                      {flagged.has(currentQuestionData.id) && (
                        <Badge className="bg-amber-600 hover:bg-amber-600">
                          <Flag className="w-3 h-3 mr-1" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-900 dark:text-white whitespace-pre-line">
                      {currentQuestionData.question}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFlag(currentQuestionData.id)}
                    className={flagged.has(currentQuestionData.id) ? 'text-amber-600' : ''}
                  >
                    <Flag className="w-4 h-4 mr-1" />
                    {flagged.has(currentQuestionData.id) ? 'Unflag' : 'Flag'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Multiple Choice */}
                {currentQuestionData.type === 'MULTIPLE_CHOICE' && (
                  <RadioGroup
                    value={answers[currentQuestionData.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestionData.id, parseInt(value))}
                  >
                    {getShuffledOptions(currentQuestionData, currentQuestionData.options || []).map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* True/False */}
                {currentQuestionData.type === 'TRUE_FALSE' && (
                  <RadioGroup
                    value={answers[currentQuestionData.id] || ''}
                    onValueChange={(value) => handleAnswerChange(currentQuestionData.id, parseInt(value))}
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <RadioGroupItem value="0" id="true" />
                      <Label htmlFor="true" className="flex-1 cursor-pointer">True</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <RadioGroupItem value="1" id="false" />
                      <Label htmlFor="false" className="flex-1 cursor-pointer">False</Label>
                    </div>
                  </RadioGroup>
                )}

                {/* Short Answer */}
                {currentQuestionData.type === 'SHORT_ANSWER' && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type your answer here..."
                      value={answers[currentQuestionData.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* Essay */}
                {currentQuestionData.type === 'ESSAY' && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Write your essay answer here..."
                      value={answers[currentQuestionData.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
                      rows={8}
                    />
                    <p className="text-sm text-slate-500">
                      This question will be manually graded.
                    </p>
                  </div>
                )}

                {/* Fill in the Blank */}
                {currentQuestionData.type === 'FILL_IN_BLANK' && (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Enter the answer..."
                      value={answers[currentQuestionData.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestionData.id, e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onExit}>
                  Exit Quiz
                </Button>
              </div>

              {currentQuestion === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Question Navigator */}
          <div className="space-y-4">
            <Card className="border-2 sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, index) => {
                    const isAnswered = answers[q.id] !== undefined
                    const isFlagged = flagged.has(q.id)
                    const isCurrent = index === currentQuestion

                    return (
                      <button
                        key={q.id}
                        onClick={() => jumpToQuestion(index)}
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center font-medium text-sm transition-colors
                          ${isCurrent ? 'ring-2 ring-purple-600' : ''}
                          ${isAnswered ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700'}
                          ${isFlagged && !isAnswered ? 'bg-amber-600 text-white hover:bg-amber-700' : ''}
                        `}
                      >
                        {index + 1}
                      </button>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <span>Not Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-600 rounded"></div>
                    <span>Flagged</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Time Warning */}
      {showWarning && timeRemaining !== null && timeRemaining < 60 && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert className="bg-red-600 text-white border-red-600">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-white">
              Warning: Less than {timeRemaining} seconds remaining!
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
