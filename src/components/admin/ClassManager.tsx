'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  BookOpen,
  Search,
  Filter
} from 'lucide-react'

interface Class {
  id: string
  name: string
  description?: string
  section?: string
  quizCount: number
  studentCount: number
  instructorIds: string
  createdAt: string
  updatedAt: string
}

interface ClassManagerProps {
  onNavigateToStudents?: (classId: string) => void
  onNavigateToQuizzes?: (classId: string) => void
}

export default function ClassManager({ onNavigateToStudents, onNavigateToQuizzes }: ClassManagerProps = {}) {
  const { token } = useAuthStore()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    description: ''
  })

  useEffect(() => {
    fetchClasses()
  }, [])

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
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClass = async () => {
    try {
      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreateDialogOpen(false)
        resetForm()
        fetchClasses()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create class')
      }
    } catch (error) {
      console.error('Failed to create class:', error)
      alert('Failed to create class')
    }
  }

  const handleUpdateClass = async () => {
    if (!editingClass) return

    try {
      const response = await fetch(`/api/admin/classes/${editingClass.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditingClass(null)
        resetForm()
        fetchClasses()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update class')
      }
    } catch (error) {
      console.error('Failed to update class:', error)
      alert('Failed to update class')
    }
  }

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchClasses()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete class')
      }
    } catch (error) {
      console.error('Failed to delete class:', error)
      alert('Failed to delete class')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      section: '',
      description: ''
    })
  }

  const openEditDialog = (cls: Class) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      section: cls.section || '',
      description: cls.description || ''
    })
  }

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading classes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Class Management</h2>
          <p className="text-muted-foreground">Create and manage classes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to the system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Class Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Class 2A"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                  placeholder="e.g., A, B, C"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description of the class"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClass} disabled={!formData.name}>
                  Create Class
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Classes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No classes found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Create your first class to get started'}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredClasses.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{cls.name}</CardTitle>
                    {cls.section && (
                      <CardDescription>Section {cls.section}</CardDescription>
                    )}
                    {cls.description && (
                      <CardDescription className="mt-2">{cls.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(cls)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                      disabled={cls.studentCount > 0 || cls.quizCount > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Students
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{cls.studentCount}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onNavigateToStudents?.(cls.id)}
                        disabled={cls.studentCount === 0}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Quizzes
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{cls.quizCount}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onNavigateToQuizzes?.(cls.id)}
                        disabled={cls.quizCount === 0}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(cls.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update class information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Class Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Class 2A"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-section">Section</Label>
              <Input
                id="edit-section"
                value={formData.section}
                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                placeholder="e.g., A, B, C"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of the class"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingClass(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateClass} disabled={!formData.name}>
                Update Class
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
