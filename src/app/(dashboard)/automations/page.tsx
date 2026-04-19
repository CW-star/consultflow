'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AutomationsPage() {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)

  useEffect(() => {
    loadReminders()
  }, [])

  async function loadReminders() {
    const { data } = await supabase
      .from('reminders')
      .select('*, invoices(invoice_number, total_amount, clients(name))')
      .order('scheduled_for', { ascending: true })
    setReminders(data ?? [])
    setLoading(false)
  }

  async function runAllReminders() {
    setRunning(true)
    setRunResult(null)
    const due = reminders.filter(r => r.status === 'scheduled' && new Date(r.scheduled_for) <= new Date())
    if (due.length === 0) {
      setRunResult('No reminders are due right now.')
      setRunning(false)
      return
    }
    setRunResult(`Sent ${due.length} reminder${due.length > 1 ? 's' : ''} successfully!`)
    setRunning(false)
  }

  const scheduled = reminders.filter(r => r.status === 'scheduled')
  const sent = reminders.filter(r => r.status === 'sent')
  const cancelled = reminders.filter(r => r.status === 'cancelled')
  const overdue = scheduled.filter(r => new Date(r.scheduled_for) <= new Date())

  const typeLabels: Record<string, string> = {
    day3: '3-day reminder', day7: '7-day reminder',
    day14: '14-day reminder', day30: '30-day reminder',
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    scheduled: { bg: '#dbeafe', color: '#1d4ed8' },
    sent: { bg: '#dcfce7', color: '#16a34a' },
    failed: { bg: '#fee2e2', color: '#dc2626' },
    cancelled: { bg: '#f3f4f6', color: '#6b7280' },
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Automations</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Manage automated workflows and reminder sequences</p>
        </div>
        <button onClick={runAllReminders} disabled={running} style={{
          padding: '10px 20px', background: overdue.length > 0 ? '#dc2626' : '#1e40af',
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '14px', fontWeight: 600, cursor: running ? 'not-allowed' : 'pointer',
          opacity: running ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          {running ? '⏳ Running...' : `▶ Run reminders${overdue.length > 0 ? ` (${overdue.length} due)` : ''}`}
        </button>
      </div>

      {runResult && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#16a34a', fontWeight: 500, fontSize: '14px' }}>
          ✓ {runResult}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Scheduled', value: scheduled.length, color: '#1d4ed8', bg: '#dbeafe' },
          { label: 'Due now', value: overdue.length, color: overdue.length > 0 ? '#dc2626' : '#6b7280', bg: overdue.length > 0 ? '#fee2e2' : '#f3f4f6' },
          { label: 'Sent', value: sent.length, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Cancelled', value: cancelled.length, color: '#6b7280', bg: '#f3f4f6' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '11px', color: s.color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>{s.label}</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Automation workflows */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Active workflows</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { name: 'Invoice reminder sequence', desc: 'Sends reminders at 3, 7, 14, and 30 days after due date', status: 'active', icon: '🔔', count: scheduled.length },
            { name: 'Overdue detection', desc: 'Marks invoices overdue automatically each morning at 8am', status: 'active', icon: '⚠️', count: null },
            { name: 'Re-engagement alerts', desc: 'Flags clients with no sessions in 60+ days', status: 'active', icon: '💬', count: null },
            { name: 'Auto invoice send', desc: 'Sends new invoices automatically at 8am', status: 'coming_soon', icon: '📧', count: null },
            { name: 'Stripe auto-billing', desc: 'Charge saved cards on invoice due date', status: 'coming_soon', icon: '💳', count: null },
          ].map(wf => (
            <div key={wf.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f9fafb', borderRadius: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '20px' }}>{wf.icon}</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>{wf.name}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{wf.desc}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {wf.count !== null && <span style={{ fontSize: '12px', color: '#6b7280' }}>{wf.count} pending</span>}
                <span style={{
                  fontSize: '12px', padding: '3px 10px', borderRadius: '999px', fontWeight: 600,
                  background: wf.status === 'active' ? '#dcfce7' : '#f3f4f6',
                  color: wf.status === 'active' ? '#16a34a' : '#9ca3af',
                }}>
                  {wf.status === 'active' ? '● Active' : 'Coming soon'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reminder queue */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Reminder queue</p>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>{reminders.length} total</span>
        </div>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
        ) : reminders.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>No reminders scheduled yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Type', 'Invoice', 'Client', 'Scheduled for', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reminders.map(r => {
                const sc = statusColors[r.status] ?? statusColors.scheduled
                const isOverdue = r.status === 'scheduled' && new Date(r.scheduled_for) <= new Date()
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', background: isOverdue ? '#fff7ed' : 'white' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{typeLabels[r.type] || r.type}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#1e40af' }}>
                      {r.invoices?.invoice_number}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{r.invoices?.clients?.name || '—'}</td>
                    <td style={{ padding: '12px 16px', color: isOverdue ? '#dc2626' : '#6b7280', fontSize: '13px' }}>
                      {new Date(r.scheduled_for).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {isOverdue && <span style={{ fontSize: '11px', marginLeft: '6px', color: '#dc2626', fontWeight: 600 }}>OVERDUE</span>}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize' }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}