'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Trash2,
  GripVertical,
  ArrowRight,
  Save,
  X,
  Clock,
  Target,
  Shield,
} from 'lucide-react'

export interface Question {
  id: string
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK'
  question: string
  options?: string[]
  correctAnswer?: string | number
  points: number
  explanation?: string
}

export interface QuizFormData {
  title: string
  description: string
  instructions: string
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
  classIds: string[]
  questions: Question[]
}

interface QuizBuilderProps {
  initialData?: Partial<QuizFormData>
  availableClasses: Array<{ id: string; name: string }>
  onSave: (data: QuizFormData) => Promise<void>
  onCancel?: () => void
  isSaving?: boolean
}

export default function QuizBuilder({
  initialData,
  availableClasses,
  onSave,
  onCancel,
  isSaving = false,
}: QuizBuilderProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'questions' | 'settings'>('details')
  const [formData, setFormData] = useState<QuizFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    instructions: initialData?.instructions || '',
    timeLimit: initialData?.timeLimit || undefined,
    allowedAttempts: initialData?.allowedAttempts || undefined,
    passingScore: initialData?.passingScore || undefined,
    showResults: initialData?.showResults ?? true,
    shuffleQuestions: initialData?.shuffleQuestions ?? false,
    randomizeOptions: initialData?.randomizeOptions ?? false,
    availableFrom: initialData?.availableFrom || '',
    availableUntil: initialData?.availableUntil || '',
    fullscreenMode: initialData?.fullscreenMode ?? false,
    disableCopyPaste: initialData?.disableCopyPaste ?? false,
    requireProctoring: initialData?.requireProctoring ?? false,
    classIds: initialData?.classIds || [],
    questions: initialData?.questions || [],
  })

  const [selectedClasses, setSelectedClasses] = useState<string[]>(initialData?.classIds || [])

  const updateField = (field: keyof QuizFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: `q${Date.now()}`,
      type,
      question: '',
      points: 10,
    }

    if (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') {
      newQuestion.options = type === 'TRUE_FALSE' ? ['True', 'False'] : ['', '', '', '']
      newQuestion.correctAnswer = 0
    } else {
      newQuestion.correctAnswer = ''
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }))
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...updates } : q)),
    }))
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }))
  }

  const toggleClassSelection = (classId: string) => {
    setSelectedClasses(prev => {
      const newSelection = prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
      setFormData(prev => ({ ...prev, classIds: newSelection }))
      return newSelection
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  const totalPoints = formData.questions.reduce((sum, q) => sum + q.points, 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {initialData?.title ? 'Edit Quiz' : 'Create New Quiz'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Build and configure your quiz with multiple question types
            </p>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSaving || !formData.title || formData.questions.length === 0}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Quiz'}
            </Button>
          </div>
        </div>

        {/* Quiz Info Bar */}
        <Card className="mb-6 border-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Questions</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{formData.questions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Points</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalPoints}</p>
                </div>
                {formData.timeLimit && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Time Limit</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{formData.timeLimit} min</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {formData.shuffleQuestions && <Badge variant="outline">Shuffle Questions</Badge>}
                {formData.randomizeOptions && <Badge variant="outline">Randomize Options</Badge>}
                {formData.disableCopyPaste && <Badge variant="outline">No Copy-Paste</Badge>}
                {formData.fullscreenMode && <Badge variant="outline">Fullscreen</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Information</CardTitle>
                <CardDescription>Basic information about your quiz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Mathematics - Chapter 1"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the quiz..."
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Instructions for students taking the quiz..."
                    value={formData.instructions}
                    onChange={(e) => updateField('instructions', e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Assign to Classes</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableClasses.map((cls) => (
                      <div
                        key={cls.id}
                        onClick={() => toggleClassSelection(cls.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedClasses.includes(cls.id)
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{cls.name}</span>
                          {selectedClasses.includes(cls.id) && (
                            <div className="w-4 h-4 bg-indigo-600 rounded-full" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            {/* Add Question Buttons */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Add Question</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => addQuestion('MULTIPLE_CHOICE')}
                    className="flex flex-col h-20 items-center justify-center gap-1"
                  >
                    <span className="font-semibold">MCQ</span>
                    <span className="text-xs text-slate-500">Multiple Choice</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addQuestion('TRUE_FALSE')}
                    className="flex flex-col h-20 items-center justify-center gap-1"
                  >
                    <span className="font-semibold">T/F</span>
                    <span className="text-xs text-slate-500">True or False</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addQuestion('SHORT_ANSWER')}
                    className="flex flex-col h-20 items-center justify-center gap-1"
                  >
                    <span className="font-semibold">Short</span>
                    <span className="text-xs text-slate-500">Short Answer</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addQuestion('ESSAY')}
                    className="flex flex-col h-20 items-center justify-center gap-1"
                  >
                    <span className="font-semibold">Essay</span>
                    <span className="text-xs text-slate-500">Long Form</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => addQuestion('FILL_IN_BLANK')}
                    className="flex flex-col h-20 items-center justify-center gap-1"
                  >
                    <span className="font-semibold">Fill</span>
                    <span className="text-xs text-slate-500">Fill in Blank</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Questions List */}
            {formData.questions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-slate-500 dark:text-slate-400 mb-4">No questions added yet</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Click on a question type above to add your first question
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {formData.questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    onUpdate={(updates) => updateQuestion(index, updates)}
                    onRemove={() => removeQuestion(index)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Settings</CardTitle>
                <CardDescription>Configure quiz behavior and restrictions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeLimit" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time Limit (minutes)
                      </Label>
                      <Input
                        id="timeLimit"
                        type="number"
                        placeholder="30"
                        value={formData.timeLimit || ''}
                        onChange={(e) => updateField('timeLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                      <p className="text-xs text-slate-500">Leave empty for no time limit</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allowedAttempts" className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Allowed Attempts
                      </Label>
                      <Input
                        id="allowedAttempts"
                        type="number"
                        placeholder="1"
                        value={formData.allowedAttempts || ''}
                        onChange={(e) => updateField('allowedAttempts', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                      <p className="text-xs text-slate-500">Leave empty for unlimited attempts</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passingScore">Passing Score (%)</Label>
                      <Input
                        id="passingScore"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="70"
                        value={formData.passingScore || ''}
                        onChange={(e) => updateField('passingScore', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="availableFrom">Available From</Label>
                      <Input
                        id="availableFrom"
                        type="datetime-local"
                        value={formData.availableFrom}
                        onChange={(e) => updateField('availableFrom', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availableUntil">Available Until</Label>
                      <Input
                        id="availableUntil"
                        type="datetime-local"
                        value={formData.availableUntil}
                        onChange={(e) => updateField('availableUntil', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Display Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showResults">Show Results to Students</Label>
                      <Switch
                        id="showResults"
                        checked={formData.showResults}
                        onCheckedChange={(checked) => updateField('showResults', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                      <Switch
                        id="shuffleQuestions"
                        checked={formData.shuffleQuestions}
                        onCheckedChange={(checked) => updateField('shuffleQuestions', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="randomizeOptions">Randomize Options</Label>
                      <Switch
                        id="randomizeOptions"
                        checked={formData.randomizeOptions}
                        onCheckedChange={(checked) => updateField('randomizeOptions', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fullscreenMode">Full-Screen Mode</Label>
                      <Switch
                        id="fullscreenMode"
                        checked={formData.fullscreenMode}
                        onCheckedChange={(checked) => updateField('fullscreenMode', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="disableCopyPaste">Disable Copy-Paste</Label>
                      <Switch
                        id="disableCopyPaste"
                        checked={formData.disableCopyPaste}
                        onCheckedChange={(checked) => updateField('disableCopyPaste', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="requireProctoring">Require Proctoring</Label>
                      <Switch
                        id="requireProctoring"
                        checked={formData.requireProctoring}
                        onCheckedChange={(checked) => updateField('requireProctoring', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Question Card Component
function QuestionCard({
  question,
  index,
  onUpdate,
  onRemove,
}: {
  question: Question
  index: number
  onUpdate: (updates: Partial<Question>) => void
  onRemove: () => void
}) {
  const questionTypes = {
    MULTIPLE_CHOICE: 'Multiple Choice',
    TRUE_FALSE: 'True/False',
    SHORT_ANSWER: 'Short Answer',
    ESSAY: 'Essay',
    FILL_IN_BLANK: 'Fill in the Blank',
  }

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <GripVertical className="w-5 h-5 text-slate-400 mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Question {index + 1}
                </span>
                <Badge variant="outline">{questionTypes[question.type]}</Badge>
                <Badge variant="secondary">{question.points} pts</Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question Text */}
        <div className="space-y-2">
          <Label>Question *</Label>
          <Textarea
            placeholder="Enter your question here..."
            value={question.question}
            onChange={(e) => onUpdate({ question: e.target.value })}
            rows={3}
          />
        </div>

        {/* Options for MCQ and True/False */}
        {(question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') && (
          <div className="space-y-2">
            <Label>Options *</Label>
            <div className="space-y-2">
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <div
                    onClick={() => onUpdate({ correctAnswer: optIndex })}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center transition-colors ${
                      question.correctAnswer === optIndex
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {question.correctAnswer === optIndex && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(question.options || [])]
                      newOptions[optIndex] = e.target.value
                      onUpdate({ options: newOptions })
                    }}
                    placeholder={question.type === 'TRUE_FALSE' ? undefined : `Option ${optIndex + 1}`}
                    disabled={question.type === 'TRUE_FALSE'}
                  />
                  {question.correctAnswer === optIndex && (
                    <Badge className="bg-green-600 hover:bg-green-600">Correct</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correct Answer for Short Answer, Essay, Fill in Blank */}
        {(question.type === 'SHORT_ANSWER' || question.type === 'ESSAY' || question.type === 'FILL_IN_BLANK') && (
          <div className="space-y-2">
            <Label>{question.type === 'ESSAY' ? 'Answer Key (for grading)' : 'Correct Answer'}</Label>
            <Textarea
              placeholder={question.type === 'ESSAY' ? 'Enter the model answer for reference...' : 'Enter the correct answer...'}
              value={question.correctAnswer || ''}
              onChange={(e) => onUpdate({ correctAnswer: e.target.value })}
              rows={2}
            />
          </div>
        )}

        {/* Explanation */}
        <div className="space-y-2">
          <Label>Explanation (optional)</Label>
          <Textarea
            placeholder="Add an explanation that students will see after completing the quiz..."
            value={question.explanation || ''}
            onChange={(e) => onUpdate({ explanation: e.target.value })}
            rows={2}
          />
        </div>

        {/* Points */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor={`points-${question.id}`}>Points:</Label>
            <Input
              id={`points-${question.id}`}
              type="number"
              min="1"
              value={question.points}
              onChange={(e) => onUpdate({ points: parseInt(e.target.value) || 1 })}
              className="w-20"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
