'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const statuses = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'partial', 'cancelled']
const statusColors: Record<string, { bg: string; color: string }> = {
  paid: { bg: '#dcfce7', color: '#16a34a' },
  sent: { bg: '#dbeafe', color: '#1d4ed8' },
  viewed: { bg: '#ede9fe', color: '#7c3aed' },
  overdue: { bg: '#fee2e2', color: '#dc2626' },
  draft: { bg: '#f3f4f6', color: '#6b7280' },
  partial: { bg: '#fef3c7', color: '#d97706' },
  cancelled: { bg: '#f3f4f6', color: '#9ca3af' },
}

export default function StatusDropdown({ invoiceId, currentStatus }: {
  invoiceId: string
  currentStatus: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const sc = statusColors[status] ?? statusColors.draft

  async function handleChange(newStatus: string) {
    setLoading(true)
    setOpen(false)
    await fetch('/api/invoices/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId, status: newStatus }),
    })
    setStatus(newStatus)
    setLoading(false)
    router.refresh()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} disabled={loading} style={{
        background: sc.bg, color: sc.color, padding: '6px 14px',
        borderRadius: '20px', fontSize: '13px', fontWeight: 600,
        border: `1px solid ${sc.color}40`, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        {loading ? 'Updating...' : status} {!loading && '▾'}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)}/>
          <div style={{
            position: 'absolute', right: 0, top: '36px',
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '6px', minWidth: '160px',
            zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}>
            {statuses.map(s => {
              const c = statusColors[s]
              return (
                <button key={s} onClick={() => handleChange(s)} style={{
                  width: '100%', textAlign: 'left', padding: '8px 12px',
                  background: s === status ? c.bg : 'none',
                  border: 'none', borderRadius: '8px', fontSize: '13px',
                  color: c.color, cursor: 'pointer', fontWeight: s === status ? 600 : 400,
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color, flexShrink: 0 }}/>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  {s === status && ' ✓'}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}