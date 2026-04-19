'use client'
import { useState } from 'react'

export default function ExportPreview({ invoices, company }: {
  invoices: any[]
  company: any
}) {
  const [modal, setModal] = useState<'csv' | 'pdf' | null>(null)

  const fmt = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
  const totalBilled = invoices.reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalPaid = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0)
  const totalOutstanding = totalBilled - totalPaid
  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : '0'

  const statusColors: Record<string, { bg: string; color: string }> = {
    paid: { bg: '#dcfce7', color: '#16a34a' },
    sent: { bg: '#dbeafe', color: '#1d4ed8' },
    overdue: { bg: '#fee2e2', color: '#dc2626' },
    draft: { bg: '#f3f4f6', color: '#6b7280' },
    partial: { bg: '#fef3c7', color: '#d97706' },
    cancelled: { bg: '#f3f4f6', color: '#9ca3af' },
  }

  return (
    <>
      {/* Export buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => setModal('csv')} style={{
          padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb',
          borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          📊 Export CSV
        </button>
        <button onClick={() => setModal('pdf')} style={{
          padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb',
          borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          📄 PDF Report
        </button>
      </div>

      {/* Modal backdrop */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }} onClick={() => setModal(null)}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%',
            maxWidth: '800px', maxHeight: '85vh', display: 'flex',
            flexDirection: 'column', overflow: 'hidden',
          }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>
                  {modal === 'csv' ? '📊 CSV Export Preview' : '📄 PDF Report Preview'}
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                  {invoices.length} invoices · {modal === 'csv' ? 'Comma-separated values' : 'Printable financial report'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <a
                  href={`/api/invoices/export?format=${modal}`}
                  target={modal === 'pdf' ? '_blank' : undefined}
                  download={modal === 'csv' ? 'invoices-export.csv' : undefined}
                  onClick={() => setTimeout(() => setModal(null), 500)}
                  style={{
                    padding: '9px 20px', background: '#1e40af', color: 'white',
                    borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                    textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
                  }}
                >
                  ↓ Download {modal.toUpperCase()}
                </a>
                <button onClick={() => setModal(null)} style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: '#f3f4f6', border: 'none', cursor: 'pointer',
                  fontSize: '18px', color: '#6b7280',
                }}>×</button>
              </div>
            </div>

            {/* Preview content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>

              {/* CSV Preview */}
              {modal === 'csv' && (
                <div>
                  <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px', fontWeight: 600 }}>
                      FILE CONTENTS PREVIEW — first {Math.min(invoices.length, 5)} of {invoices.length} rows
                    </p>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'monospace' }}>
                        <thead>
                          <tr style={{ background: '#1e40af', color: 'white' }}>
                            {['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Currency', 'Total', 'Paid', 'Outstanding', 'Status'].map(h => (
                              <th key={h} style={{ padding: '8px 10px', textAlign: 'left', whiteSpace: 'nowrap', fontSize: '11px' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.slice(0, 5).map((inv: any, i: number) => (
                            <tr key={inv.id} style={{ background: i % 2 === 0 ? 'white' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{inv.invoice_number}</td>
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{inv.clients?.name}</td>
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{inv.issue_date}</td>
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{inv.due_date}</td>
                              <td style={{ padding: '7px 10px' }}>{inv.currency}</td>
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>${Number(inv.total_amount || 0).toFixed(2)}</td>
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>${Number(inv.paid_amount || 0).toFixed(2)}</td>
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>${(Number(inv.total_amount || 0) - Number(inv.paid_amount || 0)).toFixed(2)}</td>
                              <td style={{ padding: '7px 10px' }}>
                                <span style={{
                                  background: statusColors[inv.status]?.bg || '#f3f4f6',
                                  color: statusColors[inv.status]?.color || '#6b7280',
                                  padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
                                }}>
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {invoices.length > 5 && (
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '10px 0 0', textAlign: 'center' }}>
                        + {invoices.length - 5} more rows in full export
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px' }}>
                    {[
                      { label: 'Total rows', value: String(invoices.length) },
                      { label: 'Total columns', value: '11' },
                      { label: 'File format', value: '.csv (UTF-8)' },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                        <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 4px' }}>{s.label}</p>
                        <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF Preview */}
              {modal === 'pdf' && (
                <div>
                  {/* Mock PDF layout */}
                  <div style={{
                    background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px',
                    padding: '32px', fontFamily: 'sans-serif',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                  }}>
                    {/* PDF Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <div>
                        <p style={{ fontSize: '22px', fontWeight: 700, color: '#1e40af', margin: '0 0 4px' }}>
                          {company?.company_name || 'Consulting Practice'}
                        </p>
                        {company?.company_email && <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{company.company_email}</p>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 2px' }}>Financial Report</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                          Generated {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Summary stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '24px' }}>
                      {[
                        { label: 'Total Billed', value: fmt(totalBilled), color: '#1e40af' },
                        { label: 'Collected', value: fmt(totalPaid), color: '#16a34a' },
                        { label: 'Outstanding', value: fmt(totalOutstanding), color: '#dc2626' },
                        { label: 'Collection Rate', value: `${collectionRate}%`, color: '#d97706' },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', border: '1px solid #e5e7eb' }}>
                          <p style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', margin: '0 0 4px' }}>{s.label}</p>
                          <p style={{ fontSize: '16px', fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Invoice table preview */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          {['Invoice #', 'Client', 'Issued', 'Due', 'Total', 'Paid', 'Status'].map(h => (
                            <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.slice(0, 6).map((inv: any, i: number) => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '11px' }}>{inv.invoice_number}</td>
                            <td style={{ padding: '8px' }}>{inv.clients?.name}</td>
                            <td style={{ padding: '8px', color: '#6b7280' }}>{inv.issue_date}</td>
                            <td style={{ padding: '8px', color: '#6b7280' }}>{inv.due_date}</td>
                            <td style={{ padding: '8px', fontWeight: 600 }}>{fmt(inv.total_amount)}</td>
                            <td style={{ padding: '8px', color: '#16a34a' }}>{fmt(inv.paid_amount)}</td>
                            <td style={{ padding: '8px' }}>
                              <span style={{
                                background: statusColors[inv.status]?.bg || '#f3f4f6',
                                color: statusColors[inv.status]?.color || '#6b7280',
                                padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 600,
                              }}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {invoices.length > 6 && (
                      <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', margin: '12px 0 0' }}>
                        + {invoices.length - 6} more invoices in full report
                      </p>
                    )}

                    {/* Footer */}
                    <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
                        {company?.company_name || 'Consulting Practice'} · ConsultFlow Financial Report
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', padding: '12px 16px', background: '#eff6ff', borderRadius: '8px', fontSize: '13px', color: '#1d4ed8' }}>
                    💡 After downloading, open in your browser and press <strong>Cmd+P</strong> (Mac) or <strong>Ctrl+P</strong> (Windows) to save as PDF
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}