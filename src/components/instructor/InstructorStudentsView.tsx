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
  Users, 
  ArrowLeft, 
  Search, 
  Mail, 
  Phone, 
  GraduationCap,
  Calendar,
  Activity
} from 'lucide-react'

interface Student {
  id: string
  userId: string
  username: string
  fullName?: string
  email?: string
  phoneNumber?: string
  studentNumber?: string
  classIds: string[]
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
    status: string
    createdAt: string
    lastLoginAt?: string
    isFirstLogin: boolean
  }
}

interface ClassInfo {
  id: string
  name: string
  section?: string
  description?: string
}

interface InstructorStudentsViewProps {
  classInfo: ClassInfo
  onClose: () => void
}

export default function InstructorStudentsView({ classInfo, onClose }: InstructorStudentsViewProps) {
  const { token } = useAuthStore()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/instructor/classes/${classInfo.id}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getAvatarUrl = (avatarPath?: string) => {
    if (!avatarPath) return undefined
    if (avatarPath.startsWith('http')) return avatarPath
    return `${window.location.origin}${avatarPath}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'INACTIVE': return 'secondary'
      case 'SUSPENDED': return 'destructive'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <VisuallyHidden>
        <DialogTitle>Students View</DialogTitle>
      </VisuallyHidden>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Students - {classInfo.name}
              </DialogTitle>
              <DialogDescription>
                {classInfo.section && `Section ${classInfo.section} • `}
                {students.length} students enrolled
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search students by name, username, or student number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Students List */}
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'No students found' : 'No students enrolled'}
                </h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm ? 'Try adjusting your search terms' : 'This class has no enrolled students yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredStudents.map((student) => (
                <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedStudent(student)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage 
                            src={getAvatarUrl(student.user.avatar)} 
                            alt={`${student.user.fullName || student.user.username}'s avatar`}
                          />
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {student.user.fullName?.split(' ').map(n => n[0]).join('') || student.user.username.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {student.user.fullName || student.user.username}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                            <span>@{student.user.username}</span>
                            {student.studentNumber && (
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                {student.studentNumber}
                              </span>
                            )}
                            <Badge variant={getStatusColor(student.user.status)} className="text-xs">
                              {student.user.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {student.user.lastLoginAt ? (
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              Last login: {new Date(student.user.lastLoginAt).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-600">
                              <Calendar className="w-3 h-3" />
                              Never logged in
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Student Details Modal */}
        {selectedStudent && (
          <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
            <VisuallyHidden>
              <DialogTitle>Student Details</DialogTitle>
            </VisuallyHidden>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Student Details</DialogTitle>
                <DialogDescription>
                  {selectedStudent.user.fullName || selectedStudent.user.username}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage 
                      src={getAvatarUrl(selectedStudent.user.avatar)} 
                      alt={`${selectedStudent.user.fullName || selectedStudent.user.username}'s avatar`}
                    />
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-lg">
                      {selectedStudent.user.fullName?.split(' ').map(n => n[0]).join('') || selectedStudent.user.username.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-lg">
                      {selectedStudent.user.fullName || selectedStudent.user.username}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">@{selectedStudent.user.username}</p>
                    <Badge variant={getStatusColor(selectedStudent.user.status)}>
                      {selectedStudent.user.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {selectedStudent.studentNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <GraduationCap className="w-4 h-4" />
                      <span>Student Number: {selectedStudent.studentNumber}</span>
                    </div>
                  )}
                  {selectedStudent.user.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      <span>{selectedStudent.user.email}</span>
                    </div>
                  )}
                  {selectedStudent.user.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4" />
                      <span>{selectedStudent.user.phoneNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Joined: {new Date(selectedStudent.user.createdAt).toLocaleDateString()}</span>
                  </div>
                  {selectedStudent.user.lastLoginAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4" />
                      <span>Last login: {new Date(selectedStudent.user.lastLoginAt).toLocaleDateString()}</span>
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
