export const dynamic = 'force-dynamic'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const fmt = (n: number, currency = 'CAD') =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(n)

const statusColors: Record<string, string> = {
  paid: '#16a34a', sent: '#2563eb', overdue: '#dc2626',
  draft: '#6b7280', partial: '#d97706', cancelled: '#9ca3af',
}

export default async function InvoicesPage() {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(name, currency)')
    .order('issue_date', { ascending: false })

  const inv = invoices ?? []
  const totalAmount = inv.reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalPaid = inv.reduce((s, i) => s + (i.paid_amount || 0), 0)
  const outstanding = totalAmount - totalPaid
  const overdueCount = inv.filter(i => i.status === 'overdue').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>Invoices</h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>{inv.length} invoices · {fmt(outstanding)} outstanding</p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total billed', value: fmt(totalAmount), color: '#1e40af' },
          { label: 'Collected', value: fmt(totalPaid), color: '#16a34a' },
          { label: 'Outstanding', value: fmt(outstanding), color: outstanding > 0 ? '#dc2626' : '#16a34a' },
          { label: 'Overdue', value: String(overdueCount), color: overdueCount > 0 ? '#dc2626' : '#6b7280' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 600, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Invoice table */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
              {['Invoice #', 'Client', 'Issued', 'Due', 'Amount', 'Paid', 'Status'].map(h => (
                <th key={h} style={{ textAlign: h === 'Amount' || h === 'Paid' ? 'right' : 'left', padding: '12px 16px', color: '#6b7280', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inv.map((invoice: any) => (
              <tr key={invoice.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 16px' }}>
                  <Link href={`/invoices/${invoice.id}`} style={{ color: '#1e40af', fontWeight: 500, textDecoration: 'none', fontFamily: 'monospace' }}>
                    {invoice.invoice_number}
                  </Link>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 500 }}>{invoice.clients?.name}</td>
                <td style={{ padding: '14px 16px', color: '#6b7280' }}>{invoice.issue_date}</td>
                <td style={{ padding: '14px 16px', color: '#6b7280' }}>{invoice.due_date}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 500 }}>{fmt(invoice.total_amount, invoice.clients?.currency)}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: '#16a34a' }}>{fmt(invoice.paid_amount, invoice.clients?.currency)}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: statusColors[invoice.status] + '20', color: statusColors[invoice.status], padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize' }}>
                    {invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}