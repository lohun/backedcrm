'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState } from '@/components/error-state'
import { signup } from '@/app/actions/auth'
import { organizationSchema, adminSchema, type OrganizationFormData, type AdminFormData } from '@/lib/validations/auth'
import { type CategorizedError } from '@/lib/errors'

// Local storage key for persistence
const STORAGE_KEY = 'signup_form_data'

interface Step1Data {
  schoolName: string
  logo: File | null
}

interface Step2Data {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

interface PersistedData {
  step1: Step1Data | null
  step2: Step2Data | null
}

export function SignupForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fatalError, setFatalError] = useState<CategorizedError | null>(null)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load persisted data on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed: PersistedData = JSON.parse(saved)
        if (parsed.step1) {
          setStep1Data(parsed.step1)
        }
        if (parsed.step2) {
          setCurrentStep(2)
        }
      } catch {
        // Ignore parse errors
      }
    }
    setIsLoaded(true)
  }, [])

  // Step 1 form
  const step1Form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      schoolName: '',
      logo: null,
    },
    mode: 'onChange',
  })



  // Step 2 form
  const step2Form = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  })
  

  // Update step 1 default values when loaded
  useEffect(() => {
    if (isLoaded && step1Data) {
      step1Form.setValue('schoolName', step1Data.schoolName)
    }
  }, [isLoaded, step1Data, step1Form])

  // Persist data to localStorage
  const persistData = useCallback((step: 'step1' | 'step2', data: Step1Data | Step2Data) => {
    const existing = localStorage.getItem(STORAGE_KEY)
    const parsed: PersistedData = existing ? JSON.parse(existing) : { step1: null, step2: null }
    if (step === 'step1') {
      parsed.step1 = data as Step1Data
    } else {
      parsed.step2 = data as Step2Data
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  }, [])

  // Clear persisted data
  const clearPersistedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Handle step 1 submission
  const onStep1Submit = useCallback(async (data: OrganizationFormData) => {
    const step1Payload: Step1Data = {
      schoolName: data.schoolName,
      logo: data.logo || null,
    }
    setStep1Data(step1Payload)
    persistData('step1', step1Payload)
    setCurrentStep(2)
  }, [persistData])

  // Handle final submission
  const onStep2Submit = useCallback(async (data: AdminFormData) => {
    if (!step1Data) return

    setIsSubmitting(true)
    persistData('step2', { 
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      confirmPassword: data.confirmPassword
    })

    try {
      // Create FormData for server action
      const formData = new FormData()
      formData.append('schoolName', step1Data.schoolName)
      if (step1Data.logo) {
        formData.append('logo', step1Data.logo)
      }
      formData.append('fullName', data.fullName)
      formData.append('email', data.email)
      formData.append('phone', data.phone)
      formData.append('password', data.password)
      formData.append('confirmPassword', data.confirmPassword)

      const result = await signup(formData)

      if (!result.success) {
        const error = result.error

        // Handle different error types
        if (error.type === 'USER') {
          if (error.targetField && ['fullName', 'email', 'phone', 'password', 'confirmPassword'].includes(error.targetField)) {
            step2Form.setError(error.targetField as keyof AdminFormData, {
              type: 'manual',
              message: error.message,
            })
          } else {
            step2Form.setError('root', {
              type: 'manual',
              message: error.message,
            })
          }
        } else if (error.type === 'NETWORK' || error.type === 'SERVER') {
          setFatalError(error)
        }
        return
      }

      // Success - clear persisted data and redirect
      clearPersistedData()
      router.push('/dashboard')
    } catch {
      setFatalError({
        type: 'SERVER',
        message: 'An unexpected error occurred.',
        instruction: 'Please try again later or contact support.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [step1Data, persistData, clearPersistedData, router, step2Form])

  // Handle retry from error state
  const handleRetry = useCallback(() => {
    setFatalError(null)
  }, [])

  // Handle back to home
  const handleBackToHome = useCallback(() => {
    clearPersistedData()
    router.push('/')
  }, [clearPersistedData, router])

  // If fatal error, show error state
  if (fatalError) {
    return (
      <ErrorState
        error={fatalError}
        onRetry={handleRetry}
        onBackToHome={handleBackToHome}
        preserveData={true}
      />
    )
  }

  if (!isLoaded) {
    return null
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step {currentStep} of 2</span>
          <span className="text-sm text-muted-foreground">
            {currentStep === 1 ? 'Organization' : 'Admin Details'}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: currentStep === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      {currentStep === 1 ? (
        <FormProvider {...step1Form}>
          <form onSubmit={step1Form.handleSubmit(onStep1Submit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                placeholder="Enter your organization name"
                error={step1Form.formState.errors.schoolName?.message}
                {...step1Form.register('schoolName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Organization Logo (Optional)</Label>
              <Input
                id="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                error={step1Form.formState.errors.logo?.message}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  step1Form.setValue('logo', file)
                }}
              />
              <p className="text-xs text-muted-foreground">
                Max 5MB. JPEG, PNG, or WebP only.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={!step1Form.formState.isValid || step1Form.formState.isSubmitting}
            >
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </form>
        </FormProvider>
      ) : (
        <FormProvider {...step2Form}>
          <form onSubmit={step2Form.handleSubmit(onStep2Submit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                error={step2Form.formState.errors.fullName?.message}
                {...step2Form.register('fullName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                error={step2Form.formState.errors.email?.message}
                {...step2Form.register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone / Momo Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+233 XX XXX XXXX"
                error={step2Form.formState.errors.phone?.message}
                {...step2Form.register('phone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                error={step2Form.formState.errors.password?.message}
                {...step2Form.register('password')}
              />
              <p className="text-xs text-muted-foreground">
                Min 8 chars, uppercase, lowercase, number & special char.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                error={step2Form.formState.errors.confirmPassword?.message}
                {...step2Form.register('confirmPassword')}
              />
            </div>

            {step2Form.formState.errors.root && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {step2Form.formState.errors.root.message}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCurrentStep(1)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                size="lg"
                isLoading={isSubmitting}
                disabled={!step2Form.formState.isValid}
              >
                Create Account
              </Button>
            </div>
          </form>
        </FormProvider>
      )}
    </div>
  )
}