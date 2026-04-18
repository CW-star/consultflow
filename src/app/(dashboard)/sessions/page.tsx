'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: sess }, { data: cl }] = await Promise.all([
        supabase.from('sessions').select('*, clients(name)').order('date', { ascending: false }),
        supabase.from('clients').select('id, name').order('name'),
      ])
      setSessions(sess ?? [])
      setClients(cl ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = sessions.filter(s => {
    const clientName = s.clients?.name?.toLowerCase() ?? ''
    const notes = s.notes?.toLowerCase() ?? ''
    const matchSearch = !search || clientName.includes(search.toLowerCase()) || notes.includes(search.toLowerCase())
    const matchClient = !filterClient || s.client_id === filterClient
    const matchStatus = !filterStatus ||
      (filterStatus === 'invoiced' && s.is_invoiced) ||
      (filterStatus === 'unbilled' && !s.is_invoiced)
    return matchSearch && matchClient && matchStatus
  })

  const totalValue = filtered.reduce((sum, s) => sum + (Number(s.charge) || 0), 0)
  const unbilledValue = filtered.filter(s => !s.is_invoiced).reduce((sum, s) => sum + (Number(s.charge) || 0), 0)

  const inputStyle = {
    padding: '8px 12px', border: '1px solid #e5e7eb',
    borderRadius: '8px', fontSize: '14px', outline: 'none',
    background: 'white',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600 }}>Sessions</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
            {filtered.length} sessions · ${totalValue.toFixed(2)} billed · ${unbilledValue.toFixed(2)} unbilled
          </p>
        </div>
        <a href="/sessions/new" style={{
          background: '#1e40af', color: 'white', padding: '10px 20px',
          borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
        }}>
          + Log session
        </a>
      </div>

      {/* Search & filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by client or notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '200px' }}
        />
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={inputStyle}>
          <option value="">All clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
          <option value="">All status</option>
          <option value="invoiced">Invoiced</option>
          <option value="unbilled">Unbilled</option>
        </select>
        {(search || filterClient || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterClient(''); setFilterStatus('') }} style={{
            padding: '8px 16px', background: '#f3f4f6', border: '1px solid #e5e7eb',
            borderRadius: '8px', fontSize: '14px', cursor: 'pointer', color: '#6b7280',
          }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total sessions', value: String(filtered.length), color: '#1e40af' },
          { label: 'Invoiced', value: String(filtered.filter(s => s.is_invoiced).length), color: '#16a34a' },
          { label: 'Unbilled', value: String(filtered.filter(s => !s.is_invoiced).length), color: filtered.filter(s => !s.is_invoiced).length > 0 ? '#d97706' : '#6b7280' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 600, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sessions table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Loading sessions...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          No sessions found. {(search || filterClient || filterStatus) && 'Try clearing filters.'}
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                {['Date', 'Client', 'Time', 'Duration', 'Rate', 'Charge', 'Status', 'Notes'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#6b7280', fontWeight: 500, fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{s.date}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{s.clients?.name}</td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px', whiteSpace: 'nowrap' }}>
                    {s.start_time && s.end_time ? `${s.start_time?.slice(0,5)}–${s.end_time?.slice(0,5)}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{s.total_time_mins} min</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>${s.hourly_rate}/hr</td>
                  <td style={{ padding: '12px 16px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {Number(s.charge) === 0 ? 'Free' : `$${Number(s.charge).toFixed(2)}`}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: s.is_invoiced ? '#dcfce7' : '#fef3c7',
                      color: s.is_invoiced ? '#16a34a' : '#92400e',
                      padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 500,
                    }}>
                      {s.is_invoiced ? 'Invoiced' : 'Unbilled'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}