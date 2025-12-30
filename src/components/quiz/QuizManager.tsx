'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  BookOpen, 
  Users, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Clock,
  BarChart3,
  Copy,
  Archive,
  Play
} from 'lucide-react'
import { QuizStatus, QuestionType } from '@prisma/client'
import QuestionsManager from './QuestionsManager'
import InstructorQuizResultsView from '@/components/instructor/InstructorQuizResultsView'

interface Quiz {
  id: string
  title: string
  description?: string
  instructions?: string
  timeLimit?: number
  allowedAttempts?: number
  passingScore?: number
  showResults: boolean
  shuffleQuestions: boolean
  randomizeOptions: boolean
  availableFrom?: string
  availableUntil?: string
  fullscreenMode: boolean
  disableCopyPaste: boolean
  requireProctoring: boolean
  classIds: string
  status: QuizStatus
  totalPoints: number
  createdAt: string
  updatedAt: string
  questions: any[]
  _count?: {
    quizResults: number
  }
}

interface Class {
  id: string
  name: string
  description?: string
  section?: string
  quizCount: number
  studentCount: number
}

export default function QuizManager() {
  const { user, token } = useAuthStore()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [showQuestionsManager, setShowQuestionsManager] = useState(false)
  const [showResultsView, setShowResultsView] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    timeLimit: '',
    allowedAttempts: '',
    passingScore: '',
    showResults: true,
    shuffleQuestions: false,
    randomizeOptions: false,
    availableFrom: '',
    availableUntil: '',
    fullscreenMode: false,
    disableCopyPaste: false,
    requireProctoring: false,
    classIds: [] as string[]
  })

  useEffect(() => {
    fetchQuizzes()
    fetchClasses()
  }, [])

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/instructor/quizzes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes || [])
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/instructor/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Extract classes from instructor profile
        if (data.classes && Array.isArray(data.classes)) {
          setClasses(data.classes)
        }
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const handleCreateQuiz = async () => {
    try {
      const payload = {
        ...formData,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
        allowedAttempts: formData.allowedAttempts ? parseInt(formData.allowedAttempts) : null,
        passingScore: formData.passingScore ? parseInt(formData.passingScore) : null,
        availableFrom: formData.availableFrom || null,
        availableUntil: formData.availableUntil || null,
        questions: JSON.stringify([]) // Create with empty questions array
      }

      const response = await fetch('/api/instructor/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const newQuiz = await response.json()
        setIsCreateDialogOpen(false)
        resetForm()
        fetchQuizzes()
        
        // Open questions manager for the newly created quiz
        setSelectedQuiz(newQuiz.quiz)
        setShowQuestionsManager(true)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create quiz')
      }
    } catch (error) {
      console.error('Failed to create quiz:', error)
      alert('Failed to create quiz')
    }
  }

  const handleUpdateQuiz = async () => {
    if (!editingQuiz) return

    try {
      const payload = {
        ...formData,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
        allowedAttempts: formData.allowedAttempts ? parseInt(formData.allowedAttempts) : null,
        passingScore: formData.passingScore ? parseInt(formData.passingScore) : null,
        availableFrom: formData.availableFrom || null,
        availableUntil: formData.availableUntil || null,
      }

      const response = await fetch(`/api/instructor/quizzes/${editingQuiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setEditingQuiz(null)
        resetForm()
        fetchQuizzes()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update quiz')
      }
    } catch (error) {
      console.error('Failed to update quiz:', error)
      alert('Failed to update quiz')
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/instructor/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchQuizzes()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete quiz')
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error)
      alert('Failed to delete quiz')
    }
  }

  const handlePublishQuiz = async (quizId: string) => {
    try {
      const response = await fetch(`/api/instructor/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'PUBLISHED' })
      })

      if (response.ok) {
        fetchQuizzes()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to publish quiz')
      }
    } catch (error) {
      console.error('Failed to publish quiz:', error)
      alert('Failed to publish quiz')
    }
  }

  const handleViewResults = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setShowResultsView(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      instructions: '',
      timeLimit: '',
      allowedAttempts: '',
      passingScore: '',
      showResults: true,
      shuffleQuestions: false,
      randomizeOptions: false,
      availableFrom: '',
      availableUntil: '',
      fullscreenMode: false,
      disableCopyPaste: false,
      requireProctoring: false,
      classIds: []
    })
  }

  const openEditDialog = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setFormData({
      title: quiz.title,
      description: quiz.description || '',
      instructions: quiz.instructions || '',
      timeLimit: quiz.timeLimit?.toString() || '',
      allowedAttempts: quiz.allowedAttempts?.toString() || '',
      passingScore: quiz.passingScore?.toString() || '',
      showResults: quiz.showResults,
      shuffleQuestions: quiz.shuffleQuestions,
      randomizeOptions: quiz.randomizeOptions,
      availableFrom: quiz.availableFrom || '',
      availableUntil: quiz.availableUntil || '',
      fullscreenMode: quiz.fullscreenMode,
      disableCopyPaste: quiz.disableCopyPaste,
      requireProctoring: quiz.requireProctoring,
      classIds: quiz.classIds.split(',').filter(Boolean)
    })
  }

  const openQuestionsManager = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setShowQuestionsManager(true)
  }

  const closeQuestionsManager = () => {
    setSelectedQuiz(null)
    setShowQuestionsManager(false)
    fetchQuizzes() // Refresh quizzes to get updated question counts
  }

  const getStatusBadge = (status: QuizStatus) => {
    const variants = {
      DRAFT: 'secondary',
      PUBLISHED: 'default',
      ARCHIVED: 'outline'
    } as const

    return (
      <Badge variant={variants[status]}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quizzes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quiz Management</h2>
          <p className="text-muted-foreground">Create and manage your quizzes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
              <DialogDescription>
                Set up the basic information for your new quiz
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter quiz title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this quiz is about"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instructions for students taking the quiz"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: e.target.value }))}
                    placeholder="Leave empty for no limit"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="passingScore">Passing Score (%)</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    value={formData.passingScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, passingScore: e.target.value }))}
                    placeholder="e.g., 70"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="showResults"
                  checked={formData.showResults}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showResults: checked }))}
                />
                <Label htmlFor="showResults">Show results immediately after submission</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQuiz} disabled={!formData.title}>
                  Create Quiz
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quiz List */}
      <div className="grid gap-4">
        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first quiz to get started with managing assessments
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{quiz.title}</CardTitle>
                    {quiz.description && (
                      <CardDescription className="mb-2">{quiz.description}</CardDescription>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {quiz.totalPoints} points
                      </span>
                      {quiz.timeLimit && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {quiz.timeLimit} min
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {quiz.questions?.length || 0} questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {quiz._count?.quizResults || 0} submissions
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(quiz.status)}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openQuestionsManager(quiz)}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Manage Questions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewResults(quiz)}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Results
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(quiz)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {quiz.status === 'DRAFT' && (
                          <DropdownMenuItem onClick={() => handlePublishQuiz(quiz.id)}>
                            <Play className="w-4 h-4 mr-2" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="text-destructive"
                          disabled={quiz.status !== 'DRAFT'}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(quiz.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewResults(quiz)}>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Results
                    </Button>
                    <Button size="sm" onClick={() => openQuestionsManager(quiz)}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Manage Questions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingQuiz} onOpenChange={() => setEditingQuiz(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quiz</DialogTitle>
            <DialogDescription>
              Update the quiz information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter quiz title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this quiz is about"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-instructions">Instructions</Label>
              <Textarea
                id="edit-instructions"
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Instructions for students taking the quiz"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="edit-timeLimit"
                  type="number"
                  value={formData.timeLimit}
                  onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: e.target.value }))}
                  placeholder="Leave empty for no limit"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-passingScore">Passing Score (%)</Label>
                <Input
                  id="edit-passingScore"
                  type="number"
                  value={formData.passingScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, passingScore: e.target.value }))}
                  placeholder="e.g., 70"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-showResults"
                checked={formData.showResults}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showResults: checked }))}
              />
              <Label htmlFor="edit-showResults">Show results immediately after submission</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingQuiz(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateQuiz} disabled={!formData.title}>
                Update Quiz
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Questions Manager */}
      {showQuestionsManager && selectedQuiz && (
        <QuestionsManager 
          quiz={selectedQuiz} 
          onClose={closeQuestionsManager} 
        />
      )}

      {/* Quiz Results Modal */}
      {showResultsView && selectedQuiz && (
        <InstructorQuizResultsView
          quizInfo={selectedQuiz}
          onClose={() => {
            setShowResultsView(false)
            setSelectedQuiz(null)
          }}
        />
      )}
    </div>
  )
}
