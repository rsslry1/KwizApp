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
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  UserCog, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Mail,
  Phone,
  Users,
  Building2
} from 'lucide-react'

interface Instructor {
  id: string
  userId: string
  username: string
  fullName?: string
  email?: string
  phoneNumber?: string
  classIds: string
  status: string
  createdAt: string
  lastLoginAt?: string
  isFirstLogin: boolean
  classes?: Class[]
  totalStudents?: number
  user: {
    id: string
    username: string
    fullName?: string
    email?: string
    phoneNumber?: string
    role: string
    status: string
    createdAt: string
    lastLoginAt?: string
    isFirstLogin: boolean
  }
}

interface Class {
  id: string
  name: string
  description?: string
  section?: string
  studentCount: number
}

export default function InstructorManager() {
  const { user, token } = useAuthStore()
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])

  // Helper function to get avatar URL
  const getAvatarUrl = (avatar: string | null | undefined) => {
    if (!avatar) return ''
    if (avatar.startsWith('http')) return avatar
    // If it's a relative path, make it absolute
    return `${window.location.origin}${avatar}`
  }
  const [classFilter, setClassFilter] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    classIds: [] as string[],
    status: 'ACTIVE'
  })

  useEffect(() => {
    fetchInstructors()
    fetchClasses()
  }, [pagination.page, searchTerm, statusFilter, classFilter])

  const fetchInstructors = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(classFilter && classFilter !== 'all' && { classId: classFilter })
      })

      const response = await fetch(`/api/admin/instructors?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setInstructors(data.instructors || [])
        setPagination(data.pagination || pagination)
      }
    } catch (error) {
      console.error('Failed to fetch instructors:', error)
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
        console.log('=== Fetched Classes Debug ===')
        console.log('Classes API response:', data)
        console.log('Classes array:', data.classes)
        setClasses(data.classes || [])
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    }
  }

  const handleCreateInstructor = async () => {
    console.log('=== Creating Instructor Debug ===')
    console.log('Form data:', formData)
    console.log('Class IDs being sent:', formData.classIds)
    console.log('Available classes in UI:', classes)
    
    try {
      const response = await fetch('/api/admin/instructors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const responseData = await response.json()
      console.log('API Response:', responseData)

      if (response.ok) {
        setIsCreateDialogOpen(false)
        resetForm()
        fetchInstructors()
      } else {
        alert(responseData.error || 'Failed to create instructor')
      }
    } catch (error) {
      console.error('Failed to create instructor:', error)
      alert('Failed to create instructor')
    }
  }

  const handleUpdateInstructor = async () => {
    if (!editingInstructor) return

    try {
      const response = await fetch(`/api/admin/instructors/${editingInstructor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditingInstructor(null)
        resetForm()
        fetchInstructors()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update instructor')
      }
    } catch (error) {
      console.error('Failed to update instructor:', error)
      alert('Failed to update instructor')
    }
  }

  const handleDeleteInstructor = async (instructorId: string, instructorName: string) => {
    if (!confirm(`Are you sure you want to delete "${instructorName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/instructors/${instructorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchInstructors()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete instructor')
      }
    } catch (error) {
      console.error('Failed to delete instructor:', error)
      alert('Failed to delete instructor')
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      classIds: [],
      status: 'ACTIVE'
    })
  }

  const openEditDialog = (instructor: Instructor) => {
    setEditingInstructor(instructor)
    setFormData({
      username: instructor.user.username,
      password: '',
      fullName: instructor.user.fullName || '',
      email: instructor.user.email || '',
      phoneNumber: instructor.user.phoneNumber || '',
      classIds: instructor.classIds?.split(',').filter(Boolean) || [],
      status: instructor.user.status
    })
  }

  const handleClassChange = (classId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      classIds: checked
        ? [...prev.classIds, classId]
        : prev.classIds.filter(id => id !== classId)
    }))
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive',
      LOCKED: 'destructive'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading instructors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Instructor Management</h2>
          <p className="text-muted-foreground">Create and manage instructor accounts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Instructor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Instructor</DialogTitle>
              <DialogDescription>
                Add a new instructor account to the system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="instructor1"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Prof. John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Class Assignments *</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                  {classes.map((cls) => (
                    <div key={cls.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`class-${cls.id}`}
                        checked={formData.classIds.includes(cls.id)}
                        onCheckedChange={(checked) => handleClassChange(cls.id, checked as boolean)}
                      />
                      <Label htmlFor={`class-${cls.id}`} className="text-sm">
                        {cls.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInstructor} disabled={!formData.username || !formData.password || !formData.fullName || formData.classIds.length === 0}>
                  Create Instructor
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
            placeholder="Search instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Instructors Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instructors.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCog className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No instructors found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || statusFilter || classFilter ? 'Try adjusting your filters' : 'Create your first instructor to get started'}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Instructor
              </Button>
            </CardContent>
          </Card>
        ) : (
          instructors.map((instructor) => (
            <Card key={instructor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getAvatarUrl(instructor.user.avatar)} />
                      <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                        {instructor.user.fullName?.split(' ').map(n => n[0]).join('') || instructor.user.username?.substring(0, 2).toUpperCase() || 'IN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{instructor.user.fullName || instructor.user.username}</CardTitle>
                      <CardDescription>@{instructor.user.username}</CardDescription>
                      {instructor.user.email && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3" />
                          {instructor.user.email}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(instructor)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteInstructor(instructor.id, instructor.user.fullName || instructor.user.username)}
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
                    <Badge variant="outline">{instructor.totalStudents || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Classes
                    </span>
                    <Badge variant="outline">{instructor.classes?.length || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Status</span>
                    {getStatusBadge(instructor.user.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Joined {new Date(instructor.user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
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

      {/* Edit Dialog */}
      <Dialog open={!!editingInstructor} onOpenChange={() => setEditingInstructor(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Instructor</DialogTitle>
            <DialogDescription>
              Update instructor information
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-username">Username *</Label>
                <Input
                  id="edit-username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="instructor1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">New Password</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave empty to keep current"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-fullName">Full Name *</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Prof. John Doe"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-phoneNumber">Phone Number</Label>
                <Input
                  id="edit-phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+1234567890"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Class Assignments *</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {classes.map((cls) => (
                  <div key={cls.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-class-${cls.id}`}
                      checked={formData.classIds.includes(cls.id)}
                      onCheckedChange={(checked) => handleClassChange(cls.id, checked as boolean)}
                    />
                    <Label htmlFor={`edit-class-${cls.id}`} className="text-sm">
                      {cls.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingInstructor(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateInstructor} disabled={!formData.username || !formData.fullName || formData.classIds.length === 0}>
                Update Instructor
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
