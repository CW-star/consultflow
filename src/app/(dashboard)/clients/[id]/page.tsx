export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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

  const [{ data: client }, { data: sessions }, { data: invoices }, { data: payments }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('sessions').select('*').eq('client_id', id).order('date', { ascending: false }),
    supabase.from('invoices').select('*').eq('client_id', id).order('issue_date', { ascending: false }),
    supabase.from('payments').select('*, invoices(invoice_number)').eq('invoices.client_id', id),
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
  const riskColor = riskScore >= 80 ? '#16a34a' : riskScore >= 60 ? '#d97706' : '#dc2626'
  const riskBg = riskScore >= 80 ? '#dcfce7' : riskScore >= 60 ? '#fef3c7' : '#fee2e2'

  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(0) : '0'

  return (
    <div style={{ maxWidth: '860px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/clients" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'inline-block', marginBottom: '12px' }}>
          ← Back to clients
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: riskBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: riskColor }}>{client.name.charAt(0)}</span>
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>{client.name}</h1>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{client.currency} · ${client.default_hourly_rate}/hr</span>
                {isRepeat && <span style={{ fontSize: '11px', background: '#ede9fe', color: '#7c3aed', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>⭐ Repeat client</span>}
                {isInactive && <span style={{ fontSize: '11px', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>⚠ Inactive {daysSince}d</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ background: riskBg, color: riskColor, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
              {riskLabel} · {riskScore}
            </span>
            <Link href={`/sessions/new`} style={{ padding: '8px 16px', background: '#1e40af', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
              + Log session
            </Link>
          </div>
        </div>
      </div>

      {/* Re-engagement alert */}
      {isInactive && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, color: '#92400e', margin: '0 0 2px' }}>⚠ Client inactive for {daysSince} days</p>
            <p style={{ fontSize: '13px', color: '#b45309', margin: 0 }}>Last session was on {fmtDate(lastSession.date)}. Consider reaching out.</p>
          </div>
          <button style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            Send re-engagement →
          </button>
        </div>
      )}

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total sessions', value: String(sess.length), sub: `${hours}h ${mins}m total`, color: '#1e40af' },
          { label: 'Total billed', value: fmt(totalBilled, client.currency), sub: `${collectionRate}% collected`, color: '#111827' },
          { label: 'Collected', value: fmt(totalCollected, client.currency), sub: `${inv.filter(i => i.status === 'paid').length} paid invoices`, color: '#16a34a' },
          { label: 'Outstanding', value: fmt(totalOutstanding, client.currency), sub: overdueInv.length > 0 ? `${overdueInv.length} overdue` : 'All current', color: totalOutstanding > 0 ? '#dc2626' : '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: s.color, margin: '0 0 2px' }}>{s.value}</p>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Client info + Risk breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        {/* Contact info */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Contact information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Email', value: client.email || 'Not set' },
              { label: 'Phone', value: client.phone || 'Not set' },
              { label: 'Company', value: client.company || 'Not set' },
              { label: 'Currency', value: client.currency },
              { label: 'Hourly rate', value: `$${client.default_hourly_rate}/hr` },
              { label: 'Payment terms', value: `${client.payment_terms_days || 14} days` },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#6b7280' }}>{item.label}</span>
                <span style={{ fontWeight: 500, color: item.value === 'Not set' ? '#d1d5db' : '#111827' }}>{item.value}</span>
              </div>
            ))}
          </div>
          {client.notes && (
            <div style={{ marginTop: '12px', padding: '10px', background: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 4px', textTransform: 'uppercase' }}>Notes</p>
              <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>{client.notes}</p>
            </div>
          )}
        </div>

        {/* Risk breakdown */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Risk analysis</h3>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: riskBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: riskColor }}>{riskScore}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'No overdue invoices', ok: overdueInv.length === 0, note: overdueInv.length > 0 ? `${overdueInv.length} overdue` : 'All paid on time' },
              { label: 'Outstanding balance', ok: totalOutstanding < 500, note: totalOutstanding > 0 ? fmt(totalOutstanding) + ' owed' : 'No balance' },
              { label: 'Active client', ok: !isInactive, note: daysSince !== null ? `Last seen ${daysSince}d ago` : 'No sessions' },
              { label: 'No unbilled work', ok: unbilledSessions.length === 0, note: unbilledSessions.length > 0 ? `${unbilledSessions.length} sessions unbilled` : 'All invoiced' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.ok ? '✅' : '⚠️'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '12px', color: item.ok ? '#16a34a' : '#d97706' }}>{item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Invoices ({inv.length})</h3>
          {unbilledValue > 0 && (
            <span style={{ fontSize: '12px', background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '999px', fontWeight: 600 }}>
              {fmt(unbilledValue, client.currency)} unbilled
            </span>
          )}
        </div>
        {inv.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No invoices yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                {['Invoice #', 'Date', 'Due', 'Amount', 'Paid', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 0', color: '#6b7280', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inv.map((i: any) => (
                <tr key={i.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 0' }}>
                    <Link href={`/invoices/${i.id}`} style={{ color: '#1e40af', fontWeight: 600, textDecoration: 'none', fontFamily: 'monospace', fontSize: '12px' }}>
                      {i.invoice_number}
                    </Link>
                  </td>
                  <td style={{ padding: '10px 0', color: '#6b7280' }}>{i.issue_date}</td>
                  <td style={{ padding: '10px 0', color: '#6b7280' }}>{i.due_date}</td>
                  <td style={{ padding: '10px 0', fontWeight: 600 }}>{fmt(i.total_amount, client.currency)}</td>
                  <td style={{ padding: '10px 0', color: '#16a34a' }}>{fmt(i.paid_amount, client.currency)}</td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 600,
                      background: i.status === 'paid' ? '#dcfce7' : i.status === 'overdue' ? '#fee2e2' : '#dbeafe',
                      color: i.status === 'paid' ? '#16a34a' : i.status === 'overdue' ? '#dc2626' : '#1d4ed8',
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

      {/* Recent sessions */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Session history ({sess.length})</h3>
        {sess.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No sessions yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                {['Date', 'Duration', 'Rate', 'Charge', 'Status', 'Notes'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 0', color: '#6b7280', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sess.slice(0, 15).map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 0', color: '#6b7280' }}>{s.date}</td>
                  <td style={{ padding: '10px 0' }}>{s.total_time_mins} min</td>
                  <td style={{ padding: '10px 0', color: '#6b7280' }}>${s.hourly_rate}/hr</td>
                  <td style={{ padding: '10px 0', fontWeight: 600 }}>{Number(s.charge) === 0 ? 'Free' : fmt(s.charge, client.currency)}</td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{ fontSize: '11px', background: s.is_invoiced ? '#dcfce7' : '#fef3c7', color: s.is_invoiced ? '#16a34a' : '#92400e', padding: '2px 8px', borderRadius: '999px', fontWeight: 500 }}>
                      {s.is_invoiced ? 'Invoiced' : 'Unbilled'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 0', color: '#6b7280', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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