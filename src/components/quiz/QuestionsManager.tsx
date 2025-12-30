'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  GripVertical,
  Eye,
  EyeOff
} from 'lucide-react'

interface Question {
  id: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY'
  question: string
  options?: string[]
  correctAnswer: string | number
  points: number
  explanation?: string
}

interface Quiz {
  id: string
  title: string
  description?: string
  questions: Question[]
  totalPoints: number
}

interface QuestionsManagerProps {
  quiz: Quiz
  onClose: () => void
}

export default function QuestionsManager({ quiz, onClose }: QuestionsManagerProps) {
  const { token } = useAuthStore()
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    type: 'MULTIPLE_CHOICE' as Question['type'],
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 10,
    explanation: ''
  })

  useEffect(() => {
    setQuestions(quiz.questions || [])
    setLoading(false)
  }, [quiz])

  const resetForm = () => {
    setFormData({
      type: 'MULTIPLE_CHOICE',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 10,
      explanation: ''
    })
    setEditingQuestion(null)
  }

  const handleCreateQuestion = async () => {
    try {
      const questionData = {
        type: formData.type,
        question: formData.question,
        points: formData.points,
        explanation: formData.explanation,
        ...(formData.type === 'MULTIPLE_CHOICE' && {
          options: formData.options.filter(opt => opt.trim() !== ''),
          correctAnswer: parseInt(formData.correctAnswer)
        }),
        ...(formData.type === 'TRUE_FALSE' && {
          options: ['True', 'False'],
          correctAnswer: parseInt(formData.correctAnswer)
        }),
        ...(formData.type === 'SHORT_ANSWER' && {
          correctAnswer: formData.correctAnswer
        })
      }

      const updatedQuestions = [...questions, { ...questionData, id: Date.now().toString() }]
      
      const response = await fetch(`/api/instructor/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questions: updatedQuestions,
          totalPoints: updatedQuestions.reduce((sum, q) => sum + q.points, 0)
        })
      })

      if (response.ok) {
        setQuestions(updatedQuestions)
        setIsCreateDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to add question')
      }
    } catch (error) {
      console.error('Failed to add question:', error)
      alert('Failed to add question')
    }
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return

    try {
      const questionData = {
        type: formData.type,
        question: formData.question,
        points: formData.points,
        explanation: formData.explanation,
        ...(formData.type === 'MULTIPLE_CHOICE' && {
          options: formData.options.filter(opt => opt.trim() !== ''),
          correctAnswer: parseInt(formData.correctAnswer)
        }),
        ...(formData.type === 'TRUE_FALSE' && {
          options: ['True', 'False'],
          correctAnswer: parseInt(formData.correctAnswer)
        }),
        ...(formData.type === 'SHORT_ANSWER' && {
          correctAnswer: formData.correctAnswer
        })
      }

      const updatedQuestions = questions.map(q => 
        q.id === editingQuestion.id ? { ...questionData, id: editingQuestion.id } : q
      )
      
      const response = await fetch(`/api/instructor/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questions: updatedQuestions,
          totalPoints: updatedQuestions.reduce((sum, q) => sum + q.points, 0)
        })
      })

      if (response.ok) {
        setQuestions(updatedQuestions)
        setEditingQuestion(null)
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update question')
      }
    } catch (error) {
      console.error('Failed to update question:', error)
      alert('Failed to update question')
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      const updatedQuestions = questions.filter(q => q.id !== questionId)
      
      const response = await fetch(`/api/instructor/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questions: updatedQuestions,
          totalPoints: updatedQuestions.reduce((sum, q) => sum + q.points, 0)
        })
      })

      if (response.ok) {
        setQuestions(updatedQuestions)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete question')
      }
    } catch (error) {
      console.error('Failed to delete question:', error)
      alert('Failed to delete question')
    }
  }

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question)
    setFormData({
      type: question.type,
      question: question.question,
      options: question.options || ['', '', '', ''],
      correctAnswer: question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE' 
        ? question.correctAnswer.toString() 
        : question.correctAnswer,
      points: question.points,
      explanation: question.explanation || ''
    })
  }

  const getQuestionTypeLabel = (type: Question['type']) => {
    const labels = {
      MULTIPLE_CHOICE: 'Multiple Choice',
      TRUE_FALSE: 'True/False',
      SHORT_ANSWER: 'Short Answer',
      ESSAY: 'Essay'
    }
    return labels[type]
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading questions...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quiz
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-muted-foreground">{quiz.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first question to get started with this quiz
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Question
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Question {index + 1}
                      </span>
                      <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                        {getQuestionTypeLabel(question.type)}
                      </span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        {question.points} points
                      </span>
                    </div>
                    <CardTitle className="text-base mb-2">{question.question}</CardTitle>
                    {question.options && (
                      <div className="space-y-1">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 text-sm">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              question.correctAnswer === optIndex 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                    {question.explanation && (
                      <p className="text-sm text-muted-foreground mt-2">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(question)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(question.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Question Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingQuestion} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setEditingQuestion(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion ? 'Update the question details below.' : 'Create a new question for this quiz.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Question Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: Question['type']) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                  <SelectItem value="TRUE_FALSE">True/False</SelectItem>
                  <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Question</Label>
              <Textarea
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter your question here..."
                rows={3}
              />
            </div>

            {(formData.type === 'MULTIPLE_CHOICE' || formData.type === 'TRUE_FALSE') && (
              <div className="space-y-2">
                <Label>Options</Label>
                {formData.type === 'MULTIPLE_CHOICE' ? (
                  formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...formData.options]
                          newOptions[index] = e.target.value
                          setFormData(prev => ({ ...prev, options: newOptions }))
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      />
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">A</span>
                      <span>True</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">B</span>
                      <span>False</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(formData.type === 'MULTIPLE_CHOICE' || formData.type === 'TRUE_FALSE') && (
              <div className="grid gap-2">
                <Label>Correct Answer</Label>
                <Select 
                  value={formData.correctAnswer} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, correctAnswer: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct answer" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.type === 'MULTIPLE_CHOICE' ? (
                      formData.options.map((option, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {String.fromCharCode(65 + index)}: {option || 'Option ' + String.fromCharCode(65 + index)}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="0">A: True</SelectItem>
                        <SelectItem value="1">B: False</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.type === 'SHORT_ANSWER' && (
              <div className="grid gap-2">
                <Label>Correct Answer</Label>
                <Input
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                  placeholder="Enter the correct answer..."
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Points</Label>
              <Input
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="grid gap-2">
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explain why this is the correct answer..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false)
              setEditingQuestion(null)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button 
              onClick={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
              disabled={!formData.question || !formData.correctAnswer}
            >
              {editingQuestion ? 'Update Question' : 'Add Question'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
