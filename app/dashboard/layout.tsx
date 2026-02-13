import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Alumni Directory', href: '/dashboard/alumni', icon: '👥' },
    { name: 'Posts & Campaigns', href: '/dashboard/posts', icon: '📧' },
    // { name: 'Projects', href: '/dashboard/projects', icon: '🎯' },
    // { name: 'Messages', href: '/dashboard/messages', icon: '💬' },
    // { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-lg text-gray-900">BackED</span>
            </div>
            {admin?.organizations?.school_name && (
              <span className="hidden text-sm text-gray-600 sm:inline border-l border-gray-200 pl-4">
                {admin.organizations.school_name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-600 sm:inline">
              {user.email}
            </span>
            <form action="/api/auth/signout" method="post">
              <button 
                type="submit"
                className="bg-[#F22F46] hover:bg-[#d42037] text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
          <nav className="space-y-1 p-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-200"
              >
                <span className="text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden">
          <div className="flex justify-around p-2">
            {navigation.slice(0, 4).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center gap-1 rounded-lg py-3 px-4 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="hidden sm:inline">{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ padding: "0 20px"}} className="flex-1 bg-white pb-20 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}