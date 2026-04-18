'use client'

import { createClient } from '@/lib/supabase/server'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const [{ data: invoices }, { data: sessions }] = await Promise.all([
    supabase.from('invoices').select('*'),
    supabase.from('sessions').select('*, clients(name)'),
  ])

  const inv = invoices ?? []
  const sess = sessions ?? []

  const totalBilled = inv.reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalPaid = inv.reduce((s, i) => s + (i.paid_amount || 0), 0)
  const totalOutstanding = totalBilled - totalPaid
  const paidCount = inv.filter(i => i.status === 'paid').length
  const overdueCount = inv.filter(i => i.status === 'overdue').length
  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : '0'

  const fmt = (n: number) => new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD'
  }).format(n)

  const stats = [
    { label: 'Total billed', value: fmt(totalBilled), color: '#1e40af' },
    { label: 'Total collected', value: fmt(totalPaid), color: '#16a34a' },
    { label: 'Outstanding', value: fmt(totalOutstanding), color: '#dc2626' },
    { label: 'Collection rate', value: `${collectionRate}%`, color: '#d97706' },
    { label: 'Paid invoices', value: String(paidCount), color: '#16a34a' },
    { label: 'Overdue invoices', value: String(overdueCount), color: '#dc2626' },
  ]

  const statuses = ['paid', 'sent', 'overdue', 'draft', 'partial']
  const colors: Record<string, string> = {
    paid: '#16a34a', sent: '#2563eb', overdue: '#dc2626',
    draft: '#6b7280', partial: '#d97706'
  }

  // Client breakdown
  const clientMap: Record<string, { name: string; total: number; sessions: number }> = {}
  sess.forEach((s: any) => {
    const name = s.clients?.name || s.client_id
    if (!clientMap[name]) clientMap[name] = { name, total: 0, sessions: 0 }
    clientMap[name].total += s.charge || 0
    clientMap[name].sessions += 1
  })
  const clientData = Object.values(clientMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // Monthly breakdown
  const monthlyMap: Record<string, { month: string; billed: number; collected: number }> = {}
  inv.forEach(i => {
    const month = i.issue_date?.slice(0, 7)
    if (!month) return
    if (!monthlyMap[month]) monthlyMap[month] = { month, billed: 0, collected: 0 }
    monthlyMap[month].billed += i.total_amount || 0
    monthlyMap[month].collected += i.paid_amount || 0
  })
  const monthlyData = Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6)

  const maxMonthly = Math.max(...monthlyData.map(m => m.billed), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '4px' }}>Analytics</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Revenue and cash flow overview</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 600, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Cash flow bar chart (pure HTML/CSS) */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Cash flow — last 6 months</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px' }}>
          {monthlyData.map(m => (
            <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, background: '#dbeafe', borderRadius: '4px 4px 0 0', height: `${(m.billed / maxMonthly) * 150}px` }} title={`Billed: ${fmt(m.billed)}`}/>
                <div style={{ flex: 1, background: '#1e40af', borderRadius: '4px 4px 0 0', height: `${(m.collected / maxMonthly) * 150}px` }} title={`Collected: ${fmt(m.collected)}`}/>
              </div>
              <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center' }}>{m.month.slice(5)}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: '#dbeafe', borderRadius: '2px' }}/>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Billed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', background: '#1e40af', borderRadius: '2px' }}/>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>Collected</span>
          </div>
        </div>
      </div>

      {/* Invoice status */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Invoice status breakdown</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {statuses.map(status => {
            const count = inv.filter(i => i.status === status).length
            const amount = inv.filter(i => i.status === status).reduce((s, i) => s + (i.total_amount || 0), 0)
            const pct = inv.length > 0 ? (count / inv.length * 100) : 0
            return (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '70px', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize', color: colors[status] }}>{status}</div>
                <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '4px', height: '8px' }}>
                  <div style={{ width: `${pct}%`, background: colors[status], borderRadius: '4px', height: '8px' }}/>
                </div>
                <div style={{ width: '30px', fontSize: '12px', color: '#6b7280', textAlign: 'right' }}>{count}</div>
                <div style={{ width: '90px', fontSize: '13px', fontWeight: 500, textAlign: 'right' }}>{fmt(amount)}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Client revenue table */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>Revenue by client</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', color: '#6b7280', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Client</th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: '#6b7280', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Sessions</th>
              <th style={{ textAlign: 'right', padding: '8px 0', color: '#6b7280', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {clientData.map((c, i) => (
              <tr key={c.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 0', fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: '12px 0', textAlign: 'right', color: '#6b7280' }}>{c.sessions}</td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#1e40af' }}>{fmt(c.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}