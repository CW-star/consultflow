import { createClient } from '@supabase/supabase-js'

export default async function DashboardPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: sessions }, { data: clients }, { data: invoices }] = await Promise.all([
    supabase.from('sessions').select('*').order('date', { ascending: false }),
    supabase.from('clients').select('*'),
    supabase.from('invoices').select('*'),
  ])

  const totalBilled = sessions?.reduce((s, r) => s + (Number(r.charge)||0), 0) ?? 0
  const unbilled = sessions?.filter(s => !s.is_invoiced) ?? []
  const unbilledValue = unbilled.reduce((s, r) => s + (Number(r.charge)||0), 0)
  const invoicedValue = totalBilled - unbilledValue

  const stats = [
    { label:'Total revenue', value:`$${totalBilled.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}`, sub:'All time', color:'#1e40af', bg:'#eff6ff' },
    { label:'Invoiced', value:`$${invoicedValue.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}`, sub:`${sessions?.filter(s=>s.is_invoiced).length} sessions`, color:'#065f46', bg:'#ecfdf5' },
    { label:'Unbilled work', value:`$${unbilledValue.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}`, sub:`${unbilled.length} sessions pending`, color:'#92400e', bg:'#fffbeb' },
    { label:'Active clients', value:`${clients?.length ?? 0}`, sub:`${sessions?.length} total sessions`, color:'#581c87', bg:'#faf5ff' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{marginBottom:'32px'}}>
        <h1 style={{fontSize:'28px',fontWeight:700,color:'#0f172a',margin:0}}>Dashboard</h1>
        <p style={{color:'#64748b',marginTop:'6px',fontSize:'15px'}}>
          {new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'20px',marginBottom:'32px'}}>
        {stats.map(s => (
          <div key={s.label} style={{
            background:'white',borderRadius:'16px',padding:'24px',
            border:'1px solid #e2e8f0',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <p style={{fontSize:'13px',color:'#64748b',fontWeight:500,margin:'0 0 8px'}}>{s.label}</p>
                <p style={{fontSize:'26px',fontWeight:700,color:'#0f172a',margin:0}}>{s.value}</p>
                <p style={{fontSize:'12px',color:'#94a3b8',margin:'6px 0 0'}}>{s.sub}</p>
              </div>
              <div style={{width:'40px',height:'40px',borderRadius:'10px',background:s.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div style={{width:'12px',height:'12px',borderRadius:'50%',background:s.color}}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Unbilled alert */}
      {unbilledValue > 0 && (
        <div style={{
          background:'linear-gradient(135deg,#1e40af,#1d4ed8)',
          borderRadius:'16px',padding:'20px 24px',marginBottom:'32px',
          display:'flex',justifyContent:'space-between',alignItems:'center'
        }}>
          <div>
            <p style={{color:'white',fontWeight:600,fontSize:'16px',margin:0}}>
              ${unbilledValue.toFixed(2)} in unbilled work ready to invoice
            </p>
            <p style={{color:'#93c5fd',fontSize:'14px',margin:'4px 0 0'}}>
              {unbilled.length} sessions across {new Set(unbilled.map(s=>s.client_id)).size} clients
            </p>
          </div>
          <a href="/invoices" style={{
            background:'white',color:'#1e40af',padding:'10px 20px',
            borderRadius:'10px',textDecoration:'none',fontWeight:600,fontSize:'14px',
            whiteSpace:'nowrap'
          }}>
            View invoices →
          </a>
        </div>
      )}

      {/* Recent sessions table */}
      <div style={{background:'white',borderRadius:'16px',border:'1px solid #e2e8f0',overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
        <div style={{padding:'20px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{fontSize:'16px',fontWeight:600,color:'#0f172a',margin:0}}>Recent sessions</h2>
          <a href="/sessions" style={{fontSize:'13px',color:'#3b82f6',textDecoration:'none',fontWeight:500}}>View all →</a>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
          <thead>
            <tr style={{background:'#f8fafc'}}>
              {['Date','Client','Duration','Charge','Status','Notes'].map(h => (
                <th key={h} style={{textAlign:'left',padding:'12px 24px',color:'#64748b',fontWeight:500,fontSize:'12px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions?.slice(0,8).map((s,i) => (
              <tr key={s.id} style={{borderTop:'1px solid #f1f5f9',background:i%2===0?'white':'#fafafa'}}>
                <td style={{padding:'14px 24px',color:'#374151',whiteSpace:'nowrap'}}>{s.date}</td>
                <td style={{padding:'14px 24px'}}>
                  <span style={{fontWeight:600,color:'#0f172a'}}>{clients?.find(c=>c.id===s.client_id)?.name}</span>
                </td>
                <td style={{padding:'14px 24px',color:'#64748b'}}>{s.total_time_mins} min</td>
                <td style={{padding:'14px 24px',fontWeight:600,color:'#0f172a'}}>${Number(s.charge).toFixed(2)}</td>
                <td style={{padding:'14px 24px'}}>
                  <span style={{
                    background:s.is_invoiced?'#dcfce7':'#fef3c7',
                    color:s.is_invoiced?'#166534':'#92400e',
                    padding:'4px 12px',borderRadius:'999px',fontSize:'12px',fontWeight:500
                  }}>
                    {s.is_invoiced?'Invoiced':'Unbilled'}
                  </span>
                </td>
                <td style={{padding:'14px 24px',color:'#94a3b8',maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {s.notes ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}