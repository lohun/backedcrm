import { createBrowserClient } from '@supabase/ssr'


console.log(process.env.SUPABASE_PROJECT_URL, process.env.SUPABASE_PUBLISHABLE_KEY)
export function createClient() {
  return createBrowserClient(
    process.env.SUPABASE_PROJECT_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!
  )
}