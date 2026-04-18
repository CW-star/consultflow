'use client'
import Link from 'next/link'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{display:'flex',minHeight:'100vh',background:'#f0f4f8'}}>
      {/* Sidebar */}
      <aside style={{
        width:'220px',flexShrink:0,background:'#0f172a',
        display:'flex',flexDirection:'column',position:'fixed',
        top:0,left:0,bottom:0,zIndex:10
      }}>
        {/* Logo */}
        <div style={{padding:'24px 20px',borderBottom:'1px solid #1e293b'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'32px',height:'32px',background:'linear-gradient(135deg,#3b82f6,#1d4ed8)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'white',fontWeight:700,fontSize:'14px'}}>CF</span>
            </div>
            <div>
              <p style={{color:'white',fontWeight:700,fontSize:'15px',margin:0}}>ConsultFlow</p>
              <p style={{color:'#64748b',fontSize:'11px',margin:0}}>Practice Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:'16px 12px',display:'flex',flexDirection:'column',gap:'4px'}}>
          {[
            { href:'/', label:'Dashboard', icon:'⊞' },
            { href:'/sessions', label:'Sessions', icon:'◷' },
            { href:'/clients', label:'Clients', icon:'◉' },
            { href:'/invoices', label:'Invoices', icon:'◈' },
            { href:'/analytics', label:'Analytics', icon:'◫' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display:'flex',alignItems:'center',gap:'10px',
              padding:'10px 12px',borderRadius:'8px',
              color:'#94a3b8',textDecoration:'none',fontSize:'14px',
              transition:'all 0.15s'
            }}
            onMouseEnter={e=>{
              (e.currentTarget as HTMLElement).style.background='#1e293b'
              ;(e.currentTarget as HTMLElement).style.color='white'
            }}
            onMouseLeave={e=>{
              (e.currentTarget as HTMLElement).style.background='transparent'
              ;(e.currentTarget as HTMLElement).style.color='#94a3b8'
            }}>
              <span style={{fontSize:'16px'}}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div style={{padding:'16px',borderTop:'1px solid #1e293b'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#1e40af',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'white',fontSize:'13px',fontWeight:600}}>CW</span>
            </div>
            <div>
              <p style={{color:'white',fontSize:'13px',fontWeight:500,margin:0}}>Cynthia W.</p>
              <p style={{color:'#64748b',fontSize:'11px',margin:0}}>Consultant</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{marginLeft:'220px',flex:1,padding:'32px',minHeight:'100vh'}}>
        {children}
      </main>
    </div>
  )
}