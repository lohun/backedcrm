'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState } from '@/components/error-state'
import { login } from '@/app/actions/auth'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { type CategorizedError } from '@/lib/errors'

export function LoginForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fatalError, setFatalError] = useState<CategorizedError | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onChange',
  })

  const onSubmit = useCallback(async (data: LoginFormData) => {
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)

      const result = await login(formData)

      if (!result.success) {
        const error = result.error

        // Handle different error types
        if (error.type === 'USER') {
          if (error.targetField && ['email', 'password'].includes(error.targetField)) {
            form.setError(error.targetField as keyof LoginFormData, {
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

      // Success - redirect to dashboard
      router.push('/dashboard')
      router.refresh()
    } catch {
      setFatalError({
        type: 'SERVER',
        message: 'An unexpected error occurred.',
        instruction: 'Please try again later or contact support.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [form, router])

  // Handle retry from error state
  const handleRetry = useCallback(() => {
    setFatalError(null)
  }, [])

  // Handle back to home
  const handleBackToHome = useCallback(() => {
    router.push('/')
  }, [router])

  // If fatal error, show error state
  if (fatalError) {
    return (
      <ErrorState
        error={fatalError}
        onRetry={handleRetry}
        onBackToHome={handleBackToHome}
        preserveData={false}
      />
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />
      </div>

      {form.formState.errors.root && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {form.formState.errors.root.message}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        isLoading={isSubmitting}
        disabled={!form.formState.isValid}
      >
        Sign In
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link 
          href="/signup" 
          className="text-primary hover:underline"
        >
          Create an account
        </Link>
        <Link 
          href="/forgot-password" 
          className="text-muted-foreground hover:text-foreground"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  )
}