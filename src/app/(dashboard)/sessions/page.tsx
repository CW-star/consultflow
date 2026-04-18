import { createClient } from '@supabase/supabase-js'

export default async function SessionsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: sessions }, { data: clients }] = await Promise.all([
    supabase.from('sessions').select('*').order('date', { ascending: false }),
    supabase.from('clients').select('*'),
  ])

  const totalValue = sessions?.reduce((sum, s) => sum + (Number(s.charge) || 0), 0) ?? 0
  const unbilledValue = sessions?.filter(s => !s.is_invoiced)
    .reduce((sum, s) => sum + (Number(s.charge) || 0), 0) ?? 0

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'24px',fontWeight:600}}>Sessions</h1>
          <p style={{color:'#6b7280',fontSize:'14px',marginTop:'4px'}}>
            {sessions?.length ?? 0} total · ${totalValue.toFixed(2)} billed · ${unbilledValue.toFixed(2)} unbilled
          </p>
        </div>
        <a href="/sessions/new" style={{background:'#1e40af',color:'white',padding:'10px 20px',borderRadius:'8px',textDecoration:'none',fontSize:'14px',fontWeight:500}}>
          + Log session
        </a>
      </div>

      {/* Summary cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'24px'}}>
        {[
          { label: 'Total sessions', value: sessions?.length ?? 0 },
          { label: 'Invoiced', value: sessions?.filter(s=>s.is_invoiced).length ?? 0 },
          { label: 'Unbilled', value: sessions?.filter(s=>!s.is_invoiced).length ?? 0 },
        ].map(s => (
          <div key={s.label} style={{background:'white',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'16px'}}>
            <p style={{fontSize:'12px',color:'#6b7280',marginBottom:'6px'}}>{s.label}</p>
            <p style={{fontSize:'22px',fontWeight:600}}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sessions table */}
      <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:'12px',overflow:'hidden'}}>
        <table style={{width:'100%',fontSize:'14px',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
              <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Date</th>
              <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Client</th>
              <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Time</th>
              <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Duration</th>
              <th style={{textAlign:'right',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Rate</th>
              <th style={{textAlign:'right',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Charge</th>
              <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Status</th>
              <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sessions?.map((s, i) => (
              <tr key={s.id} style={{borderBottom:'1px solid #f3f4f6',background:i%2===0?'white':'#fafafa'}}>
                <td style={{padding:'12px 16px',whiteSpace:'nowrap'}}>{s.date}</td>
                <td style={{padding:'12px 16px',fontWeight:500}}>
                  {clients?.find(c=>c.id===s.client_id)?.name ?? '—'}
                </td>
                <td style={{padding:'12px 16px',color:'#6b7280',whiteSpace:'nowrap'}}>
                  {s.start_time && s.end_time ? `${s.start_time}–${s.end_time}` : '—'}
                </td>
                <td style={{padding:'12px 16px'}}>{s.total_time_mins} min</td>
                <td style={{padding:'12px 16px',textAlign:'right',color:'#6b7280'}}>${Number(s.hourly_rate).toFixed(0)}/hr</td>
                <td style={{padding:'12px 16px',textAlign:'right',fontWeight:500}}>${Number(s.charge).toFixed(2)}</td>
                <td style={{padding:'12px 16px'}}>
                  <span style={{
                    background:s.is_invoiced?'#dcfce7':'#fef3c7',
                    color:s.is_invoiced?'#166534':'#92400e',
                    padding:'2px 10px',borderRadius:'999px',fontSize:'12px',whiteSpace:'nowrap'
                  }}>
                    {s.is_invoiced ? 'Invoiced' : 'Unbilled'}
                  </span>
                </td>
                <td style={{padding:'12px 16px',color:'#6b7280',maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
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
