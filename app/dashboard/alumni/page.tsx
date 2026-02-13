import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AlumniDirectory } from '@/components/alumni/alumni-directory'

export default async function AlumniPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Get user profile from admins table
  const { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('user_id', user.id)
    .single()


  if (!admin) {
    redirect('/login')
  }

  return (
    <div style={{color: "#333"}} className="container py-8">
      <AlumniDirectory orgId={admin.org_id} adminId={admin.id} />
    </div>
  )
}