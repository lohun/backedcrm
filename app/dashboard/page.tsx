import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  // Get user profile from admins table
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: admin } = await supabase
    .from('admins')
    .select('*, organizations(*)')
    .eq('id', user?.id)
    .single()

  // Get alumni count
  const { count: alumniCount } = await supabase
    .from('alumni_list')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', admin?.org_id)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div style={{color: "#333"}}>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {admin?.full_name?.split(' ')[0] || 'Admin'}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Here&apos;s what&apos;s happening with your alumni network today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Alumni</h3>
          <p className="mt-2 text-3xl font-bold">{alumniCount || 0}</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Active Projects</h3>
          <p className="mt-2 text-3xl font-bold">--</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Raised</h3>
          <p className="mt-2 text-3xl font-bold">GHS --</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a 
            href="/dashboard/alumni"
            className="rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Alumni Directory
          </a>
          <button className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Create Project
          </button>
          <button className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Send Message
          </button>
          <button className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            View Reports
          </button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="mt-4 text-sm text-muted-foreground">
          No recent activity to display.
        </p>
      </div>
    </div>
  )
}