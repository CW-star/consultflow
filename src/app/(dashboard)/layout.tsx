'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const navItems = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/sessions', label: 'Sessions', icon: '◷' },
  { href: '/clients', label: 'Clients', icon: '◉' },
  { href: '/invoices', label: 'Invoices', icon: '◈' },
  { href: '/analytics', label: 'Analytics', icon: '◫' },
  { href: '/automations', label: 'Automations', icon: '⚡' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: '#1e40af', color: 'white', border: 'none',
        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        CW
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)}/>
          <div style={{
            position: 'absolute', right: 0, top: '44px',
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: '12px', padding: '8px', minWidth: '200px',
            zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #f3f4f6', marginBottom: '4px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>Cynthia W.</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Consultant</p>
            </div>
            <Link href="/settings" onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '8px', fontSize: '13px',
              color: '#374151', textDecoration: 'none', width: '100%',
            }}>
              ⚙ Settings
            </Link>
            <button onClick={handleLogout} style={{
              width: '100%', textAlign: 'left', padding: '8px 12px',
              background: 'none', border: 'none', borderRadius: '8px',
              fontSize: '13px', color: '#dc2626', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              ⎋ Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <style>{`
        /* Desktop sidebar layout */
        .cf-sidebar { display: flex; }
        .cf-topnav { display: none; }
        .cf-bottom-nav { display: none; }
        .cf-hamburger { display: none; }
        .cf-desktop-links { display: flex; }
        .cf-main { margin-left: 220px; padding: 2rem; }

        /* Mobile layout */
        @media (max-width: 768px) {
          .cf-sidebar { display: none; }
          .cf-topnav { display: flex; }
          .cf-bottom-nav { display: flex; }
          .cf-hamburger { display: flex; }
          .cf-desktop-links { display: none; }
          .cf-main { margin-left: 0; padding: 1rem 1rem 6rem; }
        }
      `}</style>

      {/* ===== DESKTOP: Left sidebar ===== */}
      <aside className="cf-sidebar" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '220px',
        background: 'white', borderRight: '1px solid #e5e7eb',
        flexDirection: 'column', zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: '#1e40af', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>CF</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>ConsultFlow</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Practice Management</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px', marginBottom: '2px',
                textDecoration: 'none', fontSize: '14px',
                fontWeight: active ? 600 : 400,
                color: active ? '#1e40af' : '#6b7280',
                background: active ? '#eff6ff' : 'transparent',
              }}>
                <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Profile at bottom */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: 600 }}>CW</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Cynthia W.</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>Consultant</p>
            </div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
            style={{ width: '100%', marginTop: '8px', padding: '7px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ===== MOBILE: Top navbar ===== */}
      <nav className="cf-topnav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '56px',
        background: 'white', borderBottom: '1px solid #e5e7eb',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="cf-hamburger" onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ width: '20px', height: '2px', background: '#374151', display: 'block' }}/>
            <span style={{ width: '20px', height: '2px', background: '#374151', display: 'block' }}/>
            <span style={{ width: '20px', height: '2px', background: '#374151', display: 'block' }}/>
          </button>
          <span style={{ fontWeight: 700, fontSize: '15px', color: '#1e40af' }}>ConsultFlow</span>
        </div>
        <ProfileMenu />
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => setMobileOpen(false)}/>
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '260px', background: 'white', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ width: '32px', height: '32px', background: '#1e40af', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 700 }}>CF</span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>ConsultFlow</span>
            </div>
            {navItems.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 12px', borderRadius: '8px', marginBottom: '2px',
                  textDecoration: 'none', fontSize: '14px',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#1e40af' : '#374151',
                  background: active ? '#eff6ff' : 'transparent',
                }}>
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ===== MOBILE: Bottom tab bar (max 5 items) ===== */}
      <nav className="cf-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #e5e7eb',
        zIndex: 40, padding: '6px 0',
      }}>
        {navItems.slice(0, 5).map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '2px', textDecoration: 'none',
              padding: '4px 0',
              color: active ? '#1e40af' : '#9ca3af',
            }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span style={{ fontSize: '10px', fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="cf-main" style={{ minHeight: '100vh' }}>
        {/* Desktop: offset for top padding, Mobile: offset for top navbar */}
        <div style={{ paddingTop: '0' }} className="cf-desktop-content">
          <style>{`
            @media (max-width: 768px) {
              .cf-desktop-content { padding-top: 56px; }
            }
          `}</style>
          {children}
        </div>
      </main>
    </div>
  )
}