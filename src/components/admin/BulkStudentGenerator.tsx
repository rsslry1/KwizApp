'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  Plus,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react'

interface Class {
  id: string
  name: string
  description?: string
  section?: string
}

interface GeneratedStudent {
  id: string
  username: string
  studentNumber: string
  defaultPassword: string
  classIds: string[]
}

export default function BulkStudentGenerator() {
  const { token } = useAuthStore()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [generatedStudents, setGeneratedStudents] = useState<GeneratedStudent[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    count: 10,
    classIds: [] as string[],
    studentNumberPrefix: 'STU'
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
    }
  }

  const handleClassChange = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId]
    }))
  }

  const handleGenerateStudents = async () => {
    if (formData.classIds.length === 0) {
      alert('Please select at least one class')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/students/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedStudents(data.students || [])
        setIsDialogOpen(true)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate students')
      }
    } catch (error) {
      console.error('Failed to generate students:', error)
      alert('Failed to generate students')
    } finally {
      setLoading(false)
    }
  }

  const downloadCredentials = () => {
    const csvContent = [
      ['Username', 'Student Number', 'Default Password', 'Classes'],
      ...generatedStudents.map(student => [
        student.username,
        student.studentNumber,
        student.defaultPassword,
        student.classIds.join(', ')
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Generate Students
          </CardTitle>
          <CardDescription>
            Generate multiple student accounts at once for selected classes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="count">Number of Students</Label>
              <Input
                id="count"
                type="number"
                min="1"
                max="100"
                value={formData.count}
                onChange={(e) => setFormData(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="studentNumberPrefix">Student Number Prefix</Label>
              <Input
                id="studentNumberPrefix"
                value={formData.studentNumberPrefix}
                onChange={(e) => setFormData(prev => ({ ...prev, studentNumberPrefix: e.target.value }))}
                placeholder="e.g., STU"
              />
            </div>
            <div className="grid gap-2">
              <Label>Selected Classes</Label>
              <div className="text-sm text-muted-foreground">
                {formData.classIds.length} class{formData.classIds.length !== 1 ? 'es' : ''} selected
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Assign to Classes *</Label>
            <div className="border rounded-md p-3">
              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No classes available. Please create classes first.</p>
              ) : (
                <div className="space-y-2">
                  {classes.map((cls) => (
                    <div key={cls.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`class-${cls.id}`}
                        checked={formData.classIds.includes(cls.id)}
                        onChange={(e) => handleClassChange(cls.id)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`class-${cls.id}`} className="text-sm cursor-pointer">
                        {cls.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Selected: {formData.classIds.length} class{formData.classIds.length !== 1 ? 'es' : ''}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleGenerateStudents} 
              disabled={loading || formData.classIds.length === 0}
              className="min-w-32"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Generating...' : 'Generate Students'}
            </Button>
            
            {generatedStudents.length > 0 && (
              <Button variant="outline" onClick={downloadCredentials}>
                <Download className="w-4 h-4 mr-2" />
                Download Credentials
              </Button>
            )}
          </div>

          {generatedStudents.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Successfully generated {generatedStudents.length} student accounts
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Download the credentials file to distribute to students. Each student will need to change their password on first login.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Student Accounts</DialogTitle>
            <DialogDescription>
              Review the generated student accounts and download credentials
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-800 dark:text-blue-200">
                  Important: Save these credentials securely
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                Each student will use their username and default password for first login. They will be required to change their password immediately.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium bg-slate-50 dark:bg-slate-800">Username</th>
                    <th className="text-left p-3 font-medium bg-slate-50 dark:bg-slate-800">Student Number</th>
                    <th className="text-left p-3 font-medium bg-slate-50 dark:bg-slate-800">Default Password</th>
                    <th className="text-left p-3 font-medium bg-slate-50 dark:bg-slate-800">Assigned Classes</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedStudents.map((student, index) => (
                    <tr key={student.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono">{student.username}</td>
                      <td className="p-3 font-mono">{student.studentNumber}</td>
                      <td className="p-3 font-mono">{student.defaultPassword}</td>
                      <td className="p-3">{student.classIds.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={downloadCredentials}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
