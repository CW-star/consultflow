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
  { href: '/', label: 'Dashboard', icon: '▦', desc: 'Overview' },
  { href: '/sessions', label: 'Sessions', icon: '◔', desc: 'Time tracking' },
  { href: '/clients', label: 'Clients', icon: '◎', desc: 'Client management' },
  { href: '/invoices', label: 'Invoices', icon: '◈', desc: 'Billing' },
  { href: '/analytics', label: 'Analytics', icon: '◫', desc: 'Insights' },
  { href: '/automations', label: 'Automations', icon: '⚡', desc: 'Workflows' },
  { href: '/settings', label: 'Settings', icon: '◐', desc: 'Configuration' },
]

const bottomNav = navItems.slice(0, 5)

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
        width: '34px', height: '34px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        color: 'white', border: 'none', fontSize: '12px',
        fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
      }}>
        CW
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)}/>
          <div style={{
            position: 'absolute', right: 0, top: '42px',
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '6px',
            minWidth: '210px', zIndex: 50,
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border-light)', marginBottom: '4px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-900)', margin: '0 0 1px' }}>Cynthia W.</p>
              <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>Consultant</p>
            </div>
            <Link href="/settings" onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: 'var(--radius)',
              fontSize: '13px', color: 'var(--gray-700)',
              textDecoration: 'none', fontWeight: 500,
            }}>
              ◐ Settings
            </Link>
            <Link href="/automations" onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: 'var(--radius)',
              fontSize: '13px', color: 'var(--gray-700)',
              textDecoration: 'none', fontWeight: 500,
            }}>
              ⚡ Automations
            </Link>
            <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '4px', paddingTop: '4px' }}>
              <button onClick={handleLogout} style={{
                width: '100%', textAlign: 'left', padding: '8px 12px',
                background: 'none', border: 'none',
                borderRadius: 'var(--radius)', fontSize: '13px',
                color: 'var(--danger)', cursor: 'pointer',
                fontFamily: 'var(--font)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                ⎋ Sign out
              </button>
            </div>
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <style>{`
        .cf-sidebar { display: flex; }
        .cf-topnav { display: none; }
        .cf-bottom-nav { display: none; }
        .cf-main { margin-left: 230px; padding: 28px 32px; min-height: 100vh; }

        @media (max-width: 768px) {
          .cf-sidebar { display: none !important; }
          .cf-topnav { display: flex !important; }
          .cf-bottom-nav { display: flex !important; }
          .cf-main { margin-left: 0 !important; padding: 16px 16px 90px !important; padding-top: 72px !important; }
        }
      `}</style>

      {/* Desktop Sidebar */}
      <aside className="cf-sidebar" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '230px', background: 'white',
        borderRight: '1px solid var(--border)',
        flexDirection: 'column', zIndex: 40,
        boxShadow: '2px 0 12px rgba(0,0,0,0.03)',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              borderRadius: '10px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
            }}>
              <span style={{ color: 'white', fontSize: '15px', fontWeight: 800, letterSpacing: '-0.5px' }}>CF</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gray-900)', margin: 0, letterSpacing: '-0.3px' }}>ConsultFlow</p>
              <p style={{ fontSize: '10px', color: 'var(--gray-400)', margin: 0, fontWeight: 500 }}>Practice Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--gray-300)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: '6px' }}>Menu</p>
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: 'var(--radius)',
                marginBottom: '1px', textDecoration: 'none',
                background: active ? 'var(--primary-light)' : 'transparent',
                transition: 'all 0.15s',
              }}>
                <span style={{
                  fontSize: '15px', width: '22px', textAlign: 'center',
                  color: active ? 'var(--primary)' : 'var(--gray-400)',
                }}>
                  {item.icon}
                </span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : 'var(--gray-700)', margin: 0, lineHeight: 1.3 }}>
                    {item.label}
                  </p>
                </div>
                {active && <div style={{ marginLeft: 'auto', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }}/>}
              </Link>
            )
          })}
        </nav>

        {/* User profile */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
            }}>
              <span style={{ color: 'white', fontSize: '11px', fontWeight: 700 }}>CW</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Cynthia W.</p>
              <p style={{ fontSize: '11px', color: 'var(--gray-400)', margin: 0 }}>Consultant</p>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}
              title="Sign out"
              style={{ background: 'var(--gray-100)', border: 'none', borderRadius: 'var(--radius)', padding: '5px 8px', fontSize: '11px', color: 'var(--gray-500)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600 }}>
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Nav */}
      <nav className="cf-topnav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '58px',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 50,
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '6px', display: 'flex', flexDirection: 'column',
            gap: '4px', borderRadius: 'var(--radius)',
          }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ width: '18px', height: '1.5px', background: 'var(--gray-700)', display: 'block', borderRadius: '2px' }}/>
            ))}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '11px', fontWeight: 800 }}>CF</span>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gray-900)', letterSpacing: '-0.3px' }}>ConsultFlow</span>
          </div>
        </div>
        <ProfileMenu />
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}/>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: '260px', background: 'white', padding: '20px 10px',
            boxShadow: 'var(--shadow-lg)', animation: 'slideIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingLeft: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontSize: '12px', fontWeight: 800 }}>CF</span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--gray-900)' }}>ConsultFlow</span>
            </div>
            {navItems.map(item => {
              const active = pathname === item.href
              return (
                <Link key={item.href} href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 12px', borderRadius: 'var(--radius)',
                    marginBottom: '2px', textDecoration: 'none',
                    background: active ? 'var(--primary-light)' : 'transparent',
                  }}>
                  <span style={{ fontSize: '16px', color: active ? 'var(--primary)' : 'var(--gray-400)' }}>{item.icon}</span>
                  <span style={{ fontSize: '14px', fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : 'var(--gray-700)' }}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="cf-bottom-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid var(--border)',
        zIndex: 40, padding: '6px 0 8px',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
      }}>
        {bottomNav.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '3px', textDecoration: 'none',
              padding: '4px 0', position: 'relative',
            }}>
              {active && <div style={{ position: 'absolute', top: '-6px', width: '20px', height: '2px', background: 'var(--primary)', borderRadius: '0 0 2px 2px' }}/>}
              <span style={{ fontSize: '17px', color: active ? 'var(--primary)' : 'var(--gray-300)' }}>{item.icon}</span>
              <span style={{ fontSize: '9px', fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : 'var(--gray-400)', letterSpacing: '0.02em' }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="cf-main">
        <div className="animate-fade">
          {children}
        </div>
      </main>
    </div>
  )
}