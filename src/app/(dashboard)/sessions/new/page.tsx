import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export default async function NewSessionPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, default_hourly_rate')
    .order('name')

  async function createSession(formData: FormData) {
    'use server'

    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const clientId = formData.get('client_id') as string
    const date = formData.get('date') as string
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string
    const notes = formData.get('notes') as string

    const { data: client } = await supabaseServer
      .from('clients')
      .select('default_hourly_rate')
      .eq('id', clientId)
      .single()

    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const totalTimeMins = (endH * 60 + endM) - (startH * 60 + startM)
    const hourlyRate = client?.default_hourly_rate ?? 0
    const charge = (totalTimeMins / 60) * hourlyRate

    await supabaseServer.from('sessions').insert({
      client_id: clientId,
      date,
      start_time: startTime,
      end_time: endTime,
      total_time_mins: totalTimeMins,
      hourly_rate: hourlyRate,
      charge,
      is_invoiced: false,
      notes: notes || null,
    })

    redirect('/sessions')
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px',
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Log Session</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
          Record a new consulting session
        </p>
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <form action={createSession}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={labelStyle} htmlFor="client_id">Client</label>
              <select id="client_id" name="client_id" required style={inputStyle}>
                <option value="">Select a client</option>
                {clients?.map((c: { id: string; name: string; default_hourly_rate: number }) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle} htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle} htmlFor="start_time">Start time</label>
                <input id="start_time" name="start_time" type="time" required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle} htmlFor="end_time">End time</label>
                <input id="end_time" name="end_time" type="time" required style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle} htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Optional session notes..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <a
                href="/sessions"
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  textDecoration: 'none',
                }}
              >
                Cancel
              </a>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: '#1e40af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Log session
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
