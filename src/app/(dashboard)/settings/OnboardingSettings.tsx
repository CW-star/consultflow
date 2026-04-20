'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OnboardingSettings() {
  const [link, setLink] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ welcome_message: '', is_active: true })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://consultflow-dun.vercel.app'

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('onboarding_links')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setLink(data)
        setForm({ welcome_message: data.welcome_message, is_active: data.is_active })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    await supabase.from('onboarding_links').update({
      welcome_message: form.welcome_message,
      is_active: form.is_active,
    }).eq('id', link.id)
    setSaving(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(`${appUrl}/onboarding/${link.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !link) return null

  const onboardingUrl = `${appUrl}/onboarding/${link.slug}`

  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '20px', marginTop: '20px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px', color: 'var(--gray-900)' }}>
            🔗 Client onboarding link
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>
            Share this link with new clients — they fill in their own info
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '12px', fontWeight: 700, padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: form.is_active ? 'var(--success-light)' : 'var(--gray-100)',
            color: form.is_active ? 'var(--success)' : 'var(--gray-400)',
          }}>
            {form.is_active ? '● Active' : '○ Inactive'}
          </span>
          <button onClick={() => setForm({ ...form, is_active: !form.is_active })} style={{
            padding: '5px 12px', background: 'var(--gray-100)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font)', color: 'var(--gray-600)',
          }}>
            {form.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Link row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{
          flex: 1, padding: '10px 14px', background: 'var(--gray-50)',
          borderRadius: 'var(--radius)', border: '1px solid var(--border)',
          fontSize: '13px', color: 'var(--primary)', fontFamily: 'var(--font-mono)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {onboardingUrl}
        </div>
        <button onClick={copyLink} style={{
          padding: '10px 16px',
          background: copied ? 'var(--success)' : 'var(--primary)',
          color: 'white', border: 'none', borderRadius: 'var(--radius)',
          fontSize: '13px', fontWeight: 700, cursor: 'pointer',
          fontFamily: 'var(--font)', whiteSpace: 'nowrap',
          transition: 'background 0.2s',
        }}>
          {copied ? '✓ Copied!' : '📋 Copy link'}
        </button>
        <a href={onboardingUrl} target="_blank" rel="noopener noreferrer" style={{
          padding: '10px 16px', background: 'white', color: 'var(--gray-600)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          fontSize: '13px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
        }}>
          Preview →
        </a>
      </div>

      {/* Welcome message */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block', fontSize: '12px', fontWeight: 700,
          color: 'var(--gray-600)', marginBottom: '6px',
          textTransform: 'uppercase' as const, letterSpacing: '0.04em',
        }}>
          Welcome message
        </label>
        <textarea
          value={form.welcome_message}
          onChange={e => setForm({ ...form, welcome_message: e.target.value })}
          rows={2}
          style={{
            width: '100%', padding: '10px 12px',
            border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
            fontSize: '13px', fontFamily: 'var(--font)',
            color: 'var(--gray-900)', resize: 'none', outline: 'none',
            boxSizing: 'border-box' as const,
          }}
        />
      </div>

      {/* How it works */}
      <div style={{ background: 'var(--primary-light)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
          How it works
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            'Share the link with a new client via email or message',
            'They fill in their name, email, contact details and project description',
            'Their profile is automatically created in your Clients page',
            'You get notified and can start logging sessions right away',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--primary)', color: 'white', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i + 1}
              </span>
              <p style={{ fontSize: '12px', color: 'var(--gray-700)', margin: 0, lineHeight: 1.5 }}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{
        padding: '9px 20px', background: 'var(--primary)', color: 'white',
        border: 'none', borderRadius: 'var(--radius)', fontSize: '13px',
        fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font)', opacity: saving ? 0.7 : 1,
      }}>
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  )
}