'use server'

import { createClient } from '@/lib/supabase/server'
import { alumniSchema, bulkAlumniRowSchema, REQUIRED_CSV_HEADERS } from '@/lib/validations/alumni'
import { createSuccessResponse, createErrorResponse, type ActionResponse } from '@/lib/errors'
import { revalidatePath } from 'next/cache'
import type { AlumniFormData, BulkAlumniRow } from '@/lib/validations/alumni'

export interface Alumni {
  id: string
  org_id: string
  user_id: string
  full_name: string
  email: string | null
  phone_momo: string | null
  year_group: number | null
  house_hall: string | null
  meta_id: string | null
  engagement_score: number
  created_at: string
}

interface AlumniResult {
  id: string
  full_name: string
  email: string
}

interface BulkUploadResult {
  successCount: number
  failedCount: number
  failedRows: Array<{
    row: number
    data: Record<string, unknown>
    error: string
  }>
}

// Get all alumni for an organization
export async function getAlumni(orgId: string): Promise<ActionResponse<Alumni[]>> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('alumni_list')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return createSuccessResponse(data || [])
  } catch (error) {
    console.error('Get alumni error:', error)
    return createErrorResponse(error)
  }
}

// Create single alumni
export async function createAlumni(
  formData: AlumniFormData,
  orgId: string,
  adminId: string
): Promise<ActionResponse<AlumniResult>> {
  const supabase = await createClient()
  
  try {
    // Validate data
    const validationResult = alumniSchema.safeParse(formData)
    if (!validationResult.success) {
      throw validationResult.error
    }

    const data = validationResult.data

    // Insert alumni
    const { data: alumniData, error } = await supabase
      .from('alumni_list')
      .insert({
        org_id: orgId,
        user_id: adminId,
        full_name: data.full_name,
        email: data.email || null,
        phone_momo: data.phone_momo || null,
        year_group: data.year_group || null,
        house_hall: data.house_hall || null,
        meta_id: data.meta_id || null,
      })
      .select('id, full_name, email')
      .single()

    if (error) {
      // Check for unique violation (duplicate email)
      if (error.code === '23505') {
        const customError = new Error('An alumni with this email already exists')
        ;(customError as Error & { code: string }).code = 'DUPLICATE_EMAIL'
        throw customError
      }
      throw error
    }

    revalidatePath('/dashboard/alumni')
    return createSuccessResponse(alumniData)
  } catch (error) {
    console.error('Create alumni error:', error)
    return createErrorResponse(error)
  }
}

// Update alumni
export async function updateAlumni(
  alumniId: string,
  formData: Partial<AlumniFormData>
): Promise<ActionResponse<AlumniResult>> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('alumni_list')
      .update({
        full_name: formData.full_name,
        email: formData.email || null,
        phone_momo: formData.phone_momo || null,
        year_group: formData.year_group || null,
        house_hall: formData.house_hall || null,
        meta_id: formData.meta_id || null,
      })
      .eq('id', alumniId)
      .select('id, full_name, email')
      .single()

    if (error) {
      if (error.code === '23505') {
        const customError = new Error('An alumni with this email already exists')
        ;(customError as Error & { code: string }).code = 'DUPLICATE_EMAIL'
        throw customError
      }
      throw error
    }

    revalidatePath('/dashboard/alumni')
    return createSuccessResponse(data)
  } catch (error) {
    console.error('Update alumni error:', error)
    return createErrorResponse(error)
  }
}

// Delete alumni
export async function deleteAlumni(alumniId: string): Promise<ActionResponse<void>> {
  const supabase = await createClient()
  
  try {
    const { error } = await supabase
      .from('alumni_list')
      .delete()
      .eq('id', alumniId)

    if (error) {
      throw error
    }

    revalidatePath('/dashboard/alumni')
    return createSuccessResponse(undefined)
  } catch (error) {
    console.error('Delete alumni error:', error)
    return createErrorResponse(error)
  }
}

// Bulk upload alumni
export async function bulkUploadAlumni(
  rows: BulkAlumniRow[],
  orgId: string,
  adminId: string
): Promise<ActionResponse<BulkUploadResult>> {
  const supabase = await createClient()
  
  const result: BulkUploadResult = {
    successCount: 0,
    failedCount: 0,
    failedRows: [],
  }

  try {
    // Validate and prepare data
    const validRows: BulkAlumniRow[] = []
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const validationResult = bulkAlumniRowSchema.safeParse(row)
      
      if (!validationResult.success) {
        result.failedCount++
        result.failedRows.push({
          row: i + 1,
          data: row as Record<string, unknown>,
          error: validationResult.error.issues[0]?.message || 'Validation failed',
        })
      } else {
        validRows.push(validationResult.data)
      }
    }

    if (validRows.length === 0) {
      return createSuccessResponse(result)
    }

    // Insert valid rows
    const alumniToInsert = validRows.map(row => ({
      org_id: orgId,
      user_id: adminId,
      full_name: row.full_name,
      email: row.email,
      phone_momo: row.phone_momo || null,
      year_group: row.year_group || null,
      house_hall: row.house_hall || null,
      meta_id: row.meta_id || null,
    }))

    const { data, error } = await supabase
      .from('alumni_list')
      .insert(alumniToInsert)
      .select('id, full_name, email')

    if (error) {
      // If bulk insert fails, try individual inserts to identify problematic rows
      if (error.code === '23505') {
        // Duplicate key violation - process individually
        for (let i = 0; i < alumniToInsert.length; i++) {
          const alumni = alumniToInsert[i]
          const { error: individualError } = await supabase
            .from('alumni_list')
            .insert(alumni)

          if (individualError) {
            result.failedCount++
            result.failedRows.push({
              row: i + 1,
              data: alumni as Record<string, unknown>,
              error: individualError.code === '23505' 
                ? 'Duplicate email address' 
                : individualError.message,
            })
          } else {
            result.successCount++
          }
        }
      } else {
        throw error
      }
    } else {
      result.successCount = data?.length || 0
    }

    revalidatePath('/dashboard/alumni')
    return createSuccessResponse(result)
  } catch (error) {
    console.error('Bulk upload error:', error)
    return createErrorResponse(error)
  }
}

// Validate CSV headers
export async function validateCSVHeaders(
  headers: string[]
): Promise<ActionResponse<{ valid: boolean; missingHeaders: string[] }>> {
  try {
    const missingHeaders = REQUIRED_CSV_HEADERS.filter(
      header => !headers.includes(header)
    )

    return createSuccessResponse({
      valid: missingHeaders.length === 0,
      missingHeaders,
    })
  } catch (error) {
    console.error('Validate headers error:', error)
    return createErrorResponse(error)
  }
}

// Search alumni by name or email
export async function searchAlumni(
  orgId: string,
  query: string
): Promise<ActionResponse<Alumni[]>> {
  const supabase = await createClient()
  
  try {
    const { data, error } = await supabase
      .from('alumni_list')
      .select('*')
      .eq('org_id', orgId)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('full_name')

    if (error) {
      throw error
    }

    return createSuccessResponse(data || [])
  } catch (error) {
    console.error('Search alumni error:', error)
    return createErrorResponse(error)
  }
}