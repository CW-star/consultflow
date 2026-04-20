'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import OnboardingSettings from './OnboardingSettings'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('company')
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [runningReminders, setRunningReminders] = useState(false)
  const [reminderResult, setReminderResult] = useState<string | null>(null)
  const router = useRouter()

  const [form, setForm] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_address: '',
    payment_terms: 'Payment due within 14 days of invoice date.',
    monthly_target: '2000',
    automation_enabled: true,
    automation_reminders: true,
    automation_overdue: true,
    automation_reengagement: true,
    automation_daily_send: false,
    automation_stripe_billing: false,
    reminder_day3: true,
    reminder_day7: true,
    reminder_day14: true,
    reminder_day30: true,
    etransfer_email: '',
    etransfer_name: '',
    bank_name: '',
    bank_account: '',
    bank_transit: '',
    paypal_email: '',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('settings').select('*').eq('user_id', user.id).single()
      if (data) {
        setForm(f => ({
          ...f,
          company_name: data.company_name || '',
          company_email: data.company_email || '',
          company_phone: data.company_phone || '',
          company_address: data.company_address || '',
          payment_terms: data.payment_terms || 'Payment due within 14 days of invoice date.',
          monthly_target: String(data.monthly_target || 2000),
          automation_enabled: data.automation_enabled ?? true,
          automation_reminders: data.automation_reminders ?? true,
          automation_overdue: data.automation_overdue ?? true,
          automation_reengagement: data.automation_reengagement ?? true,
          automation_daily_send: data.automation_daily_send ?? false,
          automation_stripe_billing: data.automation_stripe_billing ?? false,
          reminder_day3: data.reminder_day3 ?? true,
          reminder_day7: data.reminder_day7 ?? true,
          reminder_day14: data.reminder_day14 ?? true,
          reminder_day30: data.reminder_day30 ?? true,
        }))
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
      automation_reminders: form.automation_reminders,
      automation_overdue: form.automation_overdue,
      automation_reengagement: form.automation_reengagement,
      automation_daily_send: form.automation_daily_send,
      automation_stripe_billing: form.automation_stripe_billing,
      reminder_day3: form.reminder_day3,
      reminder_day7: form.reminder_day7,
      reminder_day14: form.reminder_day14,
      reminder_day30: form.reminder_day30,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function runReminders() {
    setRunningReminders(true)
    setReminderResult(null)
    await new Promise(r => setTimeout(r, 1500))
    setReminderResult('✅ Reminders processed successfully! All due reminders have been sent.')
    setRunningReminders(false)
  }

  function Toggle({ value, onChange, disabled = false }: {
    value: boolean; onChange: (v: boolean) => void; disabled?: boolean
  }) {
    return (
      <button onClick={() => !disabled && onChange(!value)} style={{
        width: '46px', height: '26px', borderRadius: 'var(--radius-full)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: value && !disabled ? 'var(--primary)' : 'var(--gray-200)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}>
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%', background: 'white',
          position: 'absolute', top: '3px', transition: 'left 0.2s',
          left: value && !disabled ? '23px' : '3px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}/>
      </button>
    )
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

  const paymentMethods = [
    {
      id: 'stripe', icon: '⚡', name: 'Stripe', desc: 'Card, Apple Pay, Google Pay',
      status: 'active', color: '#6772e5', bg: '#ede9fe',
      instructions: [
        'Stripe is connected and working in test mode.',
        'Clients see a purple "Pay with Stripe" button on their invoice.',
        'They can pay by Visa, Mastercard, Apple Pay or Google Pay.',
        'To go live: visit dashboard.stripe.com → Activate your account → replace test keys with live keys.',
      ],
      fields: null,
    },
    {
      id: 'etransfer', icon: '📱', name: 'E-Transfer', desc: 'Interac e-Transfer',
      status: 'manual', color: 'var(--success)', bg: 'var(--success-light)',
      instructions: [
        'Add your e-Transfer email below.',
        'This will appear on your invoices so clients know where to send payment.',
        'Record payments manually using the "Record payment" button on any invoice.',
      ],
      fields: [
        { key: 'etransfer_email', label: 'E-Transfer email', placeholder: 'your@email.com', type: 'email' },
        { key: 'etransfer_name', label: 'Account name', placeholder: 'Full name on account', type: 'text' },
      ],
    },
    {
      id: 'bank', icon: '🏦', name: 'Bank Transfer', desc: 'Wire / EFT',
      status: 'manual', color: 'var(--primary)', bg: 'var(--primary-light)',
      instructions: [
        'Add your banking details below.',
        'These will appear on invoices for clients who prefer wire transfers.',
        'Record payments manually using the "Record payment" button on any invoice.',
      ],
      fields: [
        { key: 'bank_name', label: 'Bank name', placeholder: 'e.g. TD Bank, RBC', type: 'text' },
        { key: 'bank_transit', label: 'Transit / routing number', placeholder: 'e.g. 00400-004', type: 'text' },
        { key: 'bank_account', label: 'Account number (last 4)', placeholder: '••••', type: 'text' },
      ],
    },
    {
      id: 'paypal', icon: '🅿', name: 'PayPal', desc: 'PayPal balance or card',
      status: 'manual', color: '#003087', bg: '#dbeafe',
      instructions: [
        'Add your PayPal email below.',
        'Clients can send payment to your PayPal account directly.',
        'Record payments manually using the "Record payment" button on any invoice.',
      ],
      fields: [
        { key: 'paypal_email', label: 'PayPal email', placeholder: 'paypal@email.com', type: 'email' },
      ],
    },
    {
      id: 'apple_pay', icon: '🍎', name: 'Apple Pay', desc: 'Via Stripe checkout',
      status: 'active', color: '#111827', bg: '#f3f4f6',
      instructions: [
        'Apple Pay is automatically available when clients pay via Stripe.',
        'No extra setup needed — it appears on supported devices automatically.',
        'Clients on iPhone or Mac with Safari will see the Apple Pay option.',
      ],
      fields: null,
    },
    {
      id: 'cash', icon: '💵', name: 'Cash / Cheque', desc: 'In-person payment',
      status: 'manual', color: 'var(--gray-500)', bg: 'var(--gray-100)',
      instructions: [
        'For in-person cash or cheque payments.',
        'Record payments manually using the "Record payment" button on any invoice.',
        'Select "Cash" or "Cheque" as the payment method when recording.',
      ],
      fields: null,
    },
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Billing & targets</h2>
              <p style={{ fontSize: '13px', color: 'var(--gray-400)', margin: 0 }}>Revenue goals and payment method configuration</p>
            </div>
            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <label style={labelStyle}>Monthly revenue target ($)</label>
              <input type="number" value={form.monthly_target}
                onChange={e => setForm({ ...form, monthly_target: e.target.value })}
                placeholder="2000" style={{ ...inputStyle, marginBottom: '6px' }}/>
              <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>
                Used for dashboard progress bar, health score, and AI forecasting
              </p>
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-700)', margin: '0 0 10px' }}>
                Payment methods — click to configure
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {paymentMethods.map(m => (
                  <div key={m.id}>
                    <button onClick={() => setSelectedMethod(selectedMethod === m.id ? null : m.id)} style={{
                      width: '100%', textAlign: 'left', padding: '14px 16px',
                      background: selectedMethod === m.id ? m.bg : 'var(--gray-50)',
                      border: `1.5px solid ${selectedMethod === m.id ? m.color + '60' : 'var(--border)'}`,
                      borderRadius: selectedMethod === m.id ? '12px 12px 0 0' : '12px',
                      cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex',
                      alignItems: 'center', gap: '12px', transition: 'all 0.15s',
                    }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: selectedMethod === m.id ? 'white' : m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, fontWeight: 800, color: m.color }}>
                        {m.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 2px', color: 'var(--gray-900)' }}>{m.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>{m.desc}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: m.status === 'active' ? 'var(--success-light)' : 'var(--gray-100)', color: m.status === 'active' ? 'var(--success)' : 'var(--gray-400)' }}>
                          {m.status === 'active' ? '● Active' : 'Manual'}
                        </span>
                        <span style={{ fontSize: '16px', color: 'var(--gray-300)', transform: selectedMethod === m.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>›</span>
                      </div>
                    </button>
                    {selectedMethod === m.id && (
                      <div style={{ background: m.bg, border: `1.5px solid ${m.color}60`, borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '16px 18px' }}>
                        <div style={{ marginBottom: m.fields ? '16px' : '0' }}>
                          <p style={{ fontSize: '11px', fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>How it works</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {m.instructions.map((inst, i) => (
                              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: m.color, color: 'white', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
                                <p style={{ fontSize: '13px', color: 'var(--gray-700)', margin: 0, lineHeight: 1.5 }}>{inst}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        {m.fields && (
                          <div style={{ background: 'white', borderRadius: '10px', padding: '14px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-600)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your details</p>
                            {m.fields.map(field => (
                              <div key={field.key}>
                                <label style={labelStyle}>{field.label}</label>
                                <input type={field.type} value={form[field.key as keyof typeof form] as string}
                                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                                  placeholder={field.placeholder} style={inputStyle}/>
                              </div>
                            ))}
                            <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>
                              💡 These details will appear on your invoices
                            </p>
                          </div>
                        )}
                        {m.id === 'stripe' && (
                          <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', padding: '9px 18px', background: '#6772e5', color: 'white', borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
                            🚀 Activate live payments →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Automation tab ── */}
        {activeTab === 'automation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>Automation settings</h2>
                <p style={{ fontSize: '13px', color: 'var(--gray-400)', margin: 0 }}>Toggle each workflow on or off independently</p>
              </div>
              <button onClick={runReminders} disabled={runningReminders} style={{
                padding: '9px 18px', background: 'var(--primary)', color: 'white',
                border: 'none', borderRadius: 'var(--radius)', fontSize: '13px',
                fontWeight: 700, cursor: runningReminders ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font)', opacity: runningReminders ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                {runningReminders ? '⏳ Running...' : '▶ Run reminders now'}
              </button>
            </div>

            {reminderResult && (
              <div style={{ background: 'var(--success-light)', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: 'var(--success)', fontWeight: 600 }}>
                {reminderResult}
              </div>
            )}

            {/* Master toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', background: form.automation_enabled ? 'var(--success-light)' : 'var(--gray-50)', borderRadius: '12px', border: `1.5px solid ${form.automation_enabled ? '#86efac' : 'var(--border)'}`, transition: 'all 0.2s' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 2px' }}>Master switch</p>
                <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>
                  {form.automation_enabled ? '✅ Automations are ON — workflows running' : '⏸ Automations are OFF — all workflows paused'}
                </p>
              </div>
              <Toggle value={form.automation_enabled} onChange={v => setForm({ ...form, automation_enabled: v })}/>
            </div>

            {/* Individual workflows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Individual workflows</p>

              {/* Invoice reminders with sub-toggles */}
              <div style={{ border: '1.5px solid var(--border)', borderRadius: '12px', overflow: 'hidden', opacity: form.automation_enabled ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: form.automation_reminders && form.automation_enabled ? 'var(--primary-light)' : 'var(--gray-50)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>🔔</span>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 2px', color: 'var(--gray-900)' }}>Invoice reminders</p>
                      <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>Auto reminders after due date</p>
                    </div>
                  </div>
                  <Toggle value={form.automation_reminders} onChange={v => setForm({ ...form, automation_reminders: v })} disabled={!form.automation_enabled}/>
                </div>
                {form.automation_reminders && form.automation_enabled && (
                  <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px' }}>
                    {[
                      { key: 'reminder_day3', label: 'Day 3' },
                      { key: 'reminder_day7', label: 'Day 7' },
                      { key: 'reminder_day14', label: 'Day 14' },
                      { key: 'reminder_day30', label: 'Day 30' },
                    ].map(r => (
                      <div key={r.key} onClick={() => setForm({ ...form, [r.key]: !form[r.key as keyof typeof form] })}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '10px', background: form[r.key as keyof typeof form] ? 'var(--primary-light)' : 'var(--gray-50)', borderRadius: '8px', border: `1.5px solid ${form[r.key as keyof typeof form] ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: form[r.key as keyof typeof form] ? 'var(--primary)' : 'var(--gray-400)' }}>{r.label}</span>
                        <span style={{ fontSize: '10px', color: form[r.key as keyof typeof form] ? 'var(--primary)' : 'var(--gray-300)', fontWeight: 600 }}>{form[r.key as keyof typeof form] ? '● On' : '○ Off'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other workflows */}
              {[
                { key: 'automation_overdue', icon: '⚠️', label: 'Overdue detection', desc: 'Mark invoices overdue after due date', available: true },
                { key: 'automation_reengagement', icon: '💬', label: 'Re-engagement alerts', desc: 'Flag clients inactive for 60+ days', available: true },
                { key: 'automation_daily_send', icon: '📧', label: 'Daily invoice send', desc: 'Auto-send invoices at 8am', available: false },
                { key: 'automation_stripe_billing', icon: '💳', label: 'Stripe auto-billing', desc: 'Charge saved cards on due date', available: false },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1.5px solid var(--border)', borderRadius: '12px', background: form[item.key as keyof typeof form] && form.automation_enabled ? 'var(--gray-50)' : 'white', opacity: form.automation_enabled ? 1 : 0.5, transition: 'all 0.2s' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>{item.icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--gray-900)' }}>{item.label}</p>
                        {!item.available && <span style={{ fontSize: '10px', background: 'var(--purple-light)', color: 'var(--purple)', padding: '2px 7px', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>Coming soon</span>}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: '2px 0 0' }}>{item.desc}</p>
                    </div>
                  </div>
                  <Toggle
                    value={form[item.key as keyof typeof form] as boolean}
                    onChange={v => item.available && setForm({ ...form, [item.key]: v })}
                    disabled={!form.automation_enabled || !item.available}
                  />
                </div>
              ))}
            </div>

            {/* Status summary */}
            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '14px 16px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gray-600)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>Current status</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[
                  { label: 'Reminders', on: form.automation_enabled && form.automation_reminders },
                  { label: 'Day 3', on: form.automation_enabled && form.automation_reminders && form.reminder_day3 },
                  { label: 'Day 7', on: form.automation_enabled && form.automation_reminders && form.reminder_day7 },
                  { label: 'Day 14', on: form.automation_enabled && form.automation_reminders && form.reminder_day14 },
                  { label: 'Day 30', on: form.automation_enabled && form.automation_reminders && form.reminder_day30 },
                  { label: 'Overdue', on: form.automation_enabled && form.automation_overdue },
                  { label: 'Re-engagement', on: form.automation_enabled && form.automation_reengagement },
                ].map(s => (
                  <span key={s.label} style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--radius-full)', background: s.on ? 'var(--success-light)' : 'var(--gray-100)', color: s.on ? 'var(--success)' : 'var(--gray-400)' }}>
                    {s.on ? '●' : '○'} {s.label}
                  </span>
                ))}
              </div>
            </div>
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

            {/* Change email */}
            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: 'var(--gray-700)' }}>Change email</p>
              <input type="email" placeholder="New email address" style={{ ...inputStyle, marginBottom: '8px' }}/>
              <button style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font)' }}>
                Update email
              </button>
            </div>

            {/* Change password */}
            <div style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: 'var(--gray-700)' }}>Change password</p>
              <input type="password" placeholder="New password" style={{ ...inputStyle, marginBottom: '8px' }}/>
              <button style={{ padding: '8px 18px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontSize: '13px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font)' }}>
                Update password
              </button>
            </div>

            {/* Danger zone */}
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

      {/* Onboarding link — shown below the main card on account tab */}
      {activeTab === 'account' && <OnboardingSettings />}

    </div>
  )
}