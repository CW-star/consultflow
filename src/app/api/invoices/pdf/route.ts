import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const invoiceId = searchParams.get('id')

  if (!invoiceId) return NextResponse.json({ error: 'No invoice ID' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` }

  const [invRes, sessRes, settingsRes] = await Promise.all([
    fetch(`${url}/rest/v1/invoices?id=eq.${invoiceId}&select=*,clients(*)`, { headers }),
    fetch(`${url}/rest/v1/sessions?invoice_id=eq.${invoiceId}&select=*&order=date.asc`, { headers }),
    fetch(`${url}/rest/v1/settings?select=*&limit=1`, { headers }),
  ])

  const invoices = await invRes.json()
  const sessions = await sessRes.json()
  const settings = await settingsRes.json()

  const invoice = invoices[0]
  const client = invoice?.clients
  const company = settings[0] || {}

  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

  const fmt = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: invoice.currency || 'CAD' }).format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  const sessionsRows = sessions.map((s: any) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">${s.date}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px">${s.notes || 'Consulting session'}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right">${s.total_time_mins} min</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right">$${s.hourly_rate}/hr</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;font-weight:600">${s.charge === 0 ? 'Free' : fmt(s.charge)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Invoice ${invoice.invoice_number}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; padding: 48px; font-size: 14px; line-height: 1.5; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
  .company-name { font-size: 24px; font-weight: 700; color: #1e40af; }
  .invoice-label { font-size: 36px; font-weight: 700; color: #e5e7eb; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 40px; }
  .bill-to h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; }
  .bill-to p { font-size: 15px; font-weight: 600; }
  .invoice-details { text-align: right; }
  .invoice-details .row { display: flex; justify-content: flex-end; gap: 24px; margin-bottom: 6px; }
  .invoice-details .label { font-size: 11px; text-transform: uppercase; color: #6b7280; }
  .invoice-details .value { font-size: 14px; font-weight: 600; min-width: 120px; text-align: right; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #f9fafb; }
  th { padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 500; }
  th:last-child, th:nth-child(3), th:nth-child(4) { text-align: right; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .totals-box { width: 280px; }
  .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
  .grand-total { display: flex; justify-content: space-between; padding: 12px 0 6px; font-size: 18px; font-weight: 700; border-top: 2px solid #111827; margin-top: 4px; }
  .grand-total .amount { color: #1e40af; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: capitalize; background: ${invoice.status === 'paid' ? '#dcfce7' : '#fef3c7'}; color: ${invoice.status === 'paid' ? '#16a34a' : '#92400e'}; }
  .terms { margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px; font-size: 12px; color: #6b7280; border-left: 3px solid #1e40af; }
  .terms h4 { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
  .terms p { margin-bottom: 4px; line-height: 1.6; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${company.company_name || 'Consulting Practice'}</div>
      ${company.company_email ? `<div style="color:#6b7280;font-size:13px;margin-top:4px">${company.company_email}</div>` : ''}
      ${company.company_phone ? `<div style="color:#6b7280;font-size:13px">${company.company_phone}</div>` : ''}
      ${company.company_address ? `<div style="color:#6b7280;font-size:13px">${company.company_address}</div>` : ''}
    </div>
    <div style="text-align:right">
      <div class="invoice-label">INVOICE</div>
      <span class="status-badge">${invoice.status}</span>
    </div>
  </div>

  <div class="meta">
    <div class="bill-to">
      <h3>Bill to</h3>
      <p>${client?.name || 'Client'}</p>
      ${client?.email ? `<p style="color:#6b7280;font-size:13px">${client.email}</p>` : ''}
    </div>
    <div class="invoice-details">
      <div class="row"><span class="label">Invoice number</span><span class="value" style="font-family:monospace">${invoice.invoice_number}</span></div>
      <div class="row"><span class="label">Issue date</span><span class="value">${fmtDate(invoice.issue_date)}</span></div>
      <div class="row"><span class="label">Due date</span><span class="value" style="color:#dc2626">${fmtDate(invoice.due_date)}</span></div>
      <div class="row"><span class="label">Currency</span><span class="value">${invoice.currency}</span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Duration</th>
        <th>Rate</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${sessionsRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span style="color:#6b7280">Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
      ${invoice.tax_rate > 0 ? `<div class="total-row"><span style="color:#6b7280">Tax (${invoice.tax_rate}%)</span><span>${fmt(invoice.tax_amount)}</span></div>` : ''}
      <div class="grand-total"><span>Total</span><span class="amount">${fmt(invoice.total_amount)}</span></div>
      ${invoice.paid_amount > 0 ? `<div class="total-row" style="color:#16a34a"><span>Paid</span><span>−${fmt(invoice.paid_amount)}</span></div>` : ''}
      ${invoice.total_amount - invoice.paid_amount > 0 ? `<div class="total-row" style="font-weight:700;color:#dc2626"><span>Balance due</span><span>${fmt(invoice.total_amount - invoice.paid_amount)}</span></div>` : ''}
    </div>
  </div>

  ${invoice.notes ? `<div style="padding:16px;background:#f9fafb;border-radius:8px;margin-bottom:24px"><p style="font-size:11px;text-transform:uppercase;color:#6b7280;margin-bottom:6px">Notes</p><p style="font-size:13px;color:#374151">${invoice.notes}</p></div>` : ''}

  <div class="terms">
    <h4>Terms & Conditions</h4>
    <p>${company.payment_terms || 'Payment due within 14 days of invoice date.'}</p>
    <p>Please include the invoice number with your payment.</p>
    <p>Accepted payment methods: E-Transfer, Bank Transfer, PayPal, Stripe.</p>
    <p>Late payments may be subject to a 2% monthly interest charge after the due date.</p>
    <p>For questions regarding this invoice, please contact us at ${company.company_email || 'our office'}.</p>
  </div>

  <div class="footer">
    <p>Thank you for your business · ${company.company_name || 'Consulting Practice'} · Generated by ConsultFlow</p>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.html"`,
    },
  })
}