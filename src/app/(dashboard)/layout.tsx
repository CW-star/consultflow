'use client'
import { useState, useEffect } from 'react'
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
  { href: '/help', label: 'Help', icon: '?', desc: 'Help center' },
]

const bottomNav = navItems.slice(0, 5)

interface Notification {
  id: string
  type: 'overdue' | 'payment' | 'inactive' | 'unbilled'
  title: string
  message: string
  link: string
  time: string
  read: boolean
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` }

    const [invRes, sessRes, clientRes] = await Promise.all([
      fetch(`${url}/rest/v1/invoices?select=*,clients(name)&status=eq.overdue`, { headers }),
      fetch(`${url}/rest/v1/sessions?select=*,clients(name)&is_invoiced=eq.false`, { headers }),
      fetch(`${url}/rest/v1/clients?select=*`, { headers }),
    ])

    const overdueInv = await invRes.json()
    const unbilledSess = await sessRes.json()
    const clients = await clientRes.json()
    const notifs: Notification[] = []

    // Overdue invoices
    overdueInv.slice(0, 3).forEach((inv: any) => {
      notifs.push({
        id: `overdue-${inv.id}`,
        type: 'overdue',
        title: 'Overdue invoice',
        message: `${inv.invoice_number} for ${inv.clients?.name} is overdue`,
        link: `/invoices/${inv.id}`,
        time: inv.due_date,
        read: false,
      })
    })

    // Unbilled sessions
    if (unbilledSess.length > 0) {
      const total = unbilledSess.reduce((s: number, sess: any) => s + (sess.charge || 0), 0)
      notifs.push({
        id: 'unbilled',
        type: 'unbilled',
        title: 'Unbilled work',
        message: `${unbilledSess.length} sessions worth $${total.toFixed(2)} not yet invoiced`,
        link: '/sessions',
        time: 'Now',
        read: false,
      })
    }

    // Inactive clients (60+ days)
    const inactiveClients = clients.filter((c: any) => {
      // Flag if client ID not in recent sessions
      return true // simplified — full logic in client detail
    }).slice(0, 2)

    setNotifications(notifs)
    setLoading(false)
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unread = notifications.filter(n => !n.read).length

  const typeConfig = {
    overdue: { icon: '⚠️', color: 'var(--danger)', bg: 'var(--danger-light)' },
    payment: { icon: '✅', color: 'var(--success)', bg: 'var(--success-light)' },
    inactive: { icon: '💬', color: 'var(--warning)', bg: 'var(--warning-light)' },
    unbilled: { icon: '📋', color: 'var(--purple)', bg: 'var(--purple-light)' },
  }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{
        position: 'relative', width: '36px', height: '36px',
        borderRadius: '10px', background: 'var(--gray-100)',
        border: '1px solid var(--border)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', transition: 'all 0.15s',
      }}>
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: 'var(--danger)', color: 'white',
            borderRadius: 'var(--radius-full)', fontSize: '9px',
            fontWeight: 800, minWidth: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', border: '2px solid white',
          }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)}/>
          <div style={{
            position: 'absolute', right: 0, top: '44px',
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', width: '340px',
            zIndex: 50, boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--gray-50)' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 1px', color: 'var(--gray-900)' }}>Notifications</p>
                <p style={{ fontSize: '12px', color: 'var(--gray-400)', margin: 0 }}>{unread} unread</p>
              </div>
              {unread > 0 && (
                <button onClick={markAllRead} style={{
                  background: 'none', border: 'none', fontSize: '12px',
                  color: 'var(--primary)', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontWeight: 600,
                }}>
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--gray-400)', fontSize: '13px' }}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: '28px', marginBottom: '8px' }}>🎉</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '4px' }}>All caught up!</p>
                  <p style={{ fontSize: '13px', color: 'var(--gray-400)', margin: 0 }}>No new notifications</p>
                </div>
              ) : (
                notifications.map(n => {
                  const config = typeConfig[n.type]
                  return (
                    <Link key={n.id} href={n.link} onClick={() => {
                      setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif))
                      setOpen(false)
                    }} style={{
                      display: 'flex', gap: '12px', padding: '13px 16px',
                      borderBottom: '1px solid var(--border-light)',
                      textDecoration: 'none', background: n.read ? 'white' : 'var(--primary-light)',
                      transition: 'background 0.15s',
                    }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '16px' }}>
                        {config.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '3px' }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gray-900)', margin: 0 }}>{n.title}</p>
                          {!n.read && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '4px' }}/>}
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '0 0 4px', lineHeight: 1.4 }}>{n.message}</p>
                        <p style={{ fontSize: '11px', color: 'var(--gray-300)', margin: 0, fontFamily: 'var(--font-mono)' }}>{n.time}</p>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--gray-50)' }}>
              <Link href="/automations" onClick={() => setOpen(false)} style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View all automations →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

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
            <Link href="/help" onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: 'var(--radius)',
              fontSize: '13px', color: 'var(--gray-700)',
              textDecoration: 'none', fontWeight: 500,
            }}>
              ? Help center
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
                <span style={{ fontSize: '15px', width: '22px', textAlign: 'center', color: active ? 'var(--primary)' : 'var(--gray-400)' }}>
                  {item.icon}
                </span>
                <p style={{ fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? 'var(--primary)' : 'var(--gray-700)', margin: 0, flex: 1 }}>
                  {item.label}
                </p>
                {active && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}/>}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <NotificationBell />
          <ProfileMenu />
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}/>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: '260px', background: 'white', padding: '20px 10px',
            boxShadow: 'var(--shadow-lg)',
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

      {/* Also show notification bell in desktop sidebar top right */}
      <div className="cf-sidebar" style={{
        position: 'fixed', top: '14px', right: '24px', zIndex: 50,
      }}>
        <NotificationBell />
      </div>

      {/* Main content */}
      <main className="cf-main">
        <div className="animate-fade">
          {children}
        </div>
      </main>
    </div>
  )
}