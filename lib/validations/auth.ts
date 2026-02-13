import { z } from 'zod'

// Step 1: Organization Schema
export const organizationSchema = z.object({
  schoolName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s&'-]+$/, 'Organization name contains invalid characters'),
  logo: z
    .union([
      z.instanceof(File).refine(
        (file) => file.size <= 5 * 1024 * 1024,
        'Logo file size must be less than 5MB'
      ).refine(
        (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
        'Logo must be a JPEG, PNG, or WebP image'
      ),
      z.null(),
      z.undefined(),
    ])
    .optional(),
})

// Step 2: Super Admin Schema
export const adminSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Full name should only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .email('Please enter a valid email address (e.g., user@example.com)')
    .min(5, 'Email is too short')
    .max(255, 'Email is too long'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .regex(/^\+?[0-9\s\-\(\)]+$/, 'Phone number contains invalid characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Complete signup schema (combines both steps)
export const signupSchema = organizationSchema.merge(adminSchema)

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(1, 'Password is required'),
})

// Types
export type OrganizationFormData = z.infer<typeof organizationSchema>
export type AdminFormData = z.infer<typeof adminSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type LoginFormData = z.infer<typeof loginSchema>