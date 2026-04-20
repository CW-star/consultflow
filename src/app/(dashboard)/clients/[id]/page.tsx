export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PaymentMethods from './PaymentMethods'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const fmt = (n: number, currency = 'CAD') =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [{ data: client }, { data: sessions }, { data: invoices }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('sessions').select('*').eq('client_id', id).order('date', { ascending: false }),
    supabase.from('invoices').select('*').eq('client_id', id).order('issue_date', { ascending: false }),
  ])

  if (!client) return notFound()

  const sess = sessions ?? []
  const inv = invoices ?? []

  const totalMins = sess.reduce((s, sess) => s + (sess.total_time_mins || 0), 0)
  const totalBilled = sess.reduce((s, sess) => s + (Number(sess.charge) || 0), 0)
  const totalCollected = inv.reduce((s, i) => s + (i.paid_amount || 0), 0)
  const totalOutstanding = inv.reduce((s, i) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0)
  const unbilledSessions = sess.filter(s => !s.is_invoiced)
  const unbilledValue = unbilledSessions.reduce((s, sess) => s + (Number(sess.charge) || 0), 0)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  const lastSession = sess[0]
  const daysSince = lastSession ? Math.floor((Date.now() - new Date(lastSession.date).getTime()) / 86400000) : null
  const isInactive = daysSince !== null && daysSince > 60
  const isRepeat = sess.length > 3

  // Risk score
  let riskScore = 100
  const overdueInv = inv.filter(i => i.status === 'overdue')
  riskScore -= overdueInv.length * 25
  if (totalOutstanding > 1000) riskScore -= 20
  else if (totalOutstanding > 500) riskScore -= 10
  if (daysSince && daysSince > 90) riskScore -= 20
  else if (daysSince && daysSince > 60) riskScore -= 10
  if (unbilledSessions.length > 3) riskScore -= 10
  riskScore = Math.max(0, Math.min(100, riskScore))

  const riskLabel = riskScore >= 80 ? 'Good Standing' : riskScore >= 60 ? 'Needs Attention' : 'High Risk'
  const riskColor = riskScore >= 80 ? 'var(--success)' : riskScore >= 60 ? 'var(--warning)' : 'var(--danger)'
  const riskBg = riskScore >= 80 ? 'var(--success-light)' : riskScore >= 60 ? 'var(--warning-light)' : 'var(--danger-light)'
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(0) : '0'

  return (
    <div style={{ maxWidth: '860px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/clients" style={{ fontSize: '13px', color: 'var(--gray-400)', textDecoration: 'none', display: 'inline-block', marginBottom: '12px' }}>
          ← Back to clients
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: riskBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: riskColor }}>{client.name.charAt(0)}</span>
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.4px' }}>{client.name}</h1>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{client.currency} · ${client.default_hourly_rate}/hr</span>
                {isRepeat && <span style={{ fontSize: '11px', background: 'var(--purple-light)', color: 'var(--purple)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>⭐ Repeat client</span>}
                {isInactive && <span style={{ fontSize: '11px', background: 'var(--danger-light)', color: 'var(--danger)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>⚠ Inactive {daysSince}d</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ background: riskBg, color: riskColor, padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px', fontWeight: 700 }}>
              {riskLabel} · {riskScore}
            </span>
            <Link href="/sessions/new" style={{ padding: '9px 18px', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
              + Log session
            </Link>
          </div>
        </div>
      </div>

      {/* Re-engagement alert */}
      {isInactive && (
        <div style={{ background: 'var(--warning-light)', border: '1px solid #fcd34d', borderRadius: '14px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 2px' }}>⚠ Client inactive for {daysSince} days</p>
            <p style={{ fontSize: '13px', color: '#b45309', margin: 0 }}>Last session was on {fmtDate(lastSession.date)}. Consider reaching out.</p>
          </div>
          <button style={{ padding: '9px 18px', background: 'var(--warning)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}>
            Send re-engagement →
          </button>
        </div>
      )}

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total sessions', value: String(sess.length), sub: `${hours}h ${mins}m total`, color: 'var(--primary)' },
          { label: 'Total billed', value: fmt(totalBilled, client.currency), sub: `${collectionRate}% collected`, color: 'var(--gray-900)' },
          { label: 'Collected', value: fmt(totalCollected, client.currency), sub: `${inv.filter(i => i.status === 'paid').length} paid invoices`, color: 'var(--success)' },
          { label: 'Outstanding', value: fmt(totalOutstanding, client.currency), sub: overdueInv.length > 0 ? `${overdueInv.length} overdue` : 'All current', color: totalOutstanding > 0 ? 'var(--danger)' : 'var(--success)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ fontSize: '11px', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: '11px', color: 'var(--gray-400)', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Contact info + Risk breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Contact info */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--gray-900)' }}>Contact information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Email', value: client.email || 'Not set' },
              { label: 'Phone', value: client.phone || 'Not set' },
              { label: 'Company', value: client.company || 'Not set' },
              { label: 'Currency', value: client.currency },
              { label: 'Hourly rate', value: `$${client.default_hourly_rate}/hr` },
              { label: 'Payment terms', value: `${client.payment_terms_days || 14} days` },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ color: 'var(--gray-400)', fontWeight: 500 }}>{item.label}</span>
                <span style={{ fontWeight: 600, color: item.value === 'Not set' ? 'var(--gray-300)' : 'var(--gray-900)' }}>{item.value}</span>
              </div>
            ))}
          </div>
          {client.notes && (
            <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '11px', color: 'var(--gray-400)', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Notes</p>
              <p style={{ fontSize: '13px', color: 'var(--gray-700)', margin: 0, lineHeight: 1.5 }}>{client.notes}</p>
            </div>
          )}
        </div>

        {/* Risk breakdown */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>Risk analysis</h3>
            <div style={{ position: 'relative', width: '52px', height: '52px' }}>
              <svg viewBox="0 0 52 52" style={{ width: '52px', height: '52px', transform: 'rotate(-90deg)' }}>
                <circle cx="26" cy="26" r="20" fill="none" stroke="var(--gray-100)" strokeWidth="6"/>
                <circle cx="26" cy="26" r="20" fill="none" stroke={riskColor} strokeWidth="6"
                  strokeDasharray={`${(riskScore / 100) * 125.6} 125.6`} strokeLinecap="round"/>
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: riskColor }}>{riskScore}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'No overdue invoices', ok: overdueInv.length === 0, note: overdueInv.length > 0 ? `${overdueInv.length} overdue` : 'All on time' },
              { label: 'Outstanding balance', ok: totalOutstanding < 500, note: totalOutstanding > 0 ? fmt(totalOutstanding) + ' owed' : 'No balance' },
              { label: 'Active client', ok: !isInactive, note: daysSince !== null ? `Last seen ${daysSince}d ago` : 'No sessions' },
              { label: 'No unbilled work', ok: unbilledSessions.length === 0, note: unbilledSessions.length > 0 ? `${unbilledSessions.length} unbilled` : 'All invoiced' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>{item.ok ? '✅' : '⚠️'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '12px', color: item.ok ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>{item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment methods */}
      <div style={{ marginBottom: '16px' }}>
        <PaymentMethods clientId={id} userId="81589a84-f763-49b5-8a19-e24fd698e1f8" />
      </div>

      {/* Invoices */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>Invoices ({inv.length})</h3>
          {unbilledValue > 0 && (
            <span style={{ fontSize: '12px', background: 'var(--warning-light)', color: '#92400e', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              {fmt(unbilledValue, client.currency)} unbilled
            </span>
          )}
        </div>
        {inv.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: '14px' }}>No invoices yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Invoice #', 'Date', 'Due', 'Amount', 'Paid', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 0', color: 'var(--gray-400)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inv.map((i: any) => (
                <tr key={i.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 0' }}>
                    <Link href={`/invoices/${i.id}`} style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {i.invoice_number}
                    </Link>
                  </td>
                  <td style={{ padding: '10px 0', color: 'var(--gray-400)', fontSize: '12px' }}>{i.issue_date}</td>
                  <td style={{ padding: '10px 0', color: 'var(--gray-400)', fontSize: '12px' }}>{i.due_date}</td>
                  <td style={{ padding: '10px 0', fontWeight: 700 }}>{fmt(i.total_amount, client.currency)}</td>
                  <td style={{ padding: '10px 0', color: 'var(--success)', fontWeight: 600 }}>{fmt(i.paid_amount, client.currency)}</td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700,
                      background: i.status === 'paid' ? 'var(--success-light)' : i.status === 'overdue' ? 'var(--danger-light)' : 'var(--primary-light)',
                      color: i.status === 'paid' ? 'var(--success)' : i.status === 'overdue' ? 'var(--danger)' : 'var(--primary)',
                    }}>
                      {i.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Session history */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px', color: 'var(--gray-900)' }}>Session history ({sess.length})</h3>
        {sess.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: '14px' }}>No sessions yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Duration', 'Rate', 'Charge', 'Status', 'Notes'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 0', color: 'var(--gray-400)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sess.slice(0, 15).map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '10px 0', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{s.date}</td>
                  <td style={{ padding: '10px 0', color: 'var(--gray-700)' }}>{s.total_time_mins} min</td>
                  <td style={{ padding: '10px 0', color: 'var(--gray-400)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>${s.hourly_rate}/hr</td>
                  <td style={{ padding: '10px 0', fontWeight: 700 }}>{Number(s.charge) === 0 ? 'Free' : fmt(s.charge, client.currency)}</td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 700,
                      background: s.is_invoiced ? 'var(--success-light)' : 'var(--warning-light)',
                      color: s.is_invoiced ? 'var(--success)' : '#92400e',
                    }}>
                      {s.is_invoiced ? 'Invoiced' : 'Unbilled'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 0', color: 'var(--gray-400)', fontSize: '12px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}