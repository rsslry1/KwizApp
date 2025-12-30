'use client'

import { useState, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Lock, AlertCircle, CheckCircle2, LogOut, Camera, X } from 'lucide-react'

export default function StudentProfileSetup() {
  const { user, updateUser, logout } = useAuthStore()
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validatePassword = (password: string): boolean => {
    const hasMinLength = password.length >= 12
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSymbol
  }

  const validateFullName = (name: string): boolean => {
    const nameRegex = /^[A-Za-z]+ [A-Za-z]+$/
    return nameRegex.test(name.trim())
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setErrors({ avatar: 'Only JPEG, PNG, GIF, and WebP images are allowed' })
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        setErrors({ avatar: 'Image size must be less than 5MB' })
        return
      }

      setAvatar(file)
      setErrors({})

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async () => {
    if (!avatar) return

    try {
      const formData = new FormData()
      formData.append('avatar', avatar)

      const response = await fetch('/api/auth/upload-avatar?XTransformPort=3000', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${useAuthStore.getState().token}`,
        },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar')
      }

      // Update user state with new avatar
      updateUser({ avatar: data.avatarUrl })
      setAvatar(null)
      setAvatarPreview(null)

      alert('Avatar uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload avatar')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setIsSubmitting(true)
    setSuccess(false)

    const newErrors: Record<string, string> = {}

    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (!validateFullName(fullName)) {
      newErrors.fullName = 'Please enter your name as "First Last" (e.g., John Doe)'
    }

    // Validate password
    if (!newPassword) {
      newErrors.newPassword = 'Password is required'
    } else if (!validatePassword(newPassword)) {
      newErrors.newPassword = 'Password must be at least 12 characters with uppercase, lowercase, number, and symbol'
    }

    // Validate confirm password
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    // Upload avatar if selected
    if (avatar) {
      await uploadAvatar()
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update user state
    updateUser({
      fullName: fullName.trim(),
      isFirstLogin: false,
      email: email || undefined,
    })

    setSuccess(true)
    setIsSubmitting(false)
  }

  const handleLogout = () => {
    logout()
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-700 dark:text-green-400">Setup Complete!</CardTitle>
            <CardDescription>Your profile has been set up successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You can now access your student dashboard. Your full name is now locked and can only be changed by an administrator.
              </AlertDescription>
            </Alert>
            <Button onClick={handleLogout} className="w-full">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Complete Your Profile Setup
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Welcome to QAMS! Please set up your profile to continue. This is a one-time setup.
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Enter your details below. Your full name will be locked after this setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:border-purple-600 dark:hover:border-purple-600 transition-colors"
                >
                  {avatarPreview || user?.avatar ? (
                    <>
                      <img
                        src={avatarPreview || user?.avatar}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAvatarModal(true)
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <Camera className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                      <span className="text-xs text-slate-500 dark:text-slate-500 mt-1">Upload</span>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <div className="text-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Choose Photo
                  </Button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    Max size: 5MB. Click image to preview.
                  </p>
                </div>
              </div>

              {errors.avatar && (
                <p className="text-sm text-red-600 dark:text-red-400 text-center">{errors.avatar}</p>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Format: First Last (e.g., John Doe). This cannot be changed later.
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  New Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={errors.newPassword ? 'border-red-500' : ''}
                />
                {errors.newPassword && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
                )}
                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <li>• At least 12 characters long</li>
                  <li>• Contains uppercase and lowercase letters</li>
                  <li>• Contains at least one number</li>
                  <li>• Contains at least one special character (!@#$%^&*)</li>
                </ul>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Email (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  Email <span className="text-slate-400">(Optional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Used for password resets and notifications
                </p>
              </div>

              {/* Alert about first login */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your username has been changed to your full name. You will use your full name and new password for all future logins.
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="flex-1"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isSubmitting ? 'Setting up...' : 'Complete Setup'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Avatar Preview Modal */}
      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-700">
              <img
                src={avatarPreview || user?.avatar}
                alt="Profile Picture Preview"
                className="max-w-full max-h-[500px] object-contain"
              />
            </div>
            <Button onClick={() => setShowAvatarModal(false)}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
