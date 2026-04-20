'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

export default function OnboardingPage() {
  const params = useParams()
  const slug = params.slug as string
  const [link, setLink] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    currency: 'CAD',
    notes: '',
    how_did_you_hear: '',
    project_description: '',
    budget_range: '',
    preferred_contact: 'email',
  })

  useEffect(() => {
    async function load() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const res = await fetch(
        `${url}/rest/v1/onboarding_links?slug=eq.${slug}&is_active=eq.true&select=*`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      )
      const data = await res.json()
      if (data.length > 0) setLink(data[0])
      setLoading(false)
    }
    load()
  }, [slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email) { setError('Name and email are required'); return }
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug }),
    })

    if (res.ok) {
      setSubmitted(true)
    } else {
      const data = await res.json()
      setError(data.error || 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid #e5e7eb', borderRadius: '10px',
    fontSize: '14px', color: '#111827', background: 'white',
    outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }

  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 700 as const,
    color: '#6b7280', marginBottom: '6px',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#9ca3af', fontSize: '14px' }}>Loading...</p>
    </div>
  )

  if (!link) return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</p>
        <h1 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#111827' }}>Link not found</h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>This onboarding link is invalid or has been deactivated. Please contact your consultant for a new link.</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '480px', background: 'white', borderRadius: '20px', padding: '48px 40px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '72px', height: '72px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '32px' }}>
          ✅
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', color: '#111827', letterSpacing: '-0.4px' }}>
          You're all set, {form.name.split(' ')[0]}!
        </h1>
        <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.6, marginBottom: '24px' }}>
          Thank you for submitting your details. {link.company_name} will be in touch with you shortly to get started.
        </p>
        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '16px', textAlign: 'left' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>What happens next</p>
          {['Your profile has been created', 'You\'ll receive a confirmation email shortly', 'Your consultant will reach out within 1-2 business days'].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#2563eb', color: 'white', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</span>
              <p style={{ fontSize: '13px', color: '#374151', margin: 0 }}>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)', padding: '40px 16px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(37,99,235,0.3)' }}>
            <span style={{ color: 'white', fontSize: '20px', fontWeight: 800 }}>CF</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.4px' }}>
            {link.company_name}
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0, lineHeight: 1.6 }}>{link.welcome_message}</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step >= s ? '#2563eb' : '#e5e7eb', color: step >= s ? 'white' : '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, transition: 'all 0.2s' }}>
                {step > s ? '✓' : s}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: step >= s ? '#2563eb' : '#9ca3af' }}>
                {s === 1 ? 'Your info' : 'Project details'}
              </span>
              {s < 2 && <div style={{ width: '32px', height: '2px', background: step > s ? '#2563eb' : '#e5e7eb', borderRadius: '2px', transition: 'background 0.2s' }}/>}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '14px', fontWeight: 500 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>

          {/* Step 1: Personal info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Tell us about yourself</p>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Basic contact information</p>
              </div>

              <div>
                <label style={labelStyle}>Full name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name" style={inputStyle} autoFocus/>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com" style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000" style={inputStyle}/>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Company / Organization</label>
                <input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="Where do you work? (optional)" style={inputStyle}/>
              </div>

              <div>
                <label style={labelStyle}>Preferred currency</label>
                <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                  style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="CAD">🇨🇦 CAD — Canadian Dollar</option>
                  <option value="USD">🇺🇸 USD — US Dollar</option>
                  <option value="EUR">🇪🇺 EUR — Euro</option>
                  <option value="GBP">🇬🇧 GBP — British Pound</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Preferred contact method</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['email', 'phone', 'text'].map(m => (
                    <button key={m} type="button" onClick={() => setForm({ ...form, preferred_contact: m })} style={{
                      flex: 1, padding: '9px', border: '1.5px solid',
                      borderColor: form.preferred_contact === m ? '#2563eb' : '#e5e7eb',
                      borderRadius: '9px', background: form.preferred_contact === m ? '#eff6ff' : 'white',
                      color: form.preferred_contact === m ? '#2563eb' : '#6b7280',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'inherit', textTransform: 'capitalize',
                    }}>
                      {m === 'email' ? '✉ Email' : m === 'phone' ? '📞 Phone' : '💬 Text'}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => {
                if (!form.name || !form.email) { setError('Please enter your name and email'); return }
                setError('')
                setStep(2)
              }} style={{
                width: '100%', padding: '13px', background: '#2563eb', color: 'white',
                border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px',
              }}>
                Next: Project details →
              </button>
            </div>
          )}

          {/* Step 2: Project details */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Project details</p>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>Help us understand what you need</p>
              </div>

              <div>
                <label style={labelStyle}>What do you need help with?</label>
                <textarea value={form.project_description}
                  onChange={e => setForm({ ...form, project_description: e.target.value })}
                  placeholder="Describe your project, goals, or what you'd like to work on together..."
                  rows={4} style={{ ...inputStyle, resize: 'none' }}/>
              </div>

              <div>
                <label style={labelStyle}>Budget range</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                  {['Under $500', '$500–$2,000', '$2,000–$5,000', '$5,000–$10,000', '$10,000+', 'Not sure yet'].map(b => (
                    <button key={b} type="button" onClick={() => setForm({ ...form, budget_range: b })} style={{
                      padding: '9px 6px', border: '1.5px solid',
                      borderColor: form.budget_range === b ? '#2563eb' : '#e5e7eb',
                      borderRadius: '9px', background: form.budget_range === b ? '#eff6ff' : 'white',
                      color: form.budget_range === b ? '#2563eb' : '#6b7280',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>How did you hear about us?</label>
                <select value={form.how_did_you_hear}
                  onChange={e => setForm({ ...form, how_did_you_hear: e.target.value })}
                  style={{ ...inputStyle, appearance: 'none' }}>
                  <option value="">Select one...</option>
                  <option value="referral">Referral from a friend</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="google">Google search</option>
                  <option value="social_media">Social media</option>
                  <option value="previous_client">I'm a returning client</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Anything else we should know?</label>
                <textarea value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Timeline, special requirements, questions..."
                  rows={3} style={{ ...inputStyle, resize: 'none' }}/>
              </div>

              {/* Review summary */}
              <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '14px 16px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Submitting as</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 800 }}>
                    {form.name.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: '0 0 1px' }}>{form.name}</p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{form.email}{form.company ? ` · ${form.company}` : ''}</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setStep(1)} style={{
                  padding: '13px 20px', background: 'white', color: '#6b7280',
                  border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px',
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  ← Back
                </button>
                <button type="submit" disabled={submitting} style={{
                  flex: 1, padding: '13px', background: submitting ? '#93c5fd' : '#2563eb',
                  color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px',
                  fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>
                  {submitting ? '⏳ Submitting...' : '✓ Submit my details'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>
          Powered by ConsultFlow · Your information is secure and private
        </p>
      </div>
    </div>
  )
}