'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RecordPaymentButton({ invoiceId, outstanding, currency }: {
  invoiceId: string
  outstanding: number
  currency: string
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState(outstanding.toFixed(2))
  const [method, setMethod] = useState('e_transfer')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/payments/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice_id: invoiceId,
        amount: Number(amount),
        payment_date: date,
        payment_method: method,
      }),
    })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: '#16a34a', color: 'white', border: 'none',
        padding: '10px 20px', borderRadius: '8px', fontSize: '14px',
        fontWeight: 500, cursor: 'pointer',
      }}>
        Record payment
      </button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Record payment</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Amount ({currency})</label>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} required/>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Payment method</label>
                <select value={method} onChange={e => setMethod(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="e_transfer">E-Transfer</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Payment date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} required/>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" disabled={loading} style={{
                  flex: 1, padding: '11px', background: '#16a34a', color: 'white',
                  border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? 'Saving...' : 'Record payment'}
                </button>
                <button type="button" onClick={() => setOpen(false)} style={{
                  padding: '11px 20px', background: 'white', color: '#6b7280',
                  border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', cursor: 'pointer',
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
