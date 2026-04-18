export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', id)
    .single()

  if (error || !invoice) return notFound()

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('invoice_id', id)
    .order('date', { ascending: true })

  const sess = sessions ?? []
  const fmt = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: invoice.currency || 'CAD' }).format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  const statusColors: Record<string, { bg: string; color: string }> = {
    paid: { bg: '#dcfce7', color: '#16a34a' },
    sent: { bg: '#dbeafe', color: '#1d4ed8' },
    overdue: { bg: '#fee2e2', color: '#dc2626' },
    draft: { bg: '#f3f4f6', color: '#6b7280' },
    partial: { bg: '#fef3c7', color: '#d97706' },
  }
  const sc = statusColors[invoice.status] ?? statusColors.draft

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <a href="/invoices" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>← Back to invoices</a>
          <h1 style={{ fontSize: '22px', fontWeight: 600, margin: 0 }}>{invoice.invoice_number}</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{invoice.clients?.name}</p>
        </div>
        <span style={{ background: sc.bg, color: sc.color, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>
          {invoice.status}
        </span>
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Issue date</p>
            <p style={{ fontSize: '15px', fontWeight: 500 }}>{fmtDate(invoice.issue_date)}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Due date</p>
            <p style={{ fontSize: '15px', fontWeight: 500 }}>{fmtDate(invoice.due_date)}</p>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Total</p>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#1e40af' }}>{fmt(invoice.total_amount)}</p>
          </div>
        </div>

        {sess.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                {['Date', 'Description', 'Duration', 'Rate', 'Amount'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Duration' || h === 'Rate' || h === 'Amount' ? 'right' : 'left', padding: '8px 0', color: '#6b7280', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sess.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 0', color: '#6b7280', fontSize: '13px' }}>{s.date}</td>
                  <td style={{ padding: '12px 0' }}>{s.notes || 'Consulting session'}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#6b7280' }}>{s.total_time_mins} min</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#6b7280' }}>${s.hourly_rate}/hr</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 500 }}>{fmt(s.charge)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: '#6b7280', fontSize: '14px' }}>No sessions linked to this invoice.</p>
        )}

        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '16px', fontWeight: 600 }}>
              <span>Total</span>
              <span style={{ color: '#1e40af' }}>{fmt(invoice.total_amount)}</span>
            </div>
            {invoice.paid_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', color: '#16a34a' }}>
                <span>Paid</span>
                <span>−{fmt(invoice.paid_amount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}