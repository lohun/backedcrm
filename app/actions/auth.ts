'use server'

import { createClient } from '@/lib/supabase/server'
import { signupSchema, loginSchema } from '@/lib/validations/auth'
import { createSuccessResponse, createErrorResponse, type ActionResponse } from '@/lib/errors'
import { revalidatePath } from 'next/cache'

interface SignupResult {
  userId: string
  orgId: string
  email: string
}

interface LoginResult {
  userId: string
  email: string
}

export async function signup(formData: FormData): Promise<ActionResponse<SignupResult>> {
  const supabase = await createClient()
  
  try {
    // 1. Extract and validate form data
    const rawData = {
      schoolName: formData.get('schoolName') as string,
      logo: formData.get('logo') as File | null,
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    // Validate with Zod
    const validationResult = signupSchema.safeParse(rawData)
    
    if (!validationResult.success) {
      throw validationResult.error
    }

    const data = validationResult.data

    // 2. Attempt Supabase Auth Signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
        },
      },
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user returned')
    }

    const userId = authData.user.id
    let logoUrl: string | null = null

    // 2. Attempt Logo Upload (if applicable)
    if (data.logo && data.logo.size > 0) {
      const fileExt = data.logo.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `organization-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, data.logo)

      if (uploadError) {
        console.error('Logo upload failed:', uploadError)
      } else {
        const { data: urlData } = supabase.storage
          .from('logos')
          .getPublicUrl(filePath)
        
        logoUrl = urlData.publicUrl
      }
    }

    // 3. Attempt DB Inserts (Organizations -> Admins)
    
    // 3a. Insert Organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        school_name: data.schoolName,
        logo_url: logoUrl,
      })
      .select('id')
      .single()

    if (orgError) {
      console.error('Organization insert failed:', orgError)
      
      // Attempt to clean up the auth user
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user after org insert failure:', cleanupError)
      }
      
      throw orgError
    }

    const orgId = orgData.id

    // 3b. Insert Admin (Super Admin)
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .insert({
        id: userId,
        user_id: userId,
        org_id: orgId,
        full_name: data.fullName,
        admin_role: 'super_admin',
      })
      .select('id')
      .single()

    if (adminError) {
      console.error('Admin insert failed:', adminError)
      
      // Attempt to clean up
      try {
        await supabase.from('organizations').delete().eq('id', orgId)
        await supabase.auth.admin.deleteUser(userId)
      } catch (cleanupError) {
        console.error('Failed to cleanup after admin insert failure:', cleanupError)
      }
      
      throw adminError
    }

    // 3c. Insert Alumni record (Full details)
    const { error: alumniError } = await supabase
      .from('alumni_list')
      .insert({
        org_id: orgId,
        user_id: userId,
        full_name: data.fullName,
        email: data.email,
        phone_momo: data.phone,
      })

    if (alumniError) {
      console.error('Alumni insert failed:', alumniError)
      
      // Attempt to clean up
      try {
        await supabase.from('admins').delete().eq('id', userId)
        await supabase.from('organizations').delete().eq('id', orgId)
        await supabase.auth.admin.deleteUser(userId)
      } catch (cleanupError) {
        console.error('Failed to cleanup after alumni insert failure:', cleanupError)
      }
      
      throw alumniError
    }

    // Success - revalidate the page
    revalidatePath('/signup', 'page')

    return createSuccessResponse({
      userId,
      orgId,
      email: data.email,
    })

  } catch (error) {
    console.error('Signup error:', error)
    return createErrorResponse(error)
  }
}

export async function login(formData: FormData): Promise<ActionResponse<LoginResult>> {
  const supabase = await createClient()
  
  try {
    // 1. Extract and validate form data
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    // Validate with Zod
    const validationResult = loginSchema.safeParse(rawData)
    
    if (!validationResult.success) {
      throw validationResult.error
    }

    const data = validationResult.data

    // 2. Attempt Supabase Auth Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('Login failed - no user returned')
    }

    // Success - revalidate the page
    revalidatePath('/login', 'page')

    return createSuccessResponse({
      userId: authData.user.id,
      email: data.email,
    })

  } catch (error) {
    console.error('Login error:', error)
    return createErrorResponse(error)
  }
}