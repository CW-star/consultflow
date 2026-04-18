export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import RecordPaymentButton from './RecordPaymentButton'

const fmt = (n: number, currency = 'CAD') =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

async function getData(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  const [invRes, sessRes, payRes] = await Promise.all([
    fetch(`${url}/rest/v1/invoices?id=eq.${id}&select=*,clients(*)`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/sessions?invoice_id=eq.${id}&select=*&order=date.asc`, { headers, cache: 'no-store' }),
    fetch(`${url}/rest/v1/payments?invoice_id=eq.${id}&select=*&order=payment_date.desc`, { headers, cache: 'no-store' }),
  ])

  const invoices = await invRes.json()
  const sessions = await sessRes.json()
  const payments = await payRes.json()

  return {
    invoice: Array.isArray(invoices) ? invoices[0] : null,
    sessions: Array.isArray(sessions) ? sessions : [],
    payments: Array.isArray(payments) ? payments : [],
  }
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { invoice, sessions: sess, payments: pays } = await getData(id)

  if (!invoice) return notFound()

  const client = invoice.clients
  const outstanding = invoice.total_amount - invoice.paid_amount

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <a href="/invoices" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>← Back to invoices</a>
          <h1 style={{ fontSize: '22px', fontWeight: 600, margin: 0 }}>{invoice.invoice_number}</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>{client?.name}</p>
        </div>
        <span style={{ background: sc.bg, color: sc.color, padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>
          {invoice.status}
        </span>
      </div>

      {/* Outstanding alert */}
      {outstanding > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 600, color: '#92400e', margin: 0 }}>
              {fmt(outstanding, client?.currency)} outstanding
            </p>
            <p style={{ fontSize: '13px', color: '#b45309', margin: '2px 0 0' }}>
              Due {fmtDate(invoice.due_date)}
            </p>
          </div>
          <RecordPaymentButton invoiceId={id} outstanding={outstanding} currency={client?.currency || 'CAD'}/>
        </div>
      )}

      {/* Invoice meta */}
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
            <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>Currency</p>
            <p style={{ fontSize: '15px', fontWeight: 500 }}>{invoice.currency}</p>
          </div>
        </div>

        {/* Sessions table */}
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
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 500 }}>
                  {s.charge === 0 ? 'Free' : fmt(s.charge, invoice.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '16px', marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '240px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px' }}>
              <span style={{ color: '#6b7280' }}>Subtotal</span>
              <span>{fmt(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: '16px', fontWeight: 600, borderTop: '1px solid #e5e7eb', marginTop: '8px' }}>
              <span>Total</span>
              <span style={{ color: '#1e40af' }}>{fmt(invoice.total_amount, invoice.currency)}</span>
            </div>
            {invoice.paid_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '14px', color: '#16a34a' }}>
                <span>Paid</span>
                <span>−{fmt(invoice.paid_amount, invoice.currency)}</span>
              </div>
            )}
            {outstanding > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '15px', fontWeight: 600 }}>
                <span style={{ color: '#dc2626' }}>Outstanding</span>
                <span style={{ color: '#dc2626' }}>{fmt(outstanding, invoice.currency)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment history */}
      {pays.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Payment history</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                {['Date', 'Method', 'Amount'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Amount' ? 'right' : 'left', padding: '8px 0', color: '#6b7280', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pays.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 0' }}>{p.payment_date}</td>
                  <td style={{ padding: '10px 0', color: '#6b7280', textTransform: 'capitalize' }}>{p.payment_method?.replace('_', ' ') || '—'}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>{fmt(p.amount, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}