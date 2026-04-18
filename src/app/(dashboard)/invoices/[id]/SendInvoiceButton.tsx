'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SendInvoiceButton({ invoiceId, clientEmail, status }: {
  invoiceId: string
  clientEmail: string | null
  status: string
}) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  if (status === 'paid' || status === 'cancelled') return null

  async function handleSend() {
    if (!clientEmail) {
      setError('Client has no email address. Add one in the clients page first.')
      return
    }
    if (!confirm(`Send invoice to ${clientEmail}?`)) return

    setLoading(true)
    setError('')

    const res = await fetch('/api/invoices/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Failed to send invoice')
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <div>
      {error && (
        <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '8px' }}>{error}</p>
      )}
      {sent ? (
        <span style={{
          background: '#dcfce7', color: '#16a34a',
          padding: '10px 20px', borderRadius: '8px',
          fontSize: '14px', fontWeight: 500,
        }}>
          ✓ Invoice sent!
        </span>
      ) : (
        <button onClick={handleSend} disabled={loading} style={{
          background: '#1e40af', color: 'white', border: 'none',
          padding: '10px 20px', borderRadius: '8px', fontSize: '14px',
          fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Sending...' : clientEmail ? `Send to ${clientEmail}` : 'Send invoice'}
        </button>
      )}
    </div>
  )
}