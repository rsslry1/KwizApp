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
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  UserPlus,
  Mail,
  Phone,
  GraduationCap
} from 'lucide-react'

interface Student {
  id: string
  userId: string
  username: string
  fullName?: string
  email?: string
  phoneNumber?: string
  studentNumber?: string
  classIds: string
  status: string
  createdAt: string
  lastLoginAt?: string
  isFirstLogin: boolean
  user: {
    id: string
    username: string
    fullName?: string
    email?: string
    phoneNumber?: string
    avatar?: string
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
}

interface StudentManagerProps {
  initialClassFilter?: string
}

export default function StudentManager({ initialClassFilter }: StudentManagerProps = {}) {
  const { token } = useAuthStore()
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState(initialClassFilter || '')
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    studentNumber: '',
    classIds: [] as string[],
    status: 'ACTIVE'
  })

  useEffect(() => {
    fetchStudents()
    fetchClasses()
  }, [pagination.page, searchTerm, statusFilter, classFilter])

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(classFilter && classFilter !== 'all' && { classId: classFilter })
      })

      const response = await fetch(`/api/admin/students?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
        setPagination(data.pagination || pagination)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
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

  const handleCreateStudent = async () => {
    try {
      const response = await fetch('/api/admin/students', {
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
        fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create student')
      }
    } catch (error) {
      console.error('Failed to create student:', error)
      alert('Failed to create student')
    }
  }

  const handleUpdateStudent = async () => {
    if (!editingStudent) return

    try {
      const response = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditingStudent(null)
        resetForm()
        fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update student')
      }
    } catch (error) {
      console.error('Failed to update student:', error)
      alert('Failed to update student')
    }
  }

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete "${studentName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchStudents()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete student')
      }
    } catch (error) {
      console.error('Failed to delete student:', error)
      alert('Failed to delete student')
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      studentNumber: '',
      classIds: [],
      status: 'ACTIVE'
    })
  }

  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return undefined
    if (avatarPath.startsWith('http')) return avatarPath
    return `${window.location.origin}${avatarPath}`
  }

  const openEditDialog = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      username: student.user.username,
      password: '',
      fullName: student.user.fullName || '',
      email: student.user.email || '',
      phoneNumber: student.user.phoneNumber || '',
      studentNumber: student.studentNumber || '',
      classIds: student.classIds?.split(',').filter(Boolean) || [],
      status: student.user.status
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
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Student Management</h2>
          <p className="text-muted-foreground">Create and manage student accounts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Student</DialogTitle>
              <DialogDescription>
                Add a new student account to the system
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
                    placeholder="student001"
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
                  placeholder="John Doe"
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
                <Label htmlFor="studentNumber">Student Number</Label>
                <Input
                  id="studentNumber"
                  value={formData.studentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentNumber: e.target.value }))}
                  placeholder="STU0001"
                />
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
                <Button onClick={handleCreateStudent} disabled={!formData.username || !formData.password || !formData.fullName || formData.classIds.length === 0}>
                  Create Student
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
            placeholder="Search students..."
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

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Student</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Student Number</th>
                  <th className="text-left p-4 font-medium">Classes</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-12">
                      <div className="flex flex-col items-center">
                        <Users className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No students found</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          {searchTerm || statusFilter || classFilter ? 'Try adjusting your filters' : 'Create your first student to get started'}
                        </p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Student
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage 
                              src={getAvatarUrl(student.user.avatar)} 
                              alt={`${student.user.fullName || student.user.username}'s avatar`}
                            />
                            <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs">
                              {student.user.fullName?.split(' ').map(n => n[0]).join('') || student.user.username.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{student.user.fullName || student.user.username}</div>
                            <div className="text-sm text-muted-foreground">@{student.user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {student.user.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3" />
                              {student.user.email}
                            </div>
                          )}
                          {student.user.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3" />
                              {student.user.phoneNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          {student.studentNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {student.classIds?.split(',').filter(Boolean).map((classId) => {
                            const cls = classes.find(c => c.id === classId)
                            return cls ? (
                              <Badge key={classId} variant="outline" className="text-xs">
                                {cls.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(student.user.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(student)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteStudent(student.id, student.user.fullName || student.user.username)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information
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
                  placeholder="student001"
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
                placeholder="John Doe"
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
              <Label htmlFor="edit-studentNumber">Student Number</Label>
              <Input
                id="edit-studentNumber"
                value={formData.studentNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, studentNumber: e.target.value }))}
                placeholder="STU0001"
              />
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
              <Button variant="outline" onClick={() => setEditingStudent(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStudent} disabled={!formData.username || !formData.fullName || formData.classIds.length === 0}>
                Update Student
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
