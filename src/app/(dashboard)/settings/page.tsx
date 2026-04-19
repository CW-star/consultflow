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

      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

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
    border: '1px solid #e5e7eb', borderRadius: '8px',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontSize: '13px',
    fontWeight: 500 as const, color: '#374151', marginBottom: '6px',
  }

  const tabs = [
    { key: 'company', label: '🏢 Company' },
    { key: 'billing', label: '💳 Billing & Targets' },
    { key: 'automation', label: '⚡ Automation' },
    { key: 'account', label: '👤 Account' },
  ]

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading settings...</div>

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>Manage your practice configuration</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: '8px 12px', border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            background: activeTab === tab.key ? 'white' : 'transparent',
            color: activeTab === tab.key ? '#111827' : '#6b7280',
            boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>

        {/* Company tab */}
        {activeTab === 'company' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Company information</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>This appears on your invoices and reports</p>
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

        {/* Billing tab */}
        {activeTab === 'billing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Billing & targets</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Set your revenue goals and billing defaults</p>
            <div>
              <label style={labelStyle}>Monthly revenue target ($)</label>
              <input type="number" value={form.monthly_target} onChange={e => setForm({ ...form, monthly_target: e.target.value })}
                placeholder="2000" style={inputStyle}/>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Used for dashboard progress tracking and forecasting</p>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Stripe integration</p>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>Connect Stripe to accept online payments directly from invoices</p>
              <button style={{ padding: '10px 20px', background: '#635bff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Connect Stripe →
              </button>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px' }}>Coming in next update</p>
            </div>
          </div>
        )}

        {/* Automation tab */}
        {activeTab === 'automation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Automation settings</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Control automated workflows for your practice</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#f9fafb', borderRadius: '10px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '2px' }}>Master automation switch</p>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Enable or disable all automated workflows</p>
              </div>
              <button onClick={() => setForm({ ...form, automation_enabled: !form.automation_enabled })} style={{
                width: '48px', height: '26px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                background: form.automation_enabled ? '#16a34a' : '#d1d5db', position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                  position: 'absolute', top: '3px', transition: 'left 0.2s',
                  left: form.automation_enabled ? '25px' : '3px',
                }}/>
              </button>
            </div>

            {[
              { label: 'Invoice reminders', desc: 'Send automatic payment reminders at 3, 7, 14 and 30 days', icon: '🔔' },
              { label: 'Overdue detection', desc: 'Automatically mark invoices as overdue after due date', icon: '⚠️' },
              { label: 'Re-engagement emails', desc: 'Alert when a client has been inactive for 60+ days', icon: '💬' },
              { label: 'Daily invoice send', desc: 'Auto-send new invoices at 8am on business days', icon: '📧' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1px solid #e5e7eb', borderRadius: '10px', opacity: form.automation_enabled ? 1 : 0.5 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>{item.label}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
                <span style={{ fontSize: '12px', background: form.automation_enabled ? '#dcfce7' : '#f3f4f6', color: form.automation_enabled ? '#16a34a' : '#6b7280', padding: '3px 10px', borderRadius: '999px', fontWeight: 600 }}>
                  {form.automation_enabled ? 'Active' : 'Paused'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Account tab */}
        {activeTab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>Account settings</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Manage your login and security</p>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 8px' }}>Change email</p>
              <input type="email" placeholder="New email address" style={{ ...inputStyle, marginBottom: '8px' }}/>
              <button style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                Update email
              </button>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 8px' }}>Change password</p>
              <input type="password" placeholder="New password" style={{ ...inputStyle, marginBottom: '8px' }}/>
              <button style={{ padding: '8px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                Update password
              </button>
            </div>
            <div style={{ background: '#fee2e2', borderRadius: '10px', padding: '16px', marginTop: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626', margin: '0 0 4px' }}>Danger zone</p>
              <p style={{ fontSize: '12px', color: '#dc2626', margin: '0 0 12px' }}>These actions cannot be undone</p>
              <button style={{ padding: '8px 16px', background: 'white', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                Delete account
              </button>
            </div>
          </div>
        )}

        {/* Save button */}
        {activeTab !== 'account' && (
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '10px 24px', background: '#1e40af', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '14px',
              fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            {saved && <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 500 }}>✓ Settings saved!</span>}
          </div>
        )}
      </div>
    </div>
  )
}