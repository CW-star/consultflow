'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/sessions', label: 'Sessions', icon: '◷' },
  { href: '/clients', label: 'Clients', icon: '◉' },
  { href: '/invoices', label: 'Invoices', icon: '◈' },
  { href: '/analytics', label: 'Analytics', icon: '◫' },
  { href: '/automations', label: 'Automations', icon: '⚡' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Top navbar */}
      <nav style={{
        background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '0 1.5rem', height: '56px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'flex', flexDirection: 'column', gap: '4px',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px', marginRight: '8px',
            }}
            className="mobile-menu-btn"
          >
            <span style={{ width: '20px', height: '2px', background: '#374151', display: 'block', transition: 'all 0.2s' }}/>
            <span style={{ width: '20px', height: '2px', background: '#374151', display: 'block', transition: 'all 0.2s' }}/>
            <span style={{ width: '20px', height: '2px', background: '#374151', display: 'block', transition: 'all 0.2s' }}/>
          </button>
          <span style={{ fontWeight: 700, fontSize: '16px', color: '#1e40af' }}>CF</span>
          <span style={{ fontWeight: 600, fontSize: '15px', color: '#111827' }}>ConsultFlow</span>
        </div>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', gap: '4px' }} className="desktop-nav">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '14px',
              textDecoration: 'none', fontWeight: pathname === item.href ? 600 : 400,
              color: pathname === item.href ? '#1e40af' : '#6b7280',
              background: pathname === item.href ? '#eff6ff' : 'transparent',
            }}>
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#1e40af', color: 'white', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600,
          }}>CW</div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', top: '56px', left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 40,
        }} onClick={() => setMobileOpen(false)}>
          <div style={{
            background: 'white', width: '240px', height: '100%',
            padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px',
          }} onClick={e => e.stopPropagation()}>
            {navItems.map(item => (
              <Link key={item.href} href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: '12px 16px', borderRadius: '8px', fontSize: '15px',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px',
                  fontWeight: pathname === item.href ? 600 : 400,
                  color: pathname === item.href ? '#1e40af' : '#374151',
                  background: pathname === item.href ? '#eff6ff' : 'transparent',
                }}>
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom mobile nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'white', borderTop: '1px solid #e5e7eb',
        display: 'flex', zIndex: 40, padding: '8px 0',
      }} className="mobile-bottom-nav">
        {navItems.map(item => (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '2px', textDecoration: 'none',
            padding: '4px 0',
            color: pathname === item.href ? '#1e40af' : '#9ca3af',
          }}>
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: pathname === item.href ? 600 : 400 }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Main content */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
        {children}
      </main>

      <style>{`
        @media (min-width: 768px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
          .mobile-bottom-nav { display: flex !important; }
        }
      `}</style>
    </div>
  )
}