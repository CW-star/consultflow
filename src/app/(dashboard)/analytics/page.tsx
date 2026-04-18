'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function AnalyticsPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [{ data: inv }, { data: sess }] = await Promise.all([
        supabase.from('invoices').select('*'),
        supabase.from('sessions').select('*'),
      ])
      setInvoices(inv ?? [])
      setSessions(sess ?? [])
    }
    load()
  }, [])

  const totalBilled = invoices.reduce((s, i) => s + (i.total_amount || 0), 0)
  const totalPaid = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0)
  const totalOutstanding = totalBilled - totalPaid
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const overdueCount = invoices.filter(i => i.status === 'overdue').length
  const collectionRate = totalBilled > 0 ? ((totalPaid / totalBilled) * 100).toFixed(1) : '0'

  // Monthly data
  const monthlyMap: Record<string, { month: string; billed: number; collected: number }> = {}
  invoices.forEach(inv => {
    const month = inv.issue_date?.slice(0, 7)
    if (!month) return
    if (!monthlyMap[month]) monthlyMap[month] = { month, billed: 0, collected: 0 }
    monthlyMap[month].billed += inv.total_amount || 0
    monthlyMap[month].collected += inv.paid_amount || 0
  })
  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)

  // Client breakdown
  const clientMap: Record<string, number> = {}
  sessions.forEach(s => {
    const name = s.client_id
    clientMap[name] = (clientMap[name] || 0) + (s.charge || 0)
  })

  const fmt = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)

  const stats = [
    { label: 'Total billed', value: fmt(totalBilled), color: '#1e40af' },
    { label: 'Total collected', value: fmt(totalPaid), color: '#16a34a' },
    { label: 'Outstanding', value: fmt(totalOutstanding), color: '#dc2626' },
    { label: 'Collection rate', value: `${collectionRate}%`, color: '#d97706' },
    { label: 'Paid invoices', value: String(paidCount), color: '#16a34a' },
    { label: 'Overdue invoices', value: String(overdueCount), color: '#dc2626' },
  ]

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'32px'}}>
      <div>
        <h1 style={{fontSize:'24px',fontWeight:600,marginBottom:'4px'}}>Analytics</h1>
        <p style={{color:'#6b7280',fontSize:'14px'}}>Revenue and cash flow overview</p>
      </div>

      {/* Stats grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
        {stats.map(s => (
          <div key={s.label} style={{background:'white',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'20px'}}>
            <p style={{fontSize:'12px',color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'8px'}}>{s.label}</p>
            <p style={{fontSize:'24px',fontWeight:600,color:s.color}}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Cash flow chart */}
      <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'24px'}}>
        <h2 style={{fontSize:'16px',fontWeight:600,marginBottom:'20px'}}>Cash flow — last 6 months</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
            <XAxis dataKey="month" tick={{fontSize:12,fill:'#9ca3af'}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:12,fill:'#9ca3af'}} axisLine={false} tickLine={false}
              tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
            <Tooltip formatter={(v: number) => fmt(v)}
              contentStyle={{border:'1px solid #e5e7eb',borderRadius:'8px',fontSize:'13px'}}/>
            <Bar dataKey="billed" fill="#dbeafe" radius={[4,4,0,0]} name="Billed"/>
            <Bar dataKey="collected" fill="#1e40af" radius={[4,4,0,0]} name="Collected"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Invoice status breakdown */}
      <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'24px'}}>
        <h2 style={{fontSize:'16px',fontWeight:600,marginBottom:'20px'}}>Invoice status breakdown</h2>
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          {['paid','sent','overdue','draft','partial'].map(status => {
            const count = invoices.filter(i => i.status === status).length
            const amount = invoices.filter(i => i.status === status).reduce((s,i) => s + (i.total_amount||0), 0)
            const colors: Record<string,string> = {paid:'#16a34a',sent:'#2563eb',overdue:'#dc2626',draft:'#6b7280',partial:'#d97706'}
            const pct = invoices.length > 0 ? (count/invoices.length*100).toFixed(0) : '0'
            return (
              <div key={status} style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{width:'80px',fontSize:'13px',fontWeight:500,textTransform:'capitalize',color:colors[status]}}>{status}</div>
                <div style={{flex:1,background:'#f3f4f6',borderRadius:'4px',height:'8px'}}>
                  <div style={{width:`${pct}%`,background:colors[status],borderRadius:'4px',height:'8px',transition:'width 0.3s'}}/>
                </div>
                <div style={{width:'40px',fontSize:'12px',color:'#6b7280',textAlign:'right'}}>{count}</div>
                <div style={{width:'100px',fontSize:'13px',fontWeight:500,textAlign:'right'}}>{fmt(amount)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}