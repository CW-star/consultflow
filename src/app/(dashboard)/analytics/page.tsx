import { createClient } from '@supabase/supabase-js'

// Service role bypasses RLS
const adminClient = createClient(
  'https://ctudpjtlngbymimlecje.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function AnalyticsPage() {
  const [{ data: invoices }, { data: sessions }] = await Promise.all([
    adminClient.from('invoices').select('*'),
    adminClient.from('sessions').select('*, clients(name)'),
  ])}        