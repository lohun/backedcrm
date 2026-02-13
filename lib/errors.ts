import { ZodError } from 'zod'

export type ErrorCategory = 'USER' | 'NETWORK' | 'SERVER'

export interface CategorizedError {
  type: ErrorCategory
  message: string
  instruction: string
  targetField?: string
  originalError?: Error | unknown
}

export interface ErrorResponse {
  success: false
  error: CategorizedError
}

export interface SuccessResponse<T = unknown> {
  success: true
  data: T
}

export type ActionResponse<T = unknown> = SuccessResponse<T> | ErrorResponse

// User-facing error messages for Supabase auth errors
const SUPABASE_AUTH_ERROR_MAP: Record<string, { message: string; field?: string }> = {
  'user_already_exists': {
    message: 'This email is already registered.',
    field: 'email',
  },
  'email_exists': {
    message: 'This email is already registered.',
    field: 'email',
  },
  'weak_password': {
    message: 'Password is too weak. Please use a stronger password.',
    field: 'password',
  },
  'invalid_credentials': {
    message: 'Invalid email or password.',
    field: 'email',
  },
  'email_not_confirmed': {
    message: 'Please verify your email before signing in.',
    field: 'email',
  },
}

// Network error detection
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  if (error instanceof Error && error.message.includes('network')) {
    return true
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true
  }
  return false
}

// Server error detection
function isServerError(error: unknown): boolean {
  if (error instanceof Response && error.status >= 500) {
    return true
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { status?: number; code?: string }
    if (err.status && err.status >= 500) return true
    if (err.code === '23505') return true // PostgreSQL unique violation
    if (err.code === '23503') return true // PostgreSQL foreign key violation
    if (err.code === '23514') return true // PostgreSQL check violation
  }
  return false
}

// Supabase specific error handling
function handleSupabaseError(error: unknown): CategorizedError {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string; status?: number; error?: string }
    
    // Check for specific Supabase auth error codes
    if (err.code && SUPABASE_AUTH_ERROR_MAP[err.code]) {
      const mapped = SUPABASE_AUTH_ERROR_MAP[err.code]
      return {
        type: 'USER',
        message: mapped.message,
        instruction: mapped.field 
          ? `Please use a different ${mapped.field} or log in.`
          : 'Please check your input and try again.',
        targetField: mapped.field,
        originalError: error,
      }
    }
    
    // Check message content for user errors
    const message = (err.message || err.error || '').toLowerCase()
    if (message.includes('already exists') || message.includes('already registered')) {
      return {
        type: 'USER',
        message: 'This email is already registered.',
        instruction: 'Please use a different email or log in.',
        targetField: 'email',
        originalError: error,
      }
    }
    if (message.includes('invalid')) {
      return {
        type: 'USER',
        message: 'Invalid input provided.',
        instruction: 'Please check your information and try again.',
        originalError: error,
      }
    }
  }
  
  return {
    type: 'SERVER',
    message: "We're experiencing a technical hiccup on our end.",
    instruction: "We'll be back shortly. Please try again later.",
    originalError: error,
  }
}

// Main error categorization function
export function categorizeError(error: unknown): CategorizedError {
  // Zod validation errors are user errors
  if (error instanceof ZodError) {
    const firstError = error.issues[0]
    return {
      type: 'USER',
      message: firstError.message,
      instruction: 'Please correct the highlighted field and try again.',
      targetField: firstError.path[0]?.toString(),
      originalError: error,
    }
  }

  // Network errors
  if (isNetworkError(error)) {
    return {
      type: 'NETWORK',
      message: 'Your network connection is unstable.',
      instruction: 'Please consider switching to a different network or moving to a location with better reception.',
      originalError: error,
    }
  }

  // 400 status codes or validation failures are user errors
  if (error instanceof Response && error.status === 400) {
    return {
      type: 'USER',
      message: 'Invalid input provided.',
      instruction: 'Please check your information and try again.',
      originalError: error,
    }
  }

  // Server errors (500s, database failures)
  if (isServerError(error)) {
    return {
      type: 'SERVER',
      message: "We're experiencing a technical hiccup on our end.",
      instruction: "We'll be back shortly. Please try again later.",
      originalError: error,
    }
  }

  // Handle Supabase-specific errors
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string }
    if (err.code?.startsWith('auth/') || err.code?.startsWith('2')) {
      return handleSupabaseError(error)
    }
  }

  // Default to user error for unknown cases
  return {
    type: 'USER',
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    instruction: 'Please try again or contact support if the problem persists.',
    originalError: error,
  }
}

// Helper to create success response
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  }
}

// Helper to create error response
export function createErrorResponse(error: unknown): ErrorResponse {
  return {
    success: false,
    error: categorizeError(error),
  }
}