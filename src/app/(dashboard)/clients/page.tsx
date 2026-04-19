export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getRiskScore(client: any, sessions: any[], invoices: any[]) {
  const clientSessions = sessions.filter(s => s.client_id === client.id)
  const clientInvoices = invoices.filter(i => i.client_id === client.id)
  
  let score = 100
  
  // Overdue invoices — big penalty
  const overdue = clientInvoices.filter(i => i.status === 'overdue')
  score -= overdue.length * 25

  // Outstanding balance
  const outstanding = clientInvoices.reduce((s, i) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0)
  if (outstanding > 1000) score -= 20
  else if (outstanding > 500) score -= 10

  // Last session date — inactivity penalty
  const lastSession = clientSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  if (lastSession) {
    const daysSince = (Date.now() - new Date(lastSession.date).getTime()) / 86400000
    if (daysSince > 90) score -= 20
    else if (daysSince > 60) score -= 10
  }

  // Unbilled work
  const unbilled = clientSessions.filter(s => !s.is_invoiced)
  if (unbilled.length > 3) score -= 10

  return Math.max(0, Math.min(100, score))
}

function getRiskLabel(score: number) {
  if (score >= 80) return { label: 'Good Standing', color: '#16a34a', bg: '#dcfce7' }
  if (score >= 60) return { label: 'Needs Attention', color: '#d97706', bg: '#fef3c7' }
  return { label: 'High Risk', color: '#dc2626', bg: '#fee2e2' }
}

export default async function ClientsPage() {
  const [{ data: clients }, { data: sessions }, { data: invoices }] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase.from('sessions').select('*'),
    supabase.from('invoices').select('*'),
  ])

  const cl = clients ?? []
  const sess = sessions ?? []
  const inv = invoices ?? []

  // Sort clients by risk score (highest risk first)
  const clientsWithRisk = cl.map(c => ({
    ...c,
    riskScore: getRiskScore(c, sess, inv),
    sessions: sess.filter(s => s.client_id === c.id),
    invoices: inv.filter(i => i.client_id === c.id),
  })).sort((a, b) => a.riskScore - b.riskScore)

  const highRisk = clientsWithRisk.filter(c => c.riskScore < 60)
  const needsAttention = clientsWithRisk.filter(c => c.riskScore >= 60 && c.riskScore < 80)
  const goodStanding = clientsWithRisk.filter(c => c.riskScore >= 80)

  const fmt = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)

  function ClientCard({ client }: { client: any }) {
    const risk = getRiskLabel(client.riskScore)
    const totalMins = client.sessions.reduce((s: number, sess: any) => s + (sess.total_time_mins || 0), 0)
    const totalBilled = client.sessions.reduce((s: number, sess: any) => s + (Number(sess.charge) || 0), 0)
    const unbilled = client.sessions.filter((s: any) => !s.is_invoiced)
    const unbilledValue = unbilled.reduce((s: number, sess: any) => s + (Number(sess.charge) || 0), 0)
    const outstanding = client.invoices.reduce((s: number, i: any) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0)
    const lastSession = client.sessions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    const daysSince = lastSession ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / 86400000) : null
    const hours = Math.floor(totalMins / 60)
    const mins = totalMins % 60

    return (
      <Link href={`/clients/${client.id}`} style={{ textDecoration: 'none' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: risk.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: risk.color }}>{client.name.charAt(0)}</span>
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{client.name}</p>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{client.currency} · ${client.default_hourly_rate}/hr</p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ background: risk.bg, color: risk.color, fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', display: 'block', marginBottom: '4px' }}>
                {risk.label}
              </span>
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>Score: {client.riskScore}</span>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '12px' }}>
            {[
              { label: 'Sessions', value: String(client.sessions.length) },
              { label: 'Hours', value: `${hours}h ${mins}m` },
              { label: 'Billed', value: fmt(totalBilled) },
              { label: 'Outstanding', value: fmt(outstanding), highlight: outstanding > 0 },
            ].map(s => (
              <div key={s.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ fontSize: '13px', fontWeight: 700, color: s.highlight ? '#dc2626' : '#111827', margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {lastSession ? `Last session ${daysSince === 0 ? 'today' : `${daysSince}d ago`}` : 'No sessions yet'}
            </span>
            {unbilledValue > 0 && (
              <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                {fmt(unbilledValue)} unbilled
              </span>
            )}
            {daysSince !== null && daysSince > 60 && (
              <span style={{ fontSize: '11px', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                Inactive {daysSince}d
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Clients</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            {cl.length} clients · {highRisk.length} high risk · {needsAttention.length} need attention · {goodStanding.length} good standing
          </p>
        </div>
        <Link href="/clients/new" style={{
          background: '#1e40af', color: 'white', padding: '10px 20px',
          borderRadius: '8px', fontSize: '14px', fontWeight: 600,
          textDecoration: 'none',
        }}>
          + Add client
        </Link>
      </div>

      {/* Risk summary bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'High Risk', count: highRisk.length, color: '#dc2626', bg: '#fee2e2', desc: 'Overdue invoices or inactive' },
          { label: 'Needs Attention', count: needsAttention.length, color: '#d97706', bg: '#fef3c7', desc: 'Outstanding balance or slow' },
          { label: 'Good Standing', count: goodStanding.length, color: '#16a34a', bg: '#dcfce7', desc: 'Payments on track' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '11px', color: s.color, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px' }}>{s.label}</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: s.color, margin: '0 0 2px' }}>{s.count}</p>
                <p style={{ fontSize: '12px', color: s.color, margin: 0, opacity: 0.8 }}>{s.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* High Risk section */}
      {highRisk.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>🔴</span>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626', margin: 0 }}>High Risk</h2>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>— requires immediate attention</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '16px' }}>
            {highRisk.map(c => <ClientCard key={c.id} client={c}/>)}
          </div>
        </div>
      )}

      {/* Needs Attention section */}
      {needsAttention.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>🟡</span>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#d97706', margin: 0 }}>Needs Attention</h2>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>— monitor closely</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '16px' }}>
            {needsAttention.map(c => <ClientCard key={c.id} client={c}/>)}
          </div>
        </div>
      )}

      {/* Good Standing section */}
      {goodStanding.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>🟢</span>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#16a34a', margin: 0 }}>Good Standing</h2>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>— all clear</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '16px' }}>
            {goodStanding.map(c => <ClientCard key={c.id} client={c}/>)}
          </div>
        </div>
      )}
    </div>
  )
}