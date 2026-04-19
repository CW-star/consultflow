export const dynamic = 'force-dynamic'
import Link from 'next/link'

async function getData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  const [invRes, sessRes, clientRes, payRes] = await Promise.all([
    fetch(`${url}/rest/v1/invoices?select=*,clients(name,currency)&order=issue_date.asc`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/sessions?select=*,clients(name)&order=date.asc`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/clients?select=*`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/payments?select=*&order=payment_date.asc`, { headers, cache: 'no-store' }),
  ])

  return {
    invoices: await invRes.json(),
    sessions: await sessRes.json(),
    clients: await clientRes.json(),
    payments: await payRes.json(),
  }
}

export default async function AnalyticsPage() {
  const { invoices: inv, sessions: sess, clients, payments } = await getData()

  const fmt = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
  const today = new Date()

  // Core metrics
  const totalBilled = inv.reduce((s: number, i: any) => s + (i.total_amount || 0), 0)
  const totalPaid = inv.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0)
  const totalOutstanding = totalBilled - totalPaid
  const paidCount = inv.filter((i: any) => i.status === 'paid').length
  const overdueCount = inv.filter((i: any) => i.status === 'overdue').length
  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : '0'

  // Monthly revenue data
  const monthlyMap: Record<string, { month: string; billed: number; collected: number; sessions: number }> = {}
  inv.forEach((i: any) => {
    const month = i.issue_date?.slice(0, 7)
    if (!month) return
    if (!monthlyMap[month]) monthlyMap[month] = { month, billed: 0, collected: 0, sessions: 0 }
    monthlyMap[month].billed += i.total_amount || 0
    monthlyMap[month].collected += i.paid_amount || 0
  })
  sess.forEach((s: any) => {
    const month = s.date?.slice(0, 7)
    if (!month) return
    if (!monthlyMap[month]) monthlyMap[month] = { month, billed: 0, collected: 0, sessions: 0 }
    monthlyMap[month].sessions += 1
  })
  const monthlyData = Object.values(monthlyMap).sort((a: any, b: any) => a.month.localeCompare(b.month))
  const last6Months = monthlyData.slice(-6)
  const maxBilled = Math.max(...last6Months.map((m: any) => m.billed), 1)

  // Client revenue breakdown
  const clientRevenue = clients.map((c: any) => {
    const clientSess = sess.filter((s: any) => s.client_id === c.id)
    const clientInv = inv.filter((i: any) => i.client_id === c.id)
    const total = clientSess.reduce((s: number, sess: any) => s + (sess.charge || 0), 0)
    const collected = clientInv.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0)
    const sessions = clientSess.length
    const lastSession = clientSess.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    const daysSince = lastSession ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / 86400000) : null
    return { name: c.name, total, collected, sessions, daysSince, currency: c.currency }
  }).filter((c: any) => c.total > 0).sort((a: any, b: any) => b.total - a.total)

  const maxClientRevenue = Math.max(...clientRevenue.map((c: any) => c.total), 1)

  // Invoice status breakdown
  const statuses = ['paid', 'sent', 'overdue', 'draft', 'partial']
  const statusColors: Record<string, { color: string; bg: string }> = {
    paid: { color: '#16a34a', bg: '#dcfce7' },
    sent: { color: '#2563eb', bg: '#dbeafe' },
    overdue: { color: '#dc2626', bg: '#fee2e2' },
    draft: { color: '#6b7280', bg: '#f3f4f6' },
    partial: { color: '#d97706', bg: '#fef3c7' },
  }

  // AI Forecast
  const sortedMonths = monthlyData.slice(-3)
  const avgMonthly = sortedMonths.reduce((s: number, m: any) => s + m.billed, 0) / Math.max(sortedMonths.length, 1)
  const trend = sortedMonths.length >= 2
    ? sortedMonths[sortedMonths.length - 1].billed > sortedMonths[0].billed ? 'growing'
    : sortedMonths[sortedMonths.length - 1].billed < sortedMonths[0].billed ? 'declining' : 'stable'
    : 'stable'
  const trendMultiplier = trend === 'growing' ? 1.1 : trend === 'declining' ? 0.9 : 1

  // Payment cycle analysis
  const paidInvoices = inv.filter((i: any) => i.status === 'paid' && i.paid_date && i.issue_date)
  const avgDaysToPay = paidInvoices.length > 0
    ? Math.round(paidInvoices.reduce((s: number, i: any) => {
        const days = (new Date(i.paid_date).getTime() - new Date(i.issue_date).getTime()) / 86400000
        return s + days
      }, 0) / paidInvoices.length)
    : 0

  // Best and worst months
  const bestMonth = monthlyData.reduce((best: any, m: any) => m.billed > (best?.billed || 0) ? m : best, null)
  const worstMonth = monthlyData.filter((m: any) => m.billed > 0).reduce((worst: any, m: any) => m.billed < (worst?.billed || Infinity) ? m : worst, null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Analytics</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Business intelligence & revenue insights</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/api/invoices/export?format=csv"
            style={{ padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#374151', textDecoration: 'none' }}>
            📊 Export CSV
          </a>
          <a href="/api/invoices/export?format=pdf" target="_blank"
            style={{ padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#374151', textDecoration: 'none' }}>
            📄 PDF Report
          </a>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        {[
          { label: 'Total billed', value: fmt(totalBilled), sub: `${inv.length} invoices`, color: '#1e40af' },
          { label: 'Total collected', value: fmt(totalPaid), sub: `${paidCount} paid`, color: '#16a34a' },
          { label: 'Collection rate', value: `${collectionRate}%`, sub: collectionRate >= '90' ? '🟢 Excellent' : collectionRate >= '75' ? '🟡 Good' : '🔴 Low', color: Number(collectionRate) >= 90 ? '#16a34a' : Number(collectionRate) >= 75 ? '#d97706' : '#dc2626' },
          { label: 'Avg days to pay', value: avgDaysToPay > 0 ? `${avgDaysToPay}d` : '—', sub: avgDaysToPay <= 14 ? 'Fast payer' : avgDaysToPay <= 30 ? 'Average' : 'Slow payer', color: avgDaysToPay <= 14 ? '#16a34a' : avgDaysToPay <= 30 ? '#d97706' : '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: s.color, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend chart + Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

        {/* Bar chart */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Revenue trend — last 6 months</h2>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: '#dbeafe', borderRadius: '2px', display: 'inline-block' }}/>
                Billed
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', background: '#1e40af', borderRadius: '2px', display: 'inline-block' }}/>
                Collected
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '180px' }}>
            {last6Months.map((m: any) => (
              <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, background: '#dbeafe', borderRadius: '4px 4px 0 0', height: `${(m.billed / maxBilled) * 155}px`, minHeight: m.billed > 0 ? '4px' : '0' }}/>
                  <div style={{ flex: 1, background: '#1e40af', borderRadius: '4px 4px 0 0', height: `${(m.collected / maxBilled) * 155}px`, minHeight: m.collected > 0 ? '4px' : '0' }}/>
                </div>
                <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0, textAlign: 'center' }}>{m.month.slice(5)}</p>
                <p style={{ fontSize: '10px', color: '#6b7280', margin: 0 }}>{fmt(m.billed)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Insights panel */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Key insights</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bestMonth && (
              <div style={{ background: '#dcfce7', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>Best month</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a', margin: '0 0 2px' }}>{fmt(bestMonth.billed)}</p>
                <p style={{ fontSize: '12px', color: '#16a34a', margin: 0, opacity: 0.8 }}>{bestMonth.month}</p>
              </div>
            )}
            <div style={{ background: '#ede9fe', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>Avg/month</p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#7c3aed', margin: '0 0 2px' }}>{fmt(avgMonthly)}</p>
              <p style={{ fontSize: '12px', color: '#7c3aed', margin: 0, opacity: 0.8 }}>{trend} trend</p>
            </div>
            <div style={{ background: '#dbeafe', borderRadius: '8px', padding: '12px' }}>
              <p style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>Total sessions</p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#1d4ed8', margin: '0 0 2px' }}>{sess.length}</p>
              <p style={{ fontSize: '12px', color: '#1d4ed8', margin: 0, opacity: 0.8 }}>Across {clients.length} clients</p>
            </div>
            {overdueCount > 0 && (
              <div style={{ background: '#fee2e2', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>⚠ Overdue</p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626', margin: '0 0 2px' }}>{overdueCount} invoices</p>
                <p style={{ fontSize: '12px', color: '#dc2626', margin: 0, opacity: 0.8 }}>{fmt(totalOutstanding)} at risk</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Forecast — 3/6/12 months */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>AI revenue forecast</h2>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Based on {trend} trend · avg {fmt(avgMonthly)}/month</p>
          </div>
          <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>AI Powered</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
          {[
            { period: '3 months', multiplier: 3, color: '#7c3aed', bg: '#ede9fe' },
            { period: '6 months', multiplier: 6, color: '#2563eb', bg: '#dbeafe' },
            { period: '12 months', multiplier: 12, color: '#16a34a', bg: '#dcfce7' },
          ].map(({ period, multiplier, color, bg }) => {
            const projected = avgMonthly * multiplier * trendMultiplier
            const low = projected * 0.85
            const high = projected * 1.15
            return (
              <div key={period} style={{ background: bg, borderRadius: '12px', padding: '20px' }}>
                <p style={{ fontSize: '11px', color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>{period}</p>
                <p style={{ fontSize: '26px', fontWeight: 700, color, margin: '0 0 4px' }}>{fmt(projected)}</p>
                <p style={{ fontSize: '12px', color, margin: '0 0 10px', opacity: 0.8 }}>Range: {fmt(low)} – {fmt(high)}</p>
                <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: '4px', height: '4px' }}>
                  <div style={{ width: '75%', height: '4px', background: color, borderRadius: '4px' }}/>
                </div>
                <p style={{ fontSize: '11px', color, margin: '6px 0 0', opacity: 0.7 }}>{fmt(avgMonthly * trendMultiplier)}/month avg</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Invoice status breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Invoice status breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {statuses.map(status => {
              const statusInv = inv.filter((i: any) => i.status === status)
              const amount = statusInv.reduce((s: number, i: any) => s + (i.total_amount || 0), 0)
              const pct = inv.length > 0 ? (statusInv.length / inv.length) * 100 : 0
              const sc = statusColors[status]
              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc.color, flexShrink: 0, display: 'inline-block' }}/>
                      <span style={{ fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>{status}</span>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>{statusInv.length}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{fmt(amount)}</span>
                  </div>
                  <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '6px' }}>
                    <div style={{ width: `${pct}%`, height: '6px', background: sc.color, borderRadius: '4px' }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Payment cycle */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Payment cycle analysis</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Avg days to pay', value: avgDaysToPay > 0 ? `${avgDaysToPay} days` : '—', color: avgDaysToPay <= 14 ? '#16a34a' : avgDaysToPay <= 30 ? '#d97706' : '#dc2626' },
              { label: 'Invoices paid on time', value: `${inv.filter((i: any) => i.status === 'paid').length} of ${inv.filter((i: any) => i.status !== 'draft').length}`, color: '#1e40af' },
              { label: 'Collection rate', value: `${collectionRate}%`, color: Number(collectionRate) >= 90 ? '#16a34a' : '#d97706' },
              { label: 'Outstanding balance', value: fmt(totalOutstanding), color: totalOutstanding > 0 ? '#dc2626' : '#16a34a' },
              { label: 'Overdue invoices', value: String(overdueCount), color: overdueCount > 0 ? '#dc2626' : '#16a34a' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by client */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Revenue by client</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {clientRevenue.map((c: any) => (
            <div key={c.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{c.sessions} sessions</span>
                  {c.daysSince !== null && c.daysSince > 60 && (
                    <span style={{ fontSize: '11px', background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '999px', fontWeight: 600 }}>Inactive</span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>{fmt(c.total)}</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', marginLeft: '8px' }}>{fmt(c.collected)} collected</span>
                </div>
              </div>
              <div style={{ background: '#f3f4f6', borderRadius: '4px', height: '8px' }}>
                <div style={{ width: `${(c.total / maxClientRevenue) * 100}%`, height: '8px', background: '#1e40af', borderRadius: '4px' }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly sessions trend */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>Session volume by month</h2>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
          {last6Months.map((m: any) => {
            const maxSessions = Math.max(...last6Months.map((m: any) => m.sessions), 1)
            const pct = (m.sessions / maxSessions) * 100
            return (
              <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '10px', color: '#6b7280' }}>{m.sessions}</span>
                <div style={{ width: '100%', background: '#ede9fe', borderRadius: '4px 4px 0 0', height: `${Math.max(pct, 4)}%`, minHeight: '4px' }}/>
                <p style={{ fontSize: '10px', color: '#9ca3af', margin: 0 }}>{m.month.slice(5)}</p>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}