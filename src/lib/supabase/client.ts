import { createClient as supabaseClient } from '@supabase/supabase-js'

let client: ReturnType<typeof supabaseClient> | null = null

export function createClient() {
  if (!client) {
    client = supabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return client
}
