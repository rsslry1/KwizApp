'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Search,
  Filter,
  Copy,
  Archive,
  Play
} from 'lucide-react'
import InstructorQuizResultsView from '@/components/instructor/InstructorQuizResultsView'

interface Quiz {
  id: string
  title: string
  description?: string
  status: string
  timeLimit?: number
  totalPoints: number
  availableFrom?: string
  availableUntil?: string
  createdAt: string
  classes?: Array<{ id: string, name: string }>
  creatorName?: string
  _count: {
    quizResults: number
  }
}

interface Class {
  id: string
  name: string
}

export default function AdminQuizManager() {
  const { token } = useAuthStore()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [showResultsView, setShowResultsView] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  useEffect(() => {
    fetchQuizzes()
    fetchClasses()
  }, [pagination.page, searchTerm, statusFilter, classFilter])

  const fetchQuizzes = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(classFilter && classFilter !== 'all' && { classId: classFilter })
      })

      const response = await fetch(`/api/admin/quizzes?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes || [])
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }))
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/admin/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!confirm(`Are you sure you want to delete "${quiz.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/quizzes/${quiz.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== quiz.id))
        alert('Quiz deleted successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete quiz')
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error)
      alert('Failed to delete quiz')
    }
  }

  const handleViewResults = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setShowResultsView(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'default'
      case 'DRAFT': return 'secondary'
      case 'ARCHIVED': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <Play className="w-3 h-3" />
      case 'DRAFT': return <Edit className="w-3 h-3" />
      case 'ARCHIVED': return <Archive className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  const filteredQuizzes = quizzes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quiz Management</h2>
          <p className="text-muted-foreground">Manage all quizzes in the system</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="ARCHIVED">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(cls => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading quizzes...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Quizzes Grid */}
          {filteredQuizzes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No quizzes found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || statusFilter !== 'all' || classFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Create your first quiz to get started'}
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredQuizzes.map((quiz) => (
                <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{quiz.title}</CardTitle>
                        {quiz.description && (
                          <CardDescription className="mb-2">{quiz.description}</CardDescription>
                        )}
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {quiz.timeLimit ? `${quiz.timeLimit} min` : 'No limit'}
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            {quiz.totalPoints} points
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {quiz._count.quizResults} attempts
                          </div>
                        </div>
                        {quiz.classes && quiz.classes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {quiz.classes.map(cls => (
                              <Badge key={cls.id} variant="outline" className="text-xs">
                                {cls.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(quiz.status)} className="flex items-center gap-1">
                          {getStatusIcon(quiz.status)}
                          {quiz.status}
                        </Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedQuiz(quiz)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleViewResults(quiz)}>
                            <BarChart3 className="w-4 h-4 mr-1" />
                            Results
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteQuiz(quiz)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Created by {quiz.creatorName || 'Unknown'} • {new Date(quiz.createdAt).toLocaleDateString()}
                        {quiz.availableFrom && (
                          <span className="ml-4">
                            Available: {new Date(quiz.availableFrom).toLocaleDateString()}
                          </span>
                        )}
                        {quiz.availableUntil && (
                          <span className="ml-4">
                            Until: {new Date(quiz.availableUntil).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          Results
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Quiz Details Modal */}
      {selectedQuiz && (
        <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                {selectedQuiz.title}
              </DialogTitle>
              <DialogDescription>
                <Badge variant={getStatusColor(selectedQuiz.status)} className="flex items-center gap-1 w-fit">
                  {getStatusIcon(selectedQuiz.status)}
                  {selectedQuiz.status}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedQuiz.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-slate-600 dark:text-slate-400">{selectedQuiz.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Quiz Details</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Time Limit: {selectedQuiz.timeLimit ? `${selectedQuiz.timeLimit} minutes` : 'No limit'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Total Points: {selectedQuiz.totalPoints}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Total Attempts: {selectedQuiz._count.quizResults}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Schedule</h4>
                  <div className="space-y-1 text-sm">
                    <div>Created: {new Date(selectedQuiz.createdAt).toLocaleDateString()}</div>
                    {selectedQuiz.availableFrom && (
                      <div>Available: {new Date(selectedQuiz.availableFrom).toLocaleDateString()}</div>
                    )}
                    {selectedQuiz.availableUntil && (
                      <div>Until: {new Date(selectedQuiz.availableUntil).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Quiz
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button className="flex-1" onClick={() => handleViewResults(selectedQuiz!)}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Results
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
