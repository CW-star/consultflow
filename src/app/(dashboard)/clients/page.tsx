import { createClient } from '@supabase/supabase-js'

export default async function ClientsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'24px',fontWeight:600}}>Clients</h1>
          <p style={{color:'#6b7280',fontSize:'14px',marginTop:'4px'}}>{clients?.length ?? 0} active clients</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
        {clients?.map(client => {
          const clientSessions = sessions?.filter(s => s.client_id === client.id) ?? []
          const totalMins = clientSessions.reduce((sum, s) => sum + (s.total_time_mins || 0), 0)
          const totalBilled = clientSessions.reduce((sum, s) => sum + (Number(s.charge) || 0), 0)
          const unbilled = clientSessions.filter(s => !s.is_invoiced)
          const unbilledValue = unbilled.reduce((sum, s) => sum + (Number(s.charge) || 0), 0)
          const hours = Math.floor(totalMins / 60)
          const mins = totalMins % 60

          return (
            <div key={client.id} style={{background:'white',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
                <div>
                  <h3 style={{fontSize:'16px',fontWeight:600,marginBottom:'4px'}}>{client.name}</h3>
                  <p style={{fontSize:'13px',color:'#6b7280'}}>{client.currency} · ${client.default_hourly_rate}/hr</p>
                </div>
                <span style={{
                  background: unbilled.length > 0 ? '#fef3c7' : '#dcfce7',
                  color: unbilled.length > 0 ? '#92400e' : '#166534',
                  fontSize:'12px',padding:'2px 10px',borderRadius:'999px'
                }}>
                  {unbilled.length > 0 ? `${unbilled.length} unbilled` : 'All invoiced'}
                </span>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'16px'}}>
                <div style={{background:'#f9fafb',borderRadius:'8px',padding:'12px'}}>
                  <p style={{fontSize:'11px',color:'#6b7280',marginBottom:'4px'}}>Total sessions</p>
                  <p style={{fontSize:'18px',fontWeight:600}}>{clientSessions.length}</p>
                </div>
                <div style={{background:'#f9fafb',borderRadius:'8px',padding:'12px'}}>
                  <p style={{fontSize:'11px',color:'#6b7280',marginBottom:'4px'}}>Total time</p>
                  <p style={{fontSize:'18px',fontWeight:600}}>{hours}h {mins}m</p>
                </div>
                <div style={{background:'#f9fafb',borderRadius:'8px',padding:'12px'}}>
                  <p style={{fontSize:'11px',color:'#6b7280',marginBottom:'4px'}}>Total billed</p>
                  <p style={{fontSize:'18px',fontWeight:600}}>${totalBilled.toFixed(0)}</p>
                </div>
                <div style={{background: unbilledValue > 0 ? '#fffbeb' : '#f9fafb',borderRadius:'8px',padding:'12px'}}>
                  <p style={{fontSize:'11px',color:'#6b7280',marginBottom:'4px'}}>Unbilled</p>
                  <p style={{fontSize:'18px',fontWeight:600,color: unbilledValue > 0 ? '#d97706' : 'inherit'}}>
                    ${unbilledValue.toFixed(0)}
                  </p>
                </div>
              </div>

              {client.email && (
                <p style={{fontSize:'13px',color:'#6b7280',borderTop:'1px solid #f3f4f6',paddingTop:'12px'}}>
                  ✉ {client.email}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}