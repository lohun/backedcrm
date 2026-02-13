'use client'

import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { type CategorizedError, type ErrorCategory } from '@/lib/errors'

interface ErrorStateProps {
  error: CategorizedError
  onRetry?: () => void
  onBackToHome?: () => void
  preserveData?: boolean
}

const errorIcons: Record<ErrorCategory, React.ReactNode> = {
  USER: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  NETWORK: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.138m2.167 9.138l-2.829-2.829m2.829 2.829L3 21m11.293-11.293l2.829 2.829M15.536 8.464L12 12m-2.829 2.829l-2.829 2.829" />
    </svg>
  ),
  SERVER: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
    </svg>
  ),
}

export function ErrorState({ error, onRetry, onBackToHome, preserveData = true }: ErrorStateProps) {
  const handleBackToHome = useCallback(() => {
    if (onBackToHome) {
      onBackToHome()
    } else {
      window.location.href = '/'
    }
  }, [onBackToHome])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
      <div className="mb-4 rounded-full bg-background p-4 shadow-sm">
        {errorIcons[error.type]}
      </div>
      
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        {error.type === 'USER' && 'Oops! Something went wrong'}
        {error.type === 'NETWORK' && 'Connection Issue'}
        {error.type === 'SERVER' && 'Server Error'}
      </h2>
      
      <p className="mb-2 text-base text-muted-foreground">
        {error.message}
      </p>
      
      <p className="mb-6 text-sm text-muted-foreground">
        {error.instruction}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        {onRetry && (
          <Button onClick={onRetry} variant="default" size="lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </Button>
        )}
        
        <Button onClick={handleBackToHome} variant="outline" size="lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </Button>
      </div>

      {preserveData && (
        <p className="mt-4 text-xs text-muted-foreground">
          Your information has been saved. You won&apos;t need to re-enter it.
        </p>
      )}
    </div>
  )
}