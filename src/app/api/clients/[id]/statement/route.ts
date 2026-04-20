import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` }

  const [clientRes, sessRes, invRes, payRes, settingsRes] = await Promise.all([
    fetch(`${url}/rest/v1/clients?id=eq.${id}&select=*`, { headers }),
    fetch(`${url}/rest/v1/sessions?client_id=eq.${id}&select=*&order=date.asc`, { headers }),
    fetch(`${url}/rest/v1/invoices?client_id=eq.${id}&select=*&order=issue_date.asc`, { headers }),
    fetch(`${url}/rest/v1/payments?select=*&order=payment_date.desc`, { headers }),
    fetch(`${url}/rest/v1/settings?select=*&limit=1`, { headers }),
  ])

  const clients = await clientRes.json()
  const sessions = await sessRes.json()
  const invoices = await invRes.json()
  const payments = await payRes.json()
  const settings = await settingsRes.json()

  const client = clients[0]
  const company = settings[0] || {}

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const fmt = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: client.currency || 'CAD' }).format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  // Metrics
  const totalBilled = sessions.reduce((s: number, sess: any) => s + (Number(sess.charge) || 0), 0)
  const totalCollected = invoices.reduce((s: number, i: any) => s + (i.paid_amount || 0), 0)
  const totalOutstanding = invoices.reduce((s: number, i: any) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0)
  const totalMins = sessions.reduce((s: number, sess: any) => s + (sess.total_time_mins || 0), 0)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  const collectionRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : '0'

  // Invoice rows
  const invoiceRows = invoices.map((i: any) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-family:monospace;font-size:12px;color:#374151">${i.invoice_number}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">${i.issue_date}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151">${i.due_date}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;font-weight:600">${fmt(i.total_amount)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;color:#16a34a">${fmt(i.paid_amount || 0)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;color:${(i.total_amount - i.paid_amount) > 0 ? '#dc2626' : '#16a34a'}">${fmt(i.total_amount - (i.paid_amount || 0))}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center">
        <span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:${i.status === 'paid' ? '#dcfce7' : i.status === 'overdue' ? '#fee2e2' : '#dbeafe'};color:${i.status === 'paid' ? '#16a34a' : i.status === 'overdue' ? '#dc2626' : '#1d4ed8'}">${i.status}</span>
      </td>
    </tr>
  `).join('')

  // Session rows
  const sessionRows = sessions.slice(0, 20).map((s: any) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;font-size:12px;color:#374151;font-family:monospace">${s.date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;font-size:12px;color:#374151">${s.notes || 'Consulting session'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;font-size:12px;text-align:right;color:#6b7280">${s.total_time_mins} min</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;font-size:12px;text-align:right;color:#6b7280">$${s.hourly_rate}/hr</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;font-size:12px;text-align:right;font-weight:600">${Number(s.charge) === 0 ? 'Free' : fmt(s.charge)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;font-size:12px;text-align:center">
        <span style="padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;background:${s.is_invoiced ? '#dcfce7' : '#fef3c7'};color:${s.is_invoiced ? '#16a34a' : '#92400e'}">${s.is_invoiced ? 'Invoiced' : 'Unbilled'}</span>
      </td>
    </tr>
  `).join('')

  const generatedDate = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Client Statement — ${client.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; padding: 48px; font-size: 14px; line-height: 1.5; background: white; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb; }
  .company-name { font-size: 22px; font-weight: 800; color: #1e40af; margin-bottom: 4px; }
  .company-info { font-size: 12px; color: #6b7280; line-height: 1.6; }
  .doc-title { font-size: 32px; font-weight: 800; color: #e5e7eb; letter-spacing: -1px; }
  .doc-sub { font-size: 13px; color: #9ca3af; margin-top: 4px; }

  .client-section { display: flex; justify-content: space-between; margin-bottom: 32px; }
  .client-card { background: #f9fafb; border-radius: 12px; padding: 20px; flex: 1; margin-right: 16px; border: 1px solid #e5e7eb; }
  .client-card h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; font-weight: 700; margin-bottom: 10px; }
  .client-name { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 4px; }
  .client-detail { font-size: 13px; color: #6b7280; margin-bottom: 2px; }

  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
  .metric { background: #f9fafb; border-radius: 10px; padding: 16px; border: 1px solid #e5e7eb; text-align: center; }
  .metric-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; font-weight: 700; margin-bottom: 6px; }
  .metric-value { font-size: 20px; font-weight: 800; }

  .section { margin-bottom: 32px; }
  .section-title { font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
  .section-badge { font-size: 11px; background: #eff6ff; color: #1e40af; padding: 3px 10px; border-radius: 999px; font-weight: 700; }

  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #f9fafb; }
  th { padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; font-weight: 700; border-bottom: 2px solid #e5e7eb; }

  .summary-box { background: #1e40af; color: white; border-radius: 12px; padding: 20px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; }
  .summary-item { text-align: center; }
  .summary-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.7; margin-bottom: 4px; }
  .summary-value { font-size: 22px; font-weight: 800; }

  .terms { margin-top: 32px; padding: 16px 20px; background: #f9fafb; border-radius: 10px; border-left: 3px solid #1e40af; font-size: 12px; color: #6b7280; }
  .terms h4 { font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }

  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #9ca3af; }

  @media print {
    body { padding: 24px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>

  <!-- Print button (hidden when printing) -->
  <div class="no-print" style="margin-bottom:24px;display:flex;gap:10px">
    <button onclick="window.print()" style="padding:10px 20px;background:#1e40af;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
      🖨 Print / Save as PDF
    </button>
    <button onclick="window.close()" style="padding:10px 20px;background:#f3f4f6;color:#374151;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">
      ✕ Close
    </button>
  </div>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="company-name">${company.company_name || 'Consulting Practice'}</div>
      <div class="company-info">
        ${company.company_email ? `${company.company_email}<br>` : ''}
        ${company.company_phone ? `${company.company_phone}<br>` : ''}
        ${company.company_address ? `${company.company_address}` : ''}
      </div>
    </div>
    <div style="text-align:right">
      <div class="doc-title">STATEMENT</div>
      <div class="doc-sub">Generated ${generatedDate}</div>
    </div>
  </div>

  <!-- Client info -->
  <div class="client-section">
    <div class="client-card">
      <h3>Client</h3>
      <div class="client-name">${client.name}</div>
      ${client.email ? `<div class="client-detail">✉ ${client.email}</div>` : ''}
      ${client.phone ? `<div class="client-detail">📞 ${client.phone}</div>` : ''}
      ${client.company ? `<div class="client-detail">🏢 ${client.company}</div>` : ''}
    </div>
    <div style="background:#eff6ff;border-radius:12px;padding:20px;flex:1;border:1px solid #bfdbfe">
      <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#1e40af;font-weight:700;margin-bottom:10px">Statement period</h3>
      <div style="font-size:15px;font-weight:700;color:#1e40af">
        ${sessions.length > 0 ? fmtDate(sessions[0].date) : 'N/A'}
        ${sessions.length > 0 ? ` — ${fmtDate(sessions[sessions.length - 1].date)}` : ''}
      </div>
      <div style="font-size:12px;color:#3b82f6;margin-top:6px">${sessions.length} sessions · ${hours}h ${mins}m total</div>
      <div style="font-size:12px;color:#3b82f6;margin-top:2px">Currency: ${client.currency || 'CAD'}</div>
    </div>
  </div>

  <!-- Summary bar -->
  <div class="summary-box">
    <div class="summary-item">
      <div class="summary-label">Total billed</div>
      <div class="summary-value">${fmt(totalBilled)}</div>
    </div>
    <div style="width:1px;background:rgba(255,255,255,0.2);height:40px"></div>
    <div class="summary-item">
      <div class="summary-label">Collected</div>
      <div class="summary-value" style="color:#86efac">${fmt(totalCollected)}</div>
    </div>
    <div style="width:1px;background:rgba(255,255,255,0.2);height:40px"></div>
    <div class="summary-item">
      <div class="summary-label">Outstanding</div>
      <div class="summary-value" style="color:${totalOutstanding > 0 ? '#fca5a5' : '#86efac'}">${fmt(totalOutstanding)}</div>
    </div>
    <div style="width:1px;background:rgba(255,255,255,0.2);height:40px"></div>
    <div class="summary-item">
      <div class="summary-label">Collection rate</div>
      <div class="summary-value">${collectionRate}%</div>
    </div>
    <div style="width:1px;background:rgba(255,255,255,0.2);height:40px"></div>
    <div class="summary-item">
      <div class="summary-label">Total hours</div>
      <div class="summary-value">${hours}h ${mins}m</div>
    </div>
  </div>

  <!-- Invoices -->
  <div class="section">
    <div class="section-title">
      Invoice history
      <span class="section-badge">${invoices.length} invoices</span>
    </div>
    ${invoices.length === 0 ? '<p style="color:#9ca3af;font-size:13px;padding:16px 0">No invoices yet</p>' : `
    <table>
      <thead>
        <tr>
          <th>Invoice #</th>
          <th>Issued</th>
          <th>Due</th>
          <th style="text-align:right">Total</th>
          <th style="text-align:right">Paid</th>
          <th style="text-align:right">Balance</th>
          <th style="text-align:center">Status</th>
        </tr>
      </thead>
      <tbody>${invoiceRows}</tbody>
    </table>
    `}
  </div>

  <!-- Sessions -->
  <div class="section">
    <div class="section-title">
      Session history
      <span class="section-badge">${sessions.length} sessions${sessions.length > 20 ? ' (showing 20 most recent)' : ''}</span>
    </div>
    ${sessions.length === 0 ? '<p style="color:#9ca3af;font-size:13px;padding:16px 0">No sessions yet</p>' : `
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th style="text-align:right">Duration</th>
          <th style="text-align:right">Rate</th>
          <th style="text-align:right">Charge</th>
          <th style="text-align:center">Status</th>
        </tr>
      </thead>
      <tbody>${sessionRows}</tbody>
    </table>
    `}
  </div>

  <!-- Terms -->
  <div class="terms">
    <h4>Terms & Conditions</h4>
    <p>${company.payment_terms || 'Payment due within 14 days of invoice date.'}</p>
    <p style="margin-top:4px">For questions regarding this statement, please contact ${company.company_email || 'our office'}.</p>
  </div>

  <!-- Footer -->
  <div class="footer">
    <span>${company.company_name || 'Consulting Practice'} · Client Statement · ${client.name}</span>
    <span>Generated ${generatedDate} · ConsultFlow</span>
  </div>

</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="statement-${client.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html"`,
    },
  })
}