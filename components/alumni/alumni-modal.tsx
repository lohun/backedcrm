'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { alumniSchema, type AlumniFormData } from '@/lib/validations/alumni'
import { createAlumni, updateAlumni, type Alumni } from '@/app/actions/alumni'
import { type CategorizedError } from '@/lib/errors'
import type { ActionResponse } from '@/lib/errors'

interface AlumniModalProps {
  isOpen: boolean
  onClose: () => void
  alumni?: Alumni | null
  orgId: string
  adminId: string
  onSuccess: () => void
}

export function AlumniModal({ isOpen, onClose, alumni, orgId, adminId, onSuccess }: AlumniModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fatalError, setFatalError] = useState<CategorizedError | null>(null)
  const [showDuplicateEmailSearch, setShowDuplicateEmailSearch] = useState(false)

  const isEditing = !!alumni

  const form = useForm<AlumniFormData>({
    resolver: zodResolver(alumniSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone_momo: '',
      year_group: undefined,
      house_hall: '',
      meta_id: '',
    },
    mode: 'onChange',
  })

  // Reset form when modal opens/closes or alumni changes
  useEffect(() => {
    if (isOpen) {
      if (alumni) {
        form.reset({
          full_name: alumni.full_name,
          email: alumni.email || '',
          phone_momo: alumni.phone_momo || '',
          year_group: alumni.year_group || undefined,
          house_hall: alumni.house_hall || '',
          meta_id: alumni.meta_id || '',
        })
      } else {
        form.reset({
          full_name: '',
          email: '',
          phone_momo: '',
          year_group: undefined,
          house_hall: '',
          meta_id: '',
        })
      }
      setFatalError(null)
      setShowDuplicateEmailSearch(false)
    }
  }, [isOpen, alumni, form])

  const handleSubmit = useCallback(async (data: AlumniFormData) => {
    setIsSubmitting(true)
    setShowDuplicateEmailSearch(false)

    try {
      let result: ActionResponse<{ id: string; full_name: string; email: string }>

      if (isEditing && alumni) {
        result = await updateAlumni(alumni.id, data)
      } else {
        result = await createAlumni(data, orgId, adminId)
      }

      if (!result.success) {
        const error = result.error

        // Handle duplicate email error
        if (error.type === 'USER' && error.message?.toLowerCase().includes('already exists')) {
          form.setError('email', {
            type: 'manual',
            message: 'This email is already registered. Search for this user in the table.',
          })
          setShowDuplicateEmailSearch(true)
          return
        }

        // Handle different error types
        if (error.type === 'USER') {
          if (error.targetField) {
            form.setError(error.targetField as keyof AlumniFormData, {
              type: 'manual',
              message: error.message,
            })
          } else {
            form.setError('root', {
              type: 'manual',
              message: error.message,
            })
          }
        } else if (error.type === 'NETWORK' || error.type === 'SERVER') {
          setFatalError(error)
        }
        return
      }

      // Success
      onSuccess()
      onClose()
    } catch {
      setFatalError({
        type: 'SERVER',
        message: 'An unexpected error occurred.',
        instruction: 'Please try again later or contact support.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [isEditing, alumni, orgId, adminId, form, onSuccess, onClose])

  const handleRetry = useCallback(() => {
    setFatalError(null)
  }, [])

  if (!isOpen) return null

  // Fatal error state
  if (fatalError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-destructive/10 p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">{fatalError.message}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{fatalError.instruction}</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleRetry} variant="default">
                Try Again
              </Button>
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Alumni' : 'Add New Alumni'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              placeholder="Enter full name"
              error={form.formState.errors.full_name?.message}
              {...form.register('full_name')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />
            {showDuplicateEmailSearch && (
              <p className="text-xs text-muted-foreground">
                This email is already registered. Close this modal and search for the user in the alumni table above.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_momo">Phone / Momo Number</Label>
            <Input
              id="phone_momo"
              placeholder="+233 XX XXX XXXX"
              error={form.formState.errors.phone_momo?.message}
              {...form.register('phone_momo')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year_group">Year Group</Label>
              <Input
                id="year_group"
                type="number"
                placeholder="e.g., 2010"
                error={form.formState.errors.year_group?.message}
                {...form.register('year_group', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="house_hall">House / Hall</Label>
              <Input
                id="house_hall"
                placeholder="e.g., Aggrey House"
                error={form.formState.errors.house_hall?.message}
                {...form.register('house_hall')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meta_id">Meta ID (WhatsApp/Instagram)</Label>
            <Input
              id="meta_id"
              placeholder="For messaging integration"
              error={form.formState.errors.meta_id?.message}
              {...form.register('meta_id')}
            />
          </div>

          {form.formState.errors.root && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={!form.formState.isValid}
            >
              {isEditing ? 'Update Alumni' : 'Add Alumni'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}