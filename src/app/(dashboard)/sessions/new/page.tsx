'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NewSessionPage() {
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerInterval, setTimerInterval] = useState<any>(null)

  const today = new Date().toISOString().split('T')[0]
  const nowTime = new Date().toTimeString().slice(0, 5)

  const [form, setForm] = useState({
    client_id: '',
    date: today,
    start_time: nowTime,
    end_time: '',
    total_time_mins: '',
    hourly_rate: '',
    notes: '',
    is_invoiced: false,
  })

  useEffect(() => {
    supabase.from('clients').select('id, name, default_hourly_rate').order('name')
      .then(({ data }) => setClients(data ?? []))
  }, [])

  // Auto-fill hourly rate when client selected
  function handleClientChange(clientId: string) {
    const client = clients.find(c => c.id === clientId)
    setForm(f => ({
      ...f,
      client_id: clientId,
      hourly_rate: client?.default_hourly_rate ? String(client.default_hourly_rate) : f.hourly_rate,
    }))
  }

  // Auto-calculate duration from start/end time
  function handleTimeChange(field: 'start_time' | 'end_time', value: string) {
    const updated = { ...form, [field]: value }
    if (updated.start_time && updated.end_time) {
      const [sh, sm] = updated.start_time.split(':').map(Number)
      let [eh, em] = updated.end_time.split(':').map(Number)
      if (eh < sh || (eh === sh && em < sm)) eh += 24 // past midnight
      const mins = (eh * 60 + em) - (sh * 60 + sm)
      if (mins > 0) updated.total_time_mins = String(mins)
    }
    setForm(updated)
  }

  // Live timer
  function startTimer() {
    const now = new Date()
    const timeStr = now.toTimeString().slice(0, 5)
    setForm(f => ({ ...f, start_time: timeStr, date: now.toISOString().split('T')[0] }))
    setTimer(0)
    setTimerRunning(true)
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    setTimerInterval(interval)
  }

  function stopTimer() {
    clearInterval(timerInterval)
    setTimerRunning(false)
    const endTime = new Date().toTimeString().slice(0, 5)
    const mins = Math.round(timer / 60)
    setForm(f => ({ ...f, end_time: endTime, total_time_mins: String(mins) }))
  }

  const charge = form.hourly_rate && form.total_time_mins
    ? (Number(form.hourly_rate) * Number(form.total_time_mins) / 60).toFixed(2)
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id) { setError('Please select a client'); return }
    if (!form.total_time_mins) { setError('Please enter session duration'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: err } = await supabase.from('sessions').insert({
      user_id: user.id,
      client_id: form.client_id,
      date: form.date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      total_time_mins: Number(form.total_time_mins),
      hourly_rate: Number(form.hourly_rate) || 0,
      notes: form.notes || null,
      is_invoiced: form.is_invoiced,
    })

    if (err) { setError(err.message); setLoading(false); return }
    setSaved(true)
    setTimeout(() => router.push('/sessions'), 1200)
  }

  const fmtTimer = (s: number) => `${String(Math.floor(s / 3600)).padStart(2,'0')}:${String(Math.floor((s % 3600) / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    fontSize: '14px', fontFamily: 'var(--font)', color: 'var(--gray-900)',
    background: 'white', outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: 'var(--gray-600)', marginBottom: '6px',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <a href="/sessions" style={{ fontSize: '13px', color: 'var(--gray-400)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
          ← Back to sessions
        </a>
        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.4px' }}>Log Session</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: '14px', margin: 0 }}>Record a consulting session with time and charge calculation</p>
      </div>

      {/* Live timer card */}
      <div style={{ background: timerRunning ? 'linear-gradient(135deg, #1e40af, #7c3aed)' : 'white', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)', transition: 'background 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: timerRunning ? 'rgba(255,255,255,0.7)' : 'var(--gray-400)', margin: '0 0 4px' }}>
              {timerRunning ? '● Live timer running' : 'Quick timer'}
            </p>
            <p style={{ fontSize: '32px', fontWeight: 800, color: timerRunning ? 'white' : 'var(--gray-700)', margin: 0, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              {fmtTimer(timer)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!timerRunning ? (
              <button onClick={startTimer} style={{
                padding: '10px 20px', background: 'var(--primary)', color: 'white',
                border: 'none', borderRadius: 'var(--radius)', fontSize: '13px',
                fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                ▶ Start
              </button>
            ) : (
              <button onClick={stopTimer} style={{
                padding: '10px 20px', background: 'white', color: 'var(--danger)',
                border: 'none', borderRadius: 'var(--radius)', fontSize: '13px',
                fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
              }}>
                ⏹ Stop
              </button>
            )}
          </div>
        </div>
        {timerRunning && (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: '10px 0 0' }}>
            Started at {form.start_time} · Click Stop when session ends
          </p>
        )}
      </div>

      {saved && (
        <div style={{ background: 'var(--success-light)', border: '1px solid #86efac', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)' }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 2px' }}>Session logged successfully!</p>
            <p style={{ fontSize: '12px', margin: 0, opacity: 0.8 }}>Redirecting to sessions...</p>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--danger-light)', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', color: 'var(--danger)', fontSize: '14px', fontWeight: 500 }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', boxShadow: 'var(--shadow-sm)' }}>

        {/* Client */}
        <div>
          <label style={labelStyle}>Client *</label>
          <select value={form.client_id} onChange={e => handleClientChange(e.target.value)}
            style={{ ...inputStyle, appearance: 'none' }} required>
            <option value="">Select a client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.default_hourly_rate ? `· $${c.default_hourly_rate}/hr` : ''}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label style={labelStyle}>Date *</label>
          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
            style={inputStyle} required/>
        </div>

        {/* Time inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Start time</label>
            <input type="time" value={form.start_time}
              onChange={e => handleTimeChange('start_time', e.target.value)}
              style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>End time</label>
            <input type="time" value={form.end_time}
              onChange={e => handleTimeChange('end_time', e.target.value)}
              style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Duration (mins) *</label>
            <input type="number" value={form.total_time_mins}
              onChange={e => setForm({ ...form, total_time_mins: e.target.value })}
              placeholder="e.g. 60" style={inputStyle} required/>
          </div>
        </div>

        {/* Rate + Charge preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Hourly rate ($)</label>
            <input type="number" value={form.hourly_rate}
              onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
              placeholder="e.g. 150" step="0.01" style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Calculated charge</label>
            <div style={{ ...inputStyle, background: charge ? 'var(--success-light)' : 'var(--gray-50)', color: charge ? 'var(--success)' : 'var(--gray-400)', fontWeight: charge ? 700 : 400, fontSize: charge ? '18px' : '14px', display: 'flex', alignItems: 'center' }}>
              {charge ? `$${charge}` : 'Auto-calculated'}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Session notes</label>
          <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="What was discussed? Any key outcomes or follow-ups..."
            rows={3} style={{ ...inputStyle, resize: 'none' }}/>
        </div>

        {/* Mark as invoiced */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
          <input type="checkbox" id="invoiced" checked={form.is_invoiced}
            onChange={e => setForm({ ...form, is_invoiced: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}/>
          <label htmlFor="invoiced" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)', cursor: 'pointer' }}>
            Mark as already invoiced
          </label>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
          <button type="submit" disabled={loading || saved} style={{
            flex: 1, padding: '12px', background: saved ? 'var(--success)' : 'var(--primary)',
            color: 'white', border: 'none', borderRadius: 'var(--radius)',
            fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, fontFamily: 'var(--font)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}>
            {saved ? '✓ Saved!' : loading ? 'Saving...' : '+ Log session'}
          </button>
          <button type="button" onClick={() => router.back()} style={{
            padding: '12px 20px', background: 'white', color: 'var(--gray-600)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600,
          }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}