'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const METHOD_CONFIG = {
  bank_account: { icon: '🏦', label: 'Bank Account', color: 'var(--primary)', bg: 'var(--primary-light)', fields: ['bank_name', 'account_holder', 'account_number_last4', 'routing_number'] },
  e_transfer:   { icon: '📱', label: 'E-Transfer', color: 'var(--success)', bg: 'var(--success-light)', fields: ['email', 'account_holder'] },
  credit_card:  { icon: '💳', label: 'Credit/Debit Card', color: '#6772e5', bg: '#ede9fe', fields: ['account_holder', 'account_number_last4'] },
  apple_pay:    { icon: '🍎', label: 'Apple Pay', color: '#111827', bg: '#f3f4f6', fields: ['email'] },
  google_pay:   { icon: '🔵', label: 'Google Pay', color: '#1a73e8', bg: '#dbeafe', fields: ['email'] },
  paypal:       { icon: '🅿', label: 'PayPal', color: '#003087', bg: '#dbeafe', fields: ['email'] },
  cheque:       { icon: '📄', label: 'Cheque', color: 'var(--warning)', bg: 'var(--warning-light)', fields: ['account_holder', 'bank_name'] },
  stripe:       { icon: '⚡', label: 'Stripe', color: '#6772e5', bg: '#ede9fe', fields: ['email'] },
}

