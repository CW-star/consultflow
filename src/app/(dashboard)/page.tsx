export const dynamic = 'force-dynamic'

async function getData() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  const [invRes, sessRes, clientRes, payRes] = await Promise.all([
    fetch(`${url}/rest/v1/invoices?select=*,clients(name,currency)`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/sessions?select=*,clients(name)&order=date.desc`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/clients?select=*`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/payments?select=*`, { headers, cache: 'no-store' }),
  ])

  return {
    invoices: await invRes.json(),
    sessions: await sessRes.json(),
    clients: await clientRes.json(),
    payments: await payRes.json(),
  }
}

export default async function DashboardPage() {
  const { invoices: inv, sessions: sess, clients, payments } = await getData()

  const fmt = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Key metrics
  const totalRevenue = inv.reduce((s: number, i: any) => s + (i.total_amount || 0), 0)
  const totalCollected = inv.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0)
  const totalOutstanding = totalRevenue - totalCollected
  const overdueInvoices = inv.filter((i: any) => i.status === 'overdue')
  const sentInvoices = inv.filter((i: any) => i.status === 'sent')
  const paidInvoices = inv.filter((i: any) => i.status === 'paid')
  const unbilledSessions = sess.filter((s: any) => !s.is_invoiced)
  const unbilledValue = unbilledSessions.reduce((s: number, sess: any) => s + (sess.charge || 0), 0)
  const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0

  // Monthly target (set at $2000/month)
  const MONTHLY_TARGET = 2000
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const thisMonthRevenue = inv
    .filter((i: any) => {
      const d = new Date(i.issue_date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((s: number, i: any) => s + (i.total_amount || 0), 0)
  const targetProgress = Math.min((thisMonthRevenue / MONTHLY_TARGET) * 100, 100)
  const belowTarget = thisMonthRevenue < MONTHLY_TARGET

  // Financial health score
  let healthScore = 100
  if (collectionRate < 80) healthScore -= 30
  else if (collectionRate < 90) healthScore -= 15
  if (overdueInvoices.length > 0) healthScore -= overdueInvoices.length * 10
  if (unbilledValue > 500) healthScore -= 10
  if (belowTarget) healthScore -= 15
  healthScore = Math.max(0, healthScore)

  const healthLabel = healthScore >= 80 ? 'Good Standing' : healthScore >= 60 ? 'Needs Attention' : 'High Risk'
  const healthColor = healthScore >= 80 ? '#16a34a' : healthScore >= 60 ? '#d97706' : '#dc2626'
  const healthBg = healthScore >= 80 ? '#dcfce7' : healthScore >= 60 ? '#fef3c7' : '#fee2e2'

  // Aging analysis
  const aging = {
    current: inv.filter((i: any) => i.status === 'sent' && new Date(i.due_date) >= today),
    days30: inv.filter((i: any) => {
      const d = new Date(i.due_date)
      const diff = (today.getTime() - d.getTime()) / 86400000
      return i.status === 'overdue' && diff <= 30
    }),
    days60: inv.filter((i: any) => {
      const d = new Date(i.due_date)
      const diff = (today.getTime() - d.getTime()) / 86400000
      return i.status === 'overdue' && diff > 30 && diff <= 60
    }),
    days90: inv.filter((i: any) => {
      const d = new Date(i.due_date)
      const diff = (today.getTime() - d.getTime()) / 86400000
      return i.status === 'overdue' && diff > 60
    }),
  }

  // Next actions
  const nextActions = []
  if (overdueInvoices.length > 0) nextActions.push({ type: 'urgent', text: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} need follow-up`, link: '/invoices' })
  if (unbilledValue > 0) nextActions.push({ type: 'warning', text: `${fmt(unbilledValue)} in unbilled work — generate invoices`, link: '/sessions' })
  if (sentInvoices.length > 0) nextActions.push({ type: 'info', text: `${sentInvoices.length} invoice${sentInvoices.length > 1 ? 's' : ''} awaiting payment`, link: '/invoices' })
  if (belowTarget) nextActions.push({ type: 'warning', text: `${fmt(MONTHLY_TARGET - thisMonthRevenue)} below monthly target`, link: '/analytics' })
  if (nextActions.length === 0) nextActions.push({ type: 'success', text: 'All caught up! No urgent actions needed.', link: '/' })

  // AI forecast (simple trend-based)
  const last3Months = [0, 1, 2].map(i => {
    const m = new Date(today.getFullYear(), today.getMonth() - i, 1)
    return inv
      .filter((inv: any) => {
        const d = new Date(inv.issue_date)
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear()
      })
      .reduce((s: number, inv: any) => s + (inv.total_amount || 0), 0)
  }).reverse()

  const avgMonthly = last3Months.reduce((a, b) => a + b, 0) / 3
  const trend = last3Months[2] > last3Months[0] ? 'growing' : last3Months[2] < last3Months[0] ? 'declining' : 'stable'
  const quarterForecast = avgMonthly * 3
  const trendMultiplier = trend === 'growing' ? 1.1 : trend === 'declining' ? 0.9 : 1
  const adjustedForecast = quarterForecast * trendMultiplier

  // Recent sessions
  const recentSessions = sess.slice(0, 8)

  const actionColors: Record<string, { bg: string; color: string; dot: string }> = {
    urgent: { bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
    warning: { bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
    info: { bg: '#dbeafe', color: '#1e3a8a', dot: '#2563eb' },
    success: { bg: '#dcfce7', color: '#166534', dot: '#16a34a' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#111827' }}>Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{dateStr}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: healthBg, color: healthColor, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
            {healthScore >= 80 ? '✓' : healthScore >= 60 ? '⚠' : '!'} {healthLabel}
          </span>
        </div>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        {[
          { label: 'Total revenue', value: fmt(totalRevenue), sub: `${inv.length} invoices`, color: '#1e40af' },
          { label: 'Collected', value: fmt(totalCollected), sub: `${paidInvoices.length} paid`, color: '#16a34a' },
          { label: 'Outstanding', value: fmt(totalOutstanding), sub: `${sentInvoices.length + overdueInvoices.length} invoices`, color: totalOutstanding > 0 ? '#dc2626' : '#16a34a' },
          { label: 'Collection rate', value: `${collectionRate.toFixed(1)}%`, sub: collectionRate >= 90 ? 'Excellent' : collectionRate >= 75 ? 'Good' : 'Needs work', color: collectionRate >= 90 ? '#16a34a' : collectionRate >= 75 ? '#d97706' : '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
            <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: s.color, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly target + Health score */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Monthly target */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>Monthly target</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{fmt(thisMonthRevenue)} of {fmt(MONTHLY_TARGET)}</p>
            </div>
            <span style={{
              background: belowTarget ? '#fee2e2' : '#dcfce7',
              color: belowTarget ? '#dc2626' : '#16a34a',
              padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            }}>
              {belowTarget ? `${fmt(MONTHLY_TARGET - thisMonthRevenue)} short` : 'On target'}
            </span>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              width: `${targetProgress}%`, height: '8px', borderRadius: '999px',
              background: belowTarget ? '#dc2626' : '#16a34a',
              transition: 'width 0.3s',
            }}/>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 0' }}>{targetProgress.toFixed(0)}% of monthly target reached</p>
        </div>

        {/* Financial health */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>Financial health</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: healthBg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '22px', fontWeight: 700, color: healthColor }}>{healthScore}</span>
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: healthColor, margin: '0 0 4px' }}>{healthLabel}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                {healthScore >= 80 ? 'Collections on track, no overdue invoices' :
                 healthScore >= 60 ? 'Some invoices need attention' :
                 'Immediate action required on overdue invoices'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next actions + AI Forecast */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Next actions */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>Next actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nextActions.map((action, i) => {
              const colors = actionColors[action.type]
              return (
                <a key={i} href={action.link} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: colors.bg, padding: '10px 12px', borderRadius: '8px',
                  textDecoration: 'none',
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.dot, flexShrink: 0 }}/>
                  <span style={{ fontSize: '13px', color: colors.color, fontWeight: 500 }}>{action.text}</span>
                </a>
              )
            })}
          </div>
        </div>

        {/* AI Forecast */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>AI forecast — next quarter</p>
            <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>AI</span>
          </div>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#1e40af', margin: '0 0 4px' }}>{fmt(adjustedForecast)}</p>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 12px' }}>
            Based on {trend} trend · avg {fmt(avgMonthly)}/month
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {last3Months.map((m, i) => {
              const monthName = new Date(today.getFullYear(), today.getMonth() - 2 + i, 1)
                .toLocaleDateString('en-CA', { month: 'short' })
              const pct = avgMonthly > 0 ? (m / (avgMonthly * 1.5)) * 100 : 0
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af', width: '28px' }}>{monthName}</span>
                  <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '4px', height: '6px' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, height: '6px', background: '#1e40af', borderRadius: '4px' }}/>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6b7280', width: '60px', textAlign: 'right' }}>{fmt(m)}</span>
                </div>
              )
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#7c3aed', width: '28px', fontWeight: 600 }}>Est</span>
              <div style={{ flex: 1, background: '#ede9fe', borderRadius: '4px', height: '6px' }}>
                <div style={{ width: `${Math.min((adjustedForecast / 3 / (avgMonthly * 1.5)) * 100, 100)}%`, height: '6px', background: '#7c3aed', borderRadius: '4px' }}/>
              </div>
              <span style={{ fontSize: '11px', color: '#7c3aed', width: '60px', textAlign: 'right', fontWeight: 600 }}>{fmt(adjustedForecast / 3)}/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aging analysis */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 16px' }}>Aging analysis</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
          {[
            { label: 'Current', invoices: aging.current, color: '#16a34a', bg: '#dcfce7' },
            { label: '1–30 days', invoices: aging.days30, color: '#d97706', bg: '#fef3c7' },
            { label: '31–60 days', invoices: aging.days60, color: '#ea580c', bg: '#fff7ed' },
            { label: '60+ days', invoices: aging.days90, color: '#dc2626', bg: '#fee2e2' },
          ].map(bucket => {
            const total = bucket.invoices.reduce((s: number, i: any) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0)
            return (
              <div key={bucket.label} style={{ background: bucket.bg, borderRadius: '10px', padding: '16px' }}>
                <p style={{ fontSize: '11px', color: bucket.color, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 6px' }}>{bucket.label}</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: bucket.color, margin: '0 0 2px' }}>{fmt(total)}</p>
                <p style={{ fontSize: '12px', color: bucket.color, margin: 0, opacity: 0.8 }}>{bucket.invoices.length} invoice{bucket.invoices.length !== 1 ? 's' : ''}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent sessions */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>Recent sessions</p>
          <a href="/sessions" style={{ fontSize: '13px', color: '#1e40af', textDecoration: 'none', fontWeight: 500 }}>View all →</a>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              {['Date', 'Client', 'Duration', 'Charge', 'Status', 'Notes'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 0', color: '#6b7280', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentSessions.map((s: any) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', fontSize: '13px', color: '#6b7280' }}>{s.date}</td>
                <td style={{ padding: '10px 0', fontWeight: 500 }}>{s.clients?.name}</td>
                <td style={{ padding: '10px 0', color: '#6b7280' }}>{s.total_time_mins} min</td>
                <td style={{ padding: '10px 0', fontWeight: 500 }}>
                  {Number(s.charge) === 0 ? 'Free' : fmt(Number(s.charge))}
                </td>
                <td style={{ padding: '10px 0' }}>
                  <span style={{
                    background: s.is_invoiced ? '#dcfce7' : '#fef3c7',
                    color: s.is_invoiced ? '#16a34a' : '#92400e',
                    padding: '3px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 500,
                  }}>
                    {s.is_invoiced ? 'Invoiced' : 'Unbilled'}
                  </span>
                </td>
                <td style={{ padding: '10px 0', color: '#6b7280', fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}