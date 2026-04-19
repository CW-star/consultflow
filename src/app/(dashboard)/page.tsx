export const dynamic = 'force-dynamic'
import DashboardClient from './DashboardClient'

async function getData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  const [invRes, sessRes, clientRes] = await Promise.all([
    fetch(`${url}/rest/v1/invoices?select=*,clients(name,currency)`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/sessions?select=*,clients(name)&order=date.desc`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/clients?select=*`, { headers, cache: 'no-store' }),
  ])

  return {
    invoices: await invRes.json(),
    sessions: await sessRes.json(),
    clients: await clientRes.json(),
  }
}

export default async function DashboardPage() {
  const data = await getData()
  return <DashboardClient data={data} />
}