'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const fmt = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '80vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function DashboardClient({ data }: { data: any }) {
  const { invoices: inv, sessions: sess, clients } = data
  const [modal, setModal] = useState<string | null>(null)
  const [forecastPeriod, setForecastPeriod] = useState<3 | 6 | 12>(3)
  const router = useRouter()

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  // Metrics
  const totalRevenue = inv.reduce((s: number, i: any) => s + (i.total_amount || 0), 0)
  const totalCollected = inv.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0)
  const totalOutstanding = totalRevenue - totalCollected
  const overdueInvoices = inv.filter((i: any) => i.status === 'overdue')
  const sentInvoices = inv.filter((i: any) => i.status === 'sent')
  const paidInvoices = inv.filter((i: any) => i.status === 'paid')
  const unbilledSessions = sess.filter((s: any) => !s.is_invoiced)
  const unbilledValue = unbilledSessions.reduce((s: number, sess: any) => s + (sess.charge || 0), 0)
  const collectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0

  // Monthly target
  const MONTHLY_TARGET = 2000
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const thisMonthRevenue = inv
    .filter((i: any) => { const d = new Date(i.issue_date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear })
    .reduce((s: number, i: any) => s + (i.total_amount || 0), 0)
  const targetProgress = Math.min((thisMonthRevenue / MONTHLY_TARGET) * 100, 100)
  const belowTarget = thisMonthRevenue < MONTHLY_TARGET

  // Health score
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

  // Aging
  const aging = {
    current: inv.filter((i: any) => i.status === 'sent' && new Date(i.due_date) >= today),
    days30: inv.filter((i: any) => { const diff = (today.getTime() - new Date(i.due_date).getTime()) / 86400000; return i.status === 'overdue' && diff <= 30 }),
    days60: inv.filter((i: any) => { const diff = (today.getTime() - new Date(i.due_date).getTime()) / 86400000; return i.status === 'overdue' && diff > 30 && diff <= 60 }),
    days90: inv.filter((i: any) => { const diff = (today.getTime() - new Date(i.due_date).getTime()) / 86400000; return i.status === 'overdue' && diff > 60 }),
  }

  // Next actions
  const nextActions = []
  if (overdueInvoices.length > 0) nextActions.push({ type: 'urgent', text: `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? 's' : ''} need follow-up`, link: '/invoices', modal: 'overdue' })
  if (unbilledValue > 0) nextActions.push({ type: 'warning', text: `${fmt(unbilledValue)} in unbilled work`, link: '/sessions', modal: 'unbilled' })
  if (sentInvoices.length > 0) nextActions.push({ type: 'info', text: `${sentInvoices.length} invoice${sentInvoices.length > 1 ? 's' : ''} awaiting payment`, link: '/invoices', modal: 'sent' })
  if (belowTarget) nextActions.push({ type: 'warning', text: `${fmt(MONTHLY_TARGET - thisMonthRevenue)} below monthly target`, link: '/analytics', modal: null })
  if (nextActions.length === 0) nextActions.push({ type: 'success', text: 'All caught up! No urgent actions needed.', link: '/', modal: null })

  // AI Forecast
  const monthlyRevenue: Record<string, number> = {}
  inv.forEach((i: any) => {
    const d = new Date(i.issue_date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyRevenue[key] = (monthlyRevenue[key] || 0) + (i.total_amount || 0)
  })
  const sortedMonths = Object.entries(monthlyRevenue).sort((a, b) => a[0].localeCompare(b[0]))
  const last3Months = sortedMonths.slice(-3).map(([key, val]) => ({
    month: new Date(key + '-01').toLocaleDateString('en-CA', { month: 'short', year: '2-digit' }),
    value: val,
  }))
  const avgMonthly = last3Months.reduce((a, b) => a + b.value, 0) / Math.max(last3Months.length, 1)
  const trend = last3Months.length >= 2
    ? last3Months[last3Months.length - 1].value > last3Months[0].value ? 'growing'
    : last3Months[last3Months.length - 1].value < last3Months[0].value ? 'declining' : 'stable'
    : 'stable'
  const trendMultiplier = trend === 'growing' ? 1.1 : trend === 'declining' ? 0.9 : 1
  const projected = avgMonthly * forecastPeriod * trendMultiplier
  const low = projected * 0.85
  const high = projected * 1.15

  const actionColors: Record<string, any> = {
    urgent: { bg: '#fee2e2', color: '#991b1b', dot: '#dc2626' },
    warning: { bg: '#fef3c7', color: '#92400e', dot: '#d97706' },
    info: { bg: '#dbeafe', color: '#1e3a8a', dot: '#2563eb' },
    success: { bg: '#dcfce7', color: '#166534', dot: '#16a34a' },
  }

  const recentSessions = sess.slice(0, 8)

  const card = {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.15s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#111827' }}>Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{dateStr}</p>
        </div>
        <button onClick={() => setModal('health')} style={{
          background: healthBg, color: healthColor, padding: '8px 16px',
          borderRadius: '20px', fontSize: '13px', fontWeight: 600,
          border: 'none', cursor: 'pointer',
        }}>
          {healthScore >= 80 ? '✓' : healthScore >= 60 ? '⚠' : '!'} {healthLabel} — Score: {healthScore}
        </button>
      </div>

      {/* Key metrics — all clickable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
        {[
          { label: 'Total revenue', value: fmt(totalRevenue), sub: `${inv.length} invoices`, color: '#1e40af', modalKey: 'revenue' },
          { label: 'Collected', value: fmt(totalCollected), sub: `${paidInvoices.length} paid`, color: '#16a34a', modalKey: 'collected' },
          { label: 'Outstanding', value: fmt(totalOutstanding), sub: `${sentInvoices.length + overdueInvoices.length} invoices`, color: totalOutstanding > 0 ? '#dc2626' : '#16a34a', modalKey: 'outstanding' },
          { label: 'Collection rate', value: `${collectionRate.toFixed(1)}%`, sub: collectionRate >= 90 ? 'Excellent' : collectionRate >= 75 ? 'Good' : 'Needs work', color: collectionRate >= 90 ? '#16a34a' : collectionRate >= 75 ? '#d97706' : '#dc2626', modalKey: 'rate' },
        ].map(s => (
          <div key={s.label} onClick={() => setModal(s.modalKey)}
            style={card}>
            <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: s.color, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 8px' }}>{s.sub}</p>
            <p style={{ fontSize: '11px', color: '#1e40af', margin: 0 }}>Click for details →</p>
          </div>
        ))}
      </div>

      {/* Monthly target + Health */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div onClick={() => setModal('target')} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>Monthly target</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{fmt(thisMonthRevenue)} of {fmt(MONTHLY_TARGET)}</p>
            </div>
            <span style={{ background: belowTarget ? '#fee2e2' : '#dcfce7', color: belowTarget ? '#dc2626' : '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
              {belowTarget ? `${fmt(MONTHLY_TARGET - thisMonthRevenue)} short` : '✓ On target'}
            </span>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${targetProgress}%`, height: '10px', borderRadius: '999px', background: belowTarget ? '#dc2626' : '#16a34a' }}/>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 0' }}>{targetProgress.toFixed(0)}% of monthly target · Click for breakdown</p>
        </div>

        <div onClick={() => setModal('health')} style={card}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>Financial health</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: healthBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '22px', fontWeight: 700, color: healthColor }}>{healthScore}</span>
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: healthColor, margin: '0 0 4px' }}>{healthLabel}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 6px' }}>
                {healthScore >= 80 ? 'Collections on track' : healthScore >= 60 ? 'Some invoices need attention' : 'Immediate action required'}
              </p>
              <p style={{ fontSize: '11px', color: '#1e40af', margin: 0 }}>Click to see score breakdown →</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next actions + Forecast */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Next actions */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 12px' }}>Next actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nextActions.map((action, i) => {
              const colors = actionColors[action.type]
              return (
                <button key={i} onClick={() => action.modal ? setModal(action.modal) : router.push(action.link)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', background: colors.bg, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.dot, flexShrink: 0 }}/>
                  <span style={{ fontSize: '13px', color: colors.color, fontWeight: 500, flex: 1 }}>{action.text}</span>
                  <span style={{ fontSize: '11px', color: colors.color, opacity: 0.7 }}>→</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* AI Forecast */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>AI revenue forecast</p>
            <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>AI</span>
          </div>

          {/* Period selector */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {([3, 6, 12] as const).map(p => (
              <button key={p} onClick={() => setForecastPeriod(p)} style={{
                flex: 1, padding: '6px', border: '1px solid #e5e7eb', borderRadius: '8px',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: forecastPeriod === p ? '#1e40af' : 'white',
                color: forecastPeriod === p ? 'white' : '#6b7280',
              }}>
                {p}mo
              </button>
            ))}
          </div>

          {/* Projection */}
          <div style={{ background: '#ede9fe', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{forecastPeriod}-month projection</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: '#7c3aed', margin: '0 0 4px' }}>{fmt(projected)}</p>
            <p style={{ fontSize: '12px', color: '#7c3aed', margin: '0 0 8px', opacity: 0.8 }}>Range: {fmt(low)} – {fmt(high)}</p>
            <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '4px', height: '6px' }}>
              <div style={{ width: '75%', height: '6px', background: '#7c3aed', borderRadius: '4px' }}/>
            </div>
          </div>

          {/* Trend bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {last3Months.map((m, i) => {
              const pct = avgMonthly > 0 ? (m.value / (avgMonthly * 1.5)) * 100 : 0
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#9ca3af', width: '44px' }}>{m.month}</span>
                  <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '4px', height: '6px' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, height: '6px', background: '#1e40af', borderRadius: '4px' }}/>
                  </div>
                  <span style={{ fontSize: '11px', color: '#6b7280', width: '70px', textAlign: 'right' }}>{fmt(m.value)}</span>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '10px 0 0', fontStyle: 'italic' }}>
            {trend} trend · avg {fmt(avgMonthly)}/month · ±15% variance
          </p>
        </div>
      </div>

      {/* Aging analysis — clickable buckets */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '0 0 16px' }}>Aging analysis</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
          {[
            { label: 'Current', invoices: aging.current, color: '#16a34a', bg: '#dcfce7', modalKey: 'aging_current' },
            { label: '1–30 days', invoices: aging.days30, color: '#d97706', bg: '#fef3c7', modalKey: 'aging_30' },
            { label: '31–60 days', invoices: aging.days60, color: '#ea580c', bg: '#fff7ed', modalKey: 'aging_60' },
            { label: '60+ days', invoices: aging.days90, color: '#dc2626', bg: '#fee2e2', modalKey: 'aging_90' },
          ].map(bucket => {
            const total = bucket.invoices.reduce((s: number, i: any) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0)
            return (
              <button key={bucket.label} onClick={() => setModal(bucket.modalKey)}
                style={{ background: bucket.bg, borderRadius: '10px', padding: '16px', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <p style={{ fontSize: '11px', color: bucket.color, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 6px' }}>{bucket.label}</p>
                <p style={{ fontSize: '20px', fontWeight: 700, color: bucket.color, margin: '0 0 2px' }}>{fmt(total)}</p>
                <p style={{ fontSize: '12px', color: bucket.color, margin: '0 0 6px', opacity: 0.8 }}>{bucket.invoices.length} invoice{bucket.invoices.length !== 1 ? 's' : ''}</p>
                <p style={{ fontSize: '11px', color: bucket.color, margin: 0, opacity: 0.7 }}>Click to view →</p>
              </button>
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
                <td style={{ padding: '10px 0', fontWeight: 500 }}>{Number(s.charge) === 0 ? 'Free' : fmt(Number(s.charge))}</td>
                <td style={{ padding: '10px 0' }}>
                  <span style={{ background: s.is_invoiced ? '#dcfce7' : '#fef3c7', color: s.is_invoiced ? '#16a34a' : '#92400e', padding: '3px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 500 }}>
                    {s.is_invoiced ? 'Invoiced' : 'Unbilled'}
                  </span>
                </td>
                <td style={{ padding: '10px 0', color: '#6b7280', fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== MODALS ===== */}

      {/* Health score modal */}
      {modal === 'health' && (
        <Modal title="Financial health breakdown" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: healthBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: healthColor }}>{healthScore}</span>
            </div>
            <div>
              <p style={{ fontSize: '20px', fontWeight: 700, color: healthColor, margin: '0 0 4px' }}>{healthLabel}</p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Out of 100 points</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Collection rate', score: collectionRate >= 90 ? 25 : collectionRate >= 80 ? 20 : collectionRate >= 70 ? 10 : 0, max: 25, good: collectionRate >= 90 },
              { label: 'No overdue invoices', score: overdueInvoices.length === 0 ? 30 : Math.max(0, 30 - overdueInvoices.length * 10), max: 30, good: overdueInvoices.length === 0 },
              { label: 'Unbilled work', score: unbilledValue === 0 ? 20 : unbilledValue < 500 ? 15 : 10, max: 20, good: unbilledValue === 0 },
              { label: 'Monthly target', score: !belowTarget ? 25 : 10, max: 25, good: !belowTarget },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px' }}>{item.good ? '✅' : '⚠️'}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 4px' }}>{item.label}</p>
                  <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '6px' }}>
                    <div style={{ width: `${(item.score / item.max) * 100}%`, height: '6px', background: item.good ? '#16a34a' : '#d97706', borderRadius: '4px' }}/>
                  </div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: item.good ? '#16a34a' : '#d97706' }}>{item.score}/{item.max}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Revenue modal */}
      {modal === 'revenue' && (
        <Modal title="Revenue breakdown" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '8px' }}>
              {[
                { label: 'Total billed', value: fmt(totalRevenue), color: '#1e40af' },
                { label: 'Collected', value: fmt(totalCollected), color: '#16a34a' },
                { label: 'Outstanding', value: fmt(totalOutstanding), color: '#dc2626' },
              ].map(s => (
                <div key={s.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase' }}>{s.label}</p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: '8px 0 4px' }}>By client</p>
            {clients.map((c: any) => {
              const clientInv = inv.filter((i: any) => i.client_id === c.id)
              const total = clientInv.reduce((s: number, i: any) => s + (i.total_amount || 0), 0)
              if (total === 0) return null
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{c.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e40af' }}>{fmt(total)}</span>
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      {/* Outstanding modal */}
      {modal === 'outstanding' && (
        <Modal title="Outstanding invoices" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[...sentInvoices, ...overdueInvoices].length === 0 ? (
              <p style={{ color: '#16a34a', fontWeight: 500, textAlign: 'center', padding: '24px' }}>✓ All invoices are paid!</p>
            ) : [...sentInvoices, ...overdueInvoices].map((i: any) => (
              <a key={i.id} href={`/invoices/${i.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: i.status === 'overdue' ? '#fee2e2' : '#f9fafb', borderRadius: '8px', textDecoration: 'none' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px', color: '#111827' }}>{i.invoice_number}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Due {i.due_date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 2px', color: i.status === 'overdue' ? '#dc2626' : '#111827' }}>{fmt(i.total_amount - i.paid_amount)}</p>
                  <span style={{ fontSize: '11px', background: i.status === 'overdue' ? '#dc2626' : '#2563eb', color: 'white', padding: '2px 8px', borderRadius: '999px' }}>{i.status}</span>
                </div>
              </a>
            ))}
          </div>
        </Modal>
      )}

      {/* Collection rate modal */}
      {modal === 'rate' && (
        <Modal title="Collection rate analysis" onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontSize: '48px', fontWeight: 700, color: collectionRate >= 90 ? '#16a34a' : collectionRate >= 75 ? '#d97706' : '#dc2626', margin: '0 0 4px' }}>
              {collectionRate.toFixed(1)}%
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              {fmt(totalCollected)} collected of {fmt(totalRevenue)} invoiced
            </p>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ width: `${collectionRate}%`, height: '12px', borderRadius: '999px', background: collectionRate >= 90 ? '#16a34a' : collectionRate >= 75 ? '#d97706' : '#dc2626' }}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Industry benchmark', value: '85%', note: 'Average consulting' },
              { label: 'Your rate', value: `${collectionRate.toFixed(1)}%`, note: collectionRate >= 85 ? 'Above benchmark ✓' : 'Below benchmark' },
              { label: 'Target', value: '95%', note: 'ConsultFlow goal' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 2px' }}>{item.label}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{item.note}</p>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#1e40af' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Aging modals */}
      {['aging_current', 'aging_30', 'aging_60', 'aging_90'].map(key => {
        const bucketMap: Record<string, any[]> = {
          aging_current: aging.current,
          aging_30: aging.days30,
          aging_60: aging.days60,
          aging_90: aging.days90,
        }
        const titleMap: Record<string, string> = {
          aging_current: 'Current invoices',
          aging_30: '1–30 days overdue',
          aging_60: '31–60 days overdue',
          aging_90: '60+ days overdue',
        }
        if (modal !== key) return null
        const bucket = bucketMap[key]
        return (
          <Modal key={key} title={titleMap[key]} onClose={() => setModal(null)}>
            {bucket.length === 0 ? (
              <p style={{ color: '#16a34a', textAlign: 'center', padding: '24px', fontWeight: 500 }}>No invoices in this category</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {bucket.map((i: any) => (
                  <a key={i.id} href={`/invoices/${i.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f9fafb', borderRadius: '8px', textDecoration: 'none' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px', color: '#111827' }}>{i.invoice_number}</p>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Due {i.due_date} · {i.clients?.name}</p>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', margin: 0 }}>{fmt((i.total_amount || 0) - (i.paid_amount || 0))}</p>
                  </a>
                ))}
              </div>
            )}
          </Modal>
        )
      })}

      {/* Overdue modal */}
      {modal === 'overdue' && (
        <Modal title="Overdue invoices" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {overdueInvoices.length === 0 ? (
              <p style={{ color: '#16a34a', textAlign: 'center', padding: '24px', fontWeight: 500 }}>No overdue invoices!</p>
            ) : overdueInvoices.map((i: any) => (
              <a key={i.id} href={`/invoices/${i.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fee2e2', borderRadius: '8px', textDecoration: 'none' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px', color: '#111827' }}>{i.invoice_number}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Due {i.due_date}</p>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', margin: 0 }}>{fmt(i.total_amount - i.paid_amount)}</p>
              </a>
            ))}
          </div>
        </Modal>
      )}

      {/* Unbilled modal */}
      {modal === 'unbilled' && (
        <Modal title="Unbilled sessions" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {unbilledSessions.length === 0 ? (
              <p style={{ color: '#16a34a', textAlign: 'center', padding: '24px', fontWeight: 500 }}>All sessions are invoiced!</p>
            ) : unbilledSessions.map((s: any) => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px', color: '#111827' }}>{s.clients?.name} · {s.date}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{s.total_time_mins} min · {s.notes || 'No notes'}</p>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#d97706', margin: 0 }}>{fmt(s.charge)}</p>
              </div>
            ))}
            <a href="/sessions" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#1e40af', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '14px', marginTop: '8px' }}>
              Go to sessions →
            </a>
          </div>
        </Modal>
      )}

      {/* Target modal */}
      {modal === 'target' && (
        <Modal title="Monthly target breakdown" onClose={() => setModal(null)}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontSize: '36px', fontWeight: 700, color: belowTarget ? '#dc2626' : '#16a34a', margin: '0 0 4px' }}>{fmt(thisMonthRevenue)}</p>
            <p style={{ color: '#6b7280', margin: 0 }}>of {fmt(MONTHLY_TARGET)} target this month</p>
          </div>
          <div style={{ background: '#f3f4f6', borderRadius: '999px', height: '12px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ width: `${targetProgress}%`, height: '12px', borderRadius: '999px', background: belowTarget ? '#dc2626' : '#16a34a' }}/>
          </div>
          {belowTarget && (
            <div style={{ background: '#fee2e2', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
              <p style={{ fontSize: '13px', color: '#dc2626', fontWeight: 600, margin: '0 0 4px' }}>⚠ Below target by {fmt(MONTHLY_TARGET - thisMonthRevenue)}</p>
              <p style={{ fontSize: '12px', color: '#dc2626', margin: 0, opacity: 0.8 }}>You need {fmt(MONTHLY_TARGET - thisMonthRevenue)} more to hit your monthly goal</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'This month invoiced', value: fmt(thisMonthRevenue) },
              { label: 'Monthly target', value: fmt(MONTHLY_TARGET) },
              { label: 'Gap', value: fmt(Math.max(0, MONTHLY_TARGET - thisMonthRevenue)) },
              { label: 'Progress', value: `${targetProgress.toFixed(0)}%` },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

    </div>
  )
}