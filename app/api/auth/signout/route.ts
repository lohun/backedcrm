import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Signout error:', error)
    return NextResponse.redirect(new URL('/dashboard', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
  }
  
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}