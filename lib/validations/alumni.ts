import { z } from 'zod'

// Alumni Schema for Individual Entry
export const alumniSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(5, 'Email is too short'),
  phone_momo: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .regex(/^\+?[0-9\s\-\(\)]+$/, 'Phone number contains invalid characters')
    .optional()
    .or(z.literal('')),
  year_group: z
    .number()
    .int()
    .min(1900, 'Year must be after 1900')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .optional()
    .or(z.literal(0)),
  house_hall: z
    .string()
    .max(100, 'House/Hall name is too long')
    .optional()
    .or(z.literal('')),
  meta_id: z
    .string()
    .max(100, 'Meta ID is too long')
    .optional()
    .or(z.literal('')),
})

// Bulk Upload Row Schema (for CSV validation)
export const bulkAlumniRowSchema = alumniSchema.extend({
  email: z.string().email('Invalid email format'),
})

// Types
export type AlumniFormData = z.infer<typeof alumniSchema>
export type BulkAlumniRow = z.infer<typeof bulkAlumniRowSchema>

// CSV Template Headers
export const ALUMNI_CSV_HEADERS = [
  'full_name',
  'email',
  'phone_momo',
  'year_group',
  'house_hall',
  'meta_id',
]

// Required CSV Headers
export const REQUIRED_CSV_HEADERS = ['full_name', 'email']