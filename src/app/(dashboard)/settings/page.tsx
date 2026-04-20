'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('company')
  const [form, setForm] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    payment_terms: 'Payment due within 14 days of invoice date.',
    monthly_target: '2000',
    automation_enabled: true,
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('settings').select('*').eq('user_id', user.id).single()
      if (data) {
        setForm({
          company_name: data.company_name || '',
          company_email: data.company_email || '',
          company_phone: data.company_phone || '',
          company_address: data.company_address || '',
          payment_terms: data.payment_terms || 'Payment due within 14 days of invoice date.',
          monthly_target: String(data.monthly_target || 2000),
          automation_enabled: data.automation_enabled ?? true,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('settings').upsert({
      user_id: user.id,
      company_name: form.company_name,
      company_email: form.company_email,
      company_phone: form.company_phone,
      company_address: form.company_address,
      payment_terms: form.payment_terms,
      monthly_target: Number(form.monthly_target),
      automation_enabled: form.automation_enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px',
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'var(--font)', color: 'var(--gray-900)', background: 'white',
  }

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 700 as const,
    color: 'var(--gray-600)', marginBottom: '6px',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  }

  const tabs = [
    { key: 'company', label: '🏢 Company' },
    { key: 'billing', label: '💳 Billing & Targets' },
    { key: 'automation', label: '⚡ Automation' },
    { key: 'account', label: '👤 Account' },
  ]

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '14px' }}>
      Loading settings...
    </div>
  )

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.4px' }}>Settings</h1>
        <p style={{ color: 'var(--gray-400)', fontSize: '14px', margin: 0 }}>Manage your practice configuration</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--gray-100)', borderRadius: '12px', padding: '4px' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: '8px 10px', border: 'none', borderRadius: '9px',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)',
            background: activeTab === tab.key ? 'white' : 'transparent',
            color: activeTab === tab.key ? 'var(--gray-900)' : 'var(--gray-500)',
            boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
            transition: 'all 0.15s',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>

        {/* ── Company tab ── */}
        {activeTab === 'company' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Company information</h2>
              <p style={{ fontSize: '13px', color: 'var(--gray-400)', margin: 0 }}>This appears on your invoices and PDF reports</p>
            </div>
            <div>
              <label style={labelStyle}>Company name *</label>
              <input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })}
                placeholder="Ada Analytics Consulting" style={inputStyle}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={form.company_email} onChange={e => setForm({ ...form, company_email: e.target.value })}
                  placeholder="hello@company.com" style={inputStyle}/>
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={form.company_phone} onChange={e => setForm({ ...form, company_phone: e.target.value })}
                  placeholder="+1 (555) 000-0000" style={inputStyle}/>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Address</label>
              <textarea value={form.company_address} onChange={e => setForm({ ...form, company_address: e.target.value })}
                placeholder="123 Main St, Toronto, ON M5V 1A1" rows={3}
                style={{ ...inputStyle, resize: 'none' }}/>
            </div>
            <div>
              <label style={labelStyle}>Payment terms (appears on invoices)</label>
              <textarea value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })}
                rows={3} style={{ ...inputStyle, resize: 'none' }}/>
            </div>
          </div>
        )}

        {/* ── Billing tab ── */}
        {activeTab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Billing & targets</h2>
              <p style={{ fontSize: '13px', color: 'var(--gray-400)', margin: 0 }}>Set your revenue goals and billing defaults</p>
            </div>
            <div>
              <label style={labelStyle}>Monthly revenue target ($)</label>
              <input type="number" value={form.monthly_target}
                onChange={e => setForm({ ...form, monthly_target: e.target.value })}
                placeholder="2000" style={inputStyle}/>
              <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginTop: '4px' }}>
                Used for dashboard progress tracking and AI forecasting
              </p>
            </div>

            {/* Stripe status */}
            <div style={{ background: 'var(--success-light)', borderRadius: '12px', padding: '18px', border: '1px solid #86efac' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '22px' }}>✅</span>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success)', margin: '0 0 2px' }}>Stripe connected</p>
                  <p style={{ fontSize: '12px', color: 'var(--success)', opacity: 0.8, margin: 0 }}>Test mode · Ready to accept payments</p>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--gray-600)', margin: '0 0 12px' }}>
                Clients can pay invoices directly by card, Apple Pay, or Google Pay. Look for the purple "Pay with Stripe" button on any unpaid invoice.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['💳 Credit & Debit Card', '🍎 Apple Pay', 'G Google Pay'].map(m => (
                  <span key={m} style={{
                    padding: '4px 12px', background: 'white',
                    borderRadius: 'var(--radius-full)', fontSize: '12px',
                    fontWeight: 600, color: 'var(--gray-600)',
                    border: '1px solid var(--border)',
                  }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Payment methods info */}
            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-700)', margin: '0 0 10px' }}>All accepted payment methods</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { icon: '💳', name: 'Stripe', desc: 'Card, Apple Pay, Google Pay — online payments', status: 'Active', color: 'var(--success)' },
                  { icon: '🏦', name: 'E-Transfer', desc: 'Interac e-Transfer (record manually)', status: 'Manual', color: 'var(--primary)' },
                  { icon: '🏛', name: 'Bank Transfer', desc: 'Wire transfer / EFT (record manually)', status: 'Manual', color: 'var(--primary)' },
                  { icon: '🅿', name: 'PayPal', desc: 'PayPal balance or linked card (record manually)', status: 'Manual', color: 'var(--primary)' },
                  { icon: '💵', name: 'Cash / Cheque', desc: 'In-person payment (record manually)', status: 'Manual', color: 'var(--gray-400)' },
                ].map(m => (
                  <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{m.icon}</span>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 1px', color: 'var(--gray-900)' }}>{m.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--gray-400)', margin: 0 }}>{m.desc}</p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      padding: '3px 10px', borderRadius: 'var(--radius-full)',
                      background: m.status === 'Active' ? 'var(--success-light)' : 'var(--gray-100)',
                      color: m.status === 'Active' ? 'var(--success)' : 'var(--gray-500)',
                    }}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Automation tab ── */}
        {activeTab === 'automation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Automation settings</h2>
              <p style={{ fontSize: '13px', color: 'var(--gray-400)', margin: 0 }}>Control automated workflows for your practice</p>
            </div>

            {/* Master toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: form.automation_enabled ? 'var(--success-light)' : 'var(--gray-50)', borderRadius: '12px', border: `1px solid ${form.automation_enabled ? '#86efac' : 'var(--border)'}`, transition: 'all 0.2s' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 2px' }}>Master automation switch</p>
                <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>
                  {form.automation_enabled ? '✅ All workflows are active' : '⏸ All workflows are paused'}
                </p>
              </div>
              <button onClick={() => setForm({ ...form, automation_enabled: !form.automation_enabled })} style={{
                width: '50px', height: '28px', borderRadius: 'var(--radius-full)',
                border: 'none', cursor: 'pointer',
                background: form.automation_enabled ? 'var(--success)' : 'var(--gray-300)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
              }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', background: 'white',
                  position: 'absolute', top: '3px', transition: 'left 0.2s',
                  left: form.automation_enabled ? '25px' : '3px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                }}/>
              </button>
            </div>

            {/* Workflow list */}
            {[
              { label: 'Invoice reminders', desc: 'Auto reminders at 3, 7, 14 and 30 days after due date', icon: '🔔', active: true },
              { label: 'Overdue detection', desc: 'Automatically mark invoices overdue after due date passes', icon: '⚠️', active: true },
              { label: 'Re-engagement emails', desc: 'Alert when a client is inactive for 60+ days', icon: '💬', active: true },
              { label: 'Daily invoice send', desc: 'Auto-send new invoices at 8am on business days', icon: '📧', active: false },
              { label: 'Stripe auto-billing', desc: 'Charge saved cards automatically on due date', icon: '💳', active: false },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', border: '1px solid var(--border)', borderRadius: '12px',
                opacity: form.automation_enabled ? 1 : 0.5, transition: 'opacity 0.2s',
              }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px', color: 'var(--gray-900)' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                  borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap',
                  background: !form.automation_enabled ? 'var(--gray-100)' :
                    item.active ? 'var(--success-light)' : 'var(--gray-100)',
                  color: !form.automation_enabled ? 'var(--gray-400)' :
                    item.active ? 'var(--success)' : 'var(--gray-400)',
                }}>
                  {!form.automation_enabled ? 'Paused' : item.active ? '● Active' : 'Coming soon'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Account tab ── */}
        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Account settings</h2>
              <p style={{ fontSize: '13px', color: 'var(--gray-400)', margin: 0 }}>Manage your login and security</p>
            </div>

            {/* Profile card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: 'var(--primary-light)', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontSize: '16px', fontWeight: 800 }}>CW</span>
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 2px', color: 'var(--gray-900)' }}>Cynthia W.</p>
                <p style={{ fontSize: '13px', color: 'var(--primary)', margin: 0, fontWeight: 500 }}>Consultant · Ada Analytics Consulting</p>
              </div>
            </div>

            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: 'var(--gray-700)' }}>Change email</p>
              <input type="email" placeholder="New email address" style={{ ...inputStyle, marginBottom: '8px' }}/>
              <button style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font)' }}>
                Update email
              </button>
            </div>

            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: 'var(--gray-700)' }}>Change password</p>
              <input type="password" placeholder="New password" style={{ ...inputStyle, marginBottom: '8px' }}/>
              <button style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font)' }}>
                Update password
              </button>
            </div>

            <div style={{ background: 'var(--danger-light)', borderRadius: '12px', padding: '16px', border: '1px solid #fca5a5' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)', margin: '0 0 4px' }}>⚠ Danger zone</p>
              <p style={{ fontSize: '12px', color: 'var(--danger)', margin: '0 0 12px', opacity: 0.8 }}>These actions cannot be undone</p>
              <button style={{ padding: '8px 18px', background: 'white', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font)' }}>
                Delete account
              </button>
            </div>
          </div>
        )}

        {/* Save button */}
        {activeTab !== 'account' && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 24px', background: 'var(--primary)', color: 'white',
              border: 'none', borderRadius: 'var(--radius)', fontSize: '14px',
              fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1, fontFamily: 'var(--font)',
            }}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            {saved && (
              <span style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                ✅ Settings saved!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}