export default function PaymentMethods({ clientId, userId }: { clientId: string; userId: string }) {
  const [methods, setMethods] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    label: '', bank_name: '', account_holder: '',
    account_number_last4: '', routing_number: '', email: '', notes: '',
  })

  useEffect(() => { loadMethods() }, [])

  async function loadMethods() {
    const { data } = await supabase
      .from('client_payment_methods')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    setMethods(data ?? [])
    setLoading(false)
  }

  async function handleSave() {
    if (!selectedType) return
    setSaving(true)
    await supabase.from('client_payment_methods').insert({
      user_id: userId,
      client_id: clientId,
      type: selectedType,
      label: form.label || METHOD_CONFIG[selectedType as keyof typeof METHOD_CONFIG]?.label,
      bank_name: form.bank_name || null,
      account_holder: form.account_holder || null,
      account_number_last4: form.account_number_last4 || null,
      routing_number: form.routing_number || null,
      email: form.email || null,
      notes: form.notes || null,
    })
    await loadMethods()
    setShowAdd(false)
    setSelectedType(null)
    setForm({ label: '', bank_name: '', account_holder: '', account_number_last4: '', routing_number: '', email: '', notes: '' })
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this payment method?')) return
    await supabase.from('client_payment_methods').delete().eq('id', id)
    await loadMethods()
  }

  async function setDefault(id: string) {
    await supabase.from('client_payment_methods').update({ is_default: false }).eq('client_id', clientId)
    await supabase.from('client_payment_methods').update({ is_default: true }).eq('id', id)
    await loadMethods()
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    fontSize: '13px', fontFamily: 'var(--font)', color: 'var(--gray-900)',
    background: 'white', outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 700 as const,
    color: 'var(--gray-500)', marginBottom: '5px',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  }

  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 2px', color: 'var(--gray-900)' }}>Payment methods</h3>
          <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>Saved payment details for this client</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{
          padding: '7px 14px', background: 'var(--primary)', color: 'white',
          border: 'none', borderRadius: 'var(--radius)', fontSize: '12px',
          fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
        }}>
          + Add method
        </button>
      </div>

      {/* Add payment method panel */}
      {showAdd && (
        <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '18px', marginBottom: '16px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-700)', margin: '0 0 12px' }}>Choose payment type</p>

          {/* Type selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '16px' }}>
            {Object.entries(METHOD_CONFIG).map(([type, config]) => (
              <button key={type} onClick={() => setSelectedType(selectedType === type ? null : type)} style={{
                padding: '10px 8px', border: '2px solid',
                borderColor: selectedType === type ? config.color : 'var(--border)',
                borderRadius: '10px', background: selectedType === type ? config.bg : 'white',
                cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              }}>
                <span style={{ fontSize: '20px' }}>{config.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: 700, color: selectedType === type ? config.color : 'var(--gray-500)', textAlign: 'center', lineHeight: 1.2 }}>{config.label}</span>
              </button>
            ))}
          </div>

          {/* Fields for selected type */}
          {selectedType && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'white', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '20px' }}>{METHOD_CONFIG[selectedType as keyof typeof METHOD_CONFIG].icon}</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: METHOD_CONFIG[selectedType as keyof typeof METHOD_CONFIG].color, margin: 0 }}>
                  {METHOD_CONFIG[selectedType as keyof typeof METHOD_CONFIG].label}
                </p>
              </div>

              <div>
                <label style={labelStyle}>Label (optional)</label>
                <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                  placeholder={`e.g. ${METHOD_CONFIG[selectedType as keyof typeof METHOD_CONFIG].label}`}
                  style={inputStyle}/>
              </div>

              {/* Bank account fields */}
              {selectedType === 'bank_account' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Bank name</label>
                      <input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })}
                        placeholder="e.g. TD Bank" style={inputStyle}/>
                    </div>
                    <div>
                      <label style={labelStyle}>Account holder</label>
                      <input value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })}
                        placeholder="Full name" style={inputStyle}/>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>Last 4 digits</label>
                      <input value={form.account_number_last4} onChange={e => setForm({ ...form, account_number_last4: e.target.value.slice(-4) })}
                        placeholder="••••" maxLength={4} style={inputStyle}/>
                    </div>
                    <div>
                      <label style={labelStyle}>Transit / Routing #</label>
                      <input value={form.routing_number} onChange={e => setForm({ ...form, routing_number: e.target.value })}
                        placeholder="e.g. 00400" style={inputStyle}/>
                    </div>
                  </div>
                </>
              )}

              {/* Cheque fields */}
              {selectedType === 'cheque' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Account holder</label>
                    <input value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })}
                      placeholder="Name on cheque" style={inputStyle}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Bank name</label>
                    <input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })}
                      placeholder="e.g. RBC" style={inputStyle}/>
                  </div>
                </div>
              )}

              {/* Card fields */}
              {selectedType === 'credit_card' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Cardholder name</label>
                    <input value={form.account_holder} onChange={e => setForm({ ...form, account_holder: e.target.value })}
                      placeholder="Full name" style={inputStyle}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Last 4 digits</label>
                    <input value={form.account_number_last4} onChange={e => setForm({ ...form, account_number_last4: e.target.value.slice(-4) })}
                      placeholder="••••" maxLength={4} style={inputStyle}/>
                  </div>
                </div>
              )}

              {/* Email-based methods */}
              {['e_transfer', 'apple_pay', 'google_pay', 'paypal', 'stripe'].includes(selectedType) && (
                <div>
                  <label style={labelStyle}>Email / account</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="client@email.com" style={inputStyle}/>
                </div>
              )}

              {/* Cheque scan tip */}
              {selectedType === 'cheque' && (
                <div style={{ background: 'var(--warning-light)', borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '8px' }}>
                  <span>💡</span>
                  <p style={{ fontSize: '12px', color: 'var(--warning)', margin: 0, lineHeight: 1.5 }}>
                    Tip: The routing number and account number are printed at the bottom of a cheque. The transit number is the first 5 digits, institution number is next 3, and account number follows.
                  </p>
                </div>
              )}

              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional notes..." style={inputStyle}/>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 1, padding: '10px', background: METHOD_CONFIG[selectedType as keyof typeof METHOD_CONFIG].color,
                  color: 'white', border: 'none', borderRadius: 'var(--radius)',
                  fontSize: '13px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font)', opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'Saving...' : `Save ${METHOD_CONFIG[selectedType as keyof typeof METHOD_CONFIG].label}`}
                </button>
                <button onClick={() => { setSelectedType(null); setShowAdd(false) }} style={{
                  padding: '10px 16px', background: 'white', color: 'var(--gray-500)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600,
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved methods list */}
      {loading ? (
        <p style={{ fontSize: '13px', color: 'var(--gray-400)', textAlign: 'center', padding: '20px' }}>Loading...</p>
      ) : methods.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 20px', background: 'var(--gray-50)', borderRadius: '10px' }}>
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>💳</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-600)', margin: '0 0 4px' }}>No payment methods saved</p>
          <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>Add a bank account, card, or e-Transfer details for this client</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {methods.map(m => {
            const config = METHOD_CONFIG[m.type as keyof typeof METHOD_CONFIG] ?? { icon: '💰', label: m.type, color: 'var(--gray-500)', bg: 'var(--gray-50)' }
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: m.is_default ? config.bg : 'var(--gray-50)', borderRadius: '10px', border: `1px solid ${m.is_default ? config.color + '40' : 'var(--border)'}` }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, border: `1px solid ${config.color}30` }}>
                  {config.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>{m.label || config.label}</p>
                    {m.is_default && <span style={{ fontSize: '10px', background: config.color, color: 'white', padding: '1px 7px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>Default</span>}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>
                    {m.bank_name && `${m.bank_name} · `}
                    {m.account_holder && `${m.account_holder} · `}
                    {m.account_number_last4 && `••••${m.account_number_last4} · `}
                    {m.email && `${m.email} · `}
                    {m.routing_number && `Transit: ${m.routing_number}`}
                    {m.notes && m.notes}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {!m.is_default && (
                    <button onClick={() => setDefault(m.id)} style={{ padding: '4px 10px', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600, color: 'var(--gray-500)' }}>
                      Set default
                    </button>
                  )}
                  <button onClick={() => handleDelete(m.id)} style={{ padding: '4px 10px', background: 'var(--danger-light)', border: 'none', borderRadius: 'var(--radius)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600, color: 'var(--danger)' }}>
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}