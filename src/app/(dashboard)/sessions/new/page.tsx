'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NewSessionPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    total_time_mins: '',
    hourly_rate: '',
    notes: '',
  })

  useEffect(() => {
    supabase.from('clients').select('id, name, default_hourly_rate')
      .then(({ data }) => setClients(data ?? []))
  }, [])

  function calcMins(start: string, end: string) {
    if (!start || !end) return ''
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    let mins = (eh * 60 + em) - (sh * 60 + sm)
    if (mins < 0) mins += 1440
    return String(mins)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }

    if (name === 'client_id') {
      const client = clients.find(c => c.id === value)
      if (client) updated.hourly_rate = String(client.default_hourly_rate || '')
    }

    if (name === 'start_time' || name === 'end_time') {
      const start = name === 'start_time' ? value : form.start_time
      const end = name === 'end_time' ? value : form.end_time
      updated.total_time_mins = calcMins(start, end)
    }

    setForm(updated)
  }

  const mins = Number(form.total_time_mins) || 0
  const rate = Number(form.hourly_rate) || 0
  const charge = mins && rate ? ((rate * mins) / 60).toFixed(2) : '0.00'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setLoading(false); return }

    const { error } = await supabase.from('sessions').insert({
      user_id: user.id,
      client_id: form.client_id,
      date: form.date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      total_time_mins: Number(form.total_time_mins),
      hourly_rate: Number(form.hourly_rate),
      notes: form.notes || null,
      is_invoiced: false,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/sessions')
      router.refresh()
    }
  }

  const input = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const label = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px',
  }

  return (
    <div style={{ maxWidth: '560px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '4px' }}>Log session</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Record a new consulting session</p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#dc2626', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div>
          <label style={label}>Client *</label>
          <select name="client_id" value={form.client_id} onChange={handleChange} required style={input}>
            <option value="">Select a client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={label}>Date *</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} required style={input}/>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={label}>Start time</label>
            <input type="time" name="start_time" value={form.start_time} onChange={handleChange} style={input}/>
          </div>
          <div>
            <label style={label}>End time</label>
            <input type="time" name="end_time" value={form.end_time} onChange={handleChange} style={input}/>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={label}>Duration (mins) *</label>
            <input type="number" name="total_time_mins" value={form.total_time_mins}
              onChange={handleChange} required min="1" placeholder="60" style={input}/>
          </div>
          <div>
            <label style={label}>Hourly rate ($)</label>
            <input type="number" name="hourly_rate" value={form.hourly_rate}
              onChange={handleChange} step="0.01" placeholder="150" style={input}/>
          </div>
          <div>
            <label style={label}>Charge</label>
            <div style={{ ...input, background: '#f9fafb', color: '#1e40af', fontWeight: 600 }}>
              ${charge}
            </div>
          </div>
        </div>

        <div>
          <label style={label}>Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="What did you work on?" rows={3}
            style={{ ...input, resize: 'none' as const }}/>
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
          <button type="submit" disabled={loading} style={{
            flex: 1, padding: '11px', background: '#1e40af', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
          }}>
            {loading ? 'Saving...' : 'Log session'}
          </button>
          <button type="button" onClick={() => router.back()} style={{
            padding: '11px 20px', background: 'white', color: '#6b7280',
            border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px',
            cursor: 'pointer'
          }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}