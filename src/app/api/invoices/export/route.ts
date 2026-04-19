import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'csv'

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` }

  const [invRes, settingsRes] = await Promise.all([
    fetch(`${url}/rest/v1/invoices?select=*,clients(name,email,currency)&order=issue_date.desc`, { headers }),
    fetch(`${url}/rest/v1/settings?select=*&limit=1`, { headers }),
  ])

  const invoices = await invRes.json()
  const settings = await settingsRes.json()
  const company = settings[0] || {}
  const fmt = (n: number) => `$${Number(n || 0).toFixed(2)}`

  if (format === 'csv') {
    const rows = [
      ['Invoice Number', 'Client', 'Issue Date', 'Due Date', 'Currency', 'Subtotal', 'Tax', 'Total', 'Paid', 'Outstanding', 'Status'],
      ...invoices.map((i: any) => [
        i.invoice_number,
        i.clients?.name || '',
        i.issue_date,
        i.due_date,
        i.currency,
        i.subtotal,
        i.tax_amount || 0,
        i.total_amount,
        i.paid_amount || 0,
        (i.total_amount - (i.paid_amount || 0)).toFixed(2),
        i.status,
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="invoices-export.csv"',
      },
    })
  }

  // PDF Report (HTML format, open in browser and print to PDF)
  const totalBilled = invoices.reduce((s: number, i: any) => s + (i.total_amount || 0), 0)
  const totalCollected = invoices.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0)
  const totalOutstanding = totalBilled - totalCollected
  const paidCount = invoices.filter((i: any) => i.status === 'paid').length
  const overdueCount = invoices.filter((i: any) => i.status === 'overdue').length
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '0'

  const rows = invoices.map((i: any) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-family:monospace;font-size:12px">${i.invoice_number}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px">${i.clients?.name || '—'}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px">${i.issue_date}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px">${i.due_date}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right">${fmt(i.total_amount)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;color:#16a34a">${fmt(i.paid_amount)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;color:${i.total_amount - i.paid_amount > 0 ? '#dc2626' : '#16a34a'}">${fmt(i.total_amount - i.paid_amount)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f3f4f6;text-align:center">
        <span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${i.status === 'paid' ? '#dcfce7' : i.status === 'overdue' ? '#fee2e2' : '#dbeafe'};color:${i.status === 'paid' ? '#16a34a' : i.status === 'overdue' ? '#dc2626' : '#1d4ed8'}">${i.status}</span>
      </td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Financial Report — ${company.company_name || 'Consulting Practice'}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; padding: 48px; font-size: 14px; }
  h1 { font-size: 28px; font-weight: 700; color: #1e40af; margin-bottom: 4px; }
  .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 40px; }
  .stats { display: flex; gap: 16px; margin-bottom: 40px; flex-wrap: wrap; }
  .stat { flex: 1; min-width: 140px; background: #f9fafb; border-radius: 10px; padding: 16px; border: 1px solid #e5e7eb; }
  .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px; }
  .stat-value { font-size: 22px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #f9fafb; }
  th { padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 500; border-bottom: 2px solid #e5e7eb; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <h1>${company.company_name || 'Consulting Practice'}</h1>
  <p class="subtitle">Financial Report · Generated ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  <div class="stats">
    <div class="stat"><div class="stat-label">Total billed</div><div class="stat-value" style="color:#1e40af">${fmt(totalBilled)}</div></div>
    <div class="stat"><div class="stat-label">Collected</div><div class="stat-value" style="color:#16a34a">${fmt(totalCollected)}</div></div>
    <div class="stat"><div class="stat-label">Outstanding</div><div class="stat-value" style="color:#dc2626">${fmt(totalOutstanding)}</div></div>
    <div class="stat"><div class="stat-label">Collection rate</div><div class="stat-value" style="color:${Number(collectionRate) >= 90 ? '#16a34a' : '#d97706'}">${collectionRate}%</div></div>
    <div class="stat"><div class="stat-label">Paid / Overdue</div><div class="stat-value">${paidCount} / <span style="color:#dc2626">${overdueCount}</span></div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Invoice #</th><th>Client</th><th>Issued</th><th>Due</th>
        <th style="text-align:right">Total</th><th style="text-align:right">Paid</th>
        <th style="text-align:right">Outstanding</th><th style="text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <p>${company.company_name || 'Consulting Practice'} · ConsultFlow Financial Report · ${new Date().toLocaleDateString()}</p>
    <p style="margin-top:4px">Open in browser and press Cmd+P (Mac) or Ctrl+P (Windows) to save as PDF</p>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="financial-report-${new Date().toISOString().split('T')[0]}.html"`,
    },
  })
}