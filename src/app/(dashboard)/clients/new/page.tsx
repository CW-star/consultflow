'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    currency: 'CAD',
    default_hourly_rate: '',
    payment_terms_days: '14',
    notes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        default_hourly_rate: Number(form.default_hourly_rate),
        payment_terms_days: Number(form.payment_terms_days),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
    } else {
      router.push('/clients')
      router.refresh()
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1px solid #e5e7eb', borderRadius: '8px',
    fontSize: '14px', boxSizing: 'border-box' as const, outline: 'none',
  }

  const labelStyle = {
    display: 'block', fontSize: '13px',
    fontWeight: 500, color: '#374151', marginBottom: '6px',
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '24px' }}>
        <a href="/clients" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>
          ← Back to clients
        </a>
        <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>Add new client</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Add a new client to your practice</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div>
          <label style={labelStyle}>Full name *</label>
          <input name="name" value={form.name} onChange={handleChange}
            placeholder="e.g. Client O" style={inputStyle} required/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="client@email.com" style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              placeholder="+1 (555) 000-0000" style={inputStyle}/>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Company</label>
          <input name="company" value={form.company} onChange={handleChange}
            placeholder="Company name (optional)" style={inputStyle}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Currency</label>
            <select name="currency" value={form.currency} onChange={handleChange} style={inputStyle}>
              <option value="CAD">CAD</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Hourly rate ($)</label>
            <input type="number" name="default_hourly_rate" value={form.default_hourly_rate}
              onChange={handleChange} placeholder="150" step="0.01" style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Payment terms (days)</label>
            <input type="number" name="payment_terms_days" value={form.payment_terms_days}
              onChange={handleChange} placeholder="14" style={inputStyle}/>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="Any notes about this client..." rows={3}
            style={{ ...inputStyle, resize: 'none' as const }}/>
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button type="submit" disabled={loading} style={{
            flex: 1, padding: '11px', background: '#1e40af', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Saving...' : 'Add client'}
          </button>
          <button type="button" onClick={() => router.back()} style={{
            padding: '11px 20px', background: 'white', color: '#6b7280',
            border: '1px solid #e5e7eb', borderRadius: '8px',
            fontSize: '14px', cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}