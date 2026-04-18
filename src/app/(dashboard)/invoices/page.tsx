import { createClient } from '@supabase/supabase-js'

export default async function InvoicesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: invoices }, { data: clients }, { data: sessions }] = await Promise.all([
    supabase.from('invoices').select('*').order('created_at', { ascending: false }),
    supabase.from('clients').select('*'),
    supabase.from('sessions').select('*').eq('is_invoiced', false),
  ])

  const unbilledByClient = clients?.map(client => {
    const clientSessions = sessions?.filter(s => s.client_id === client.id) ?? []
    const value = clientSessions.reduce((sum, s) => sum + (Number(s.charge) || 0), 0)
    return { ...client, unbilledSessions: clientSessions.length, unbilledValue: value }
  }).filter(c => c.unbilledSessions > 0) ?? []

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'24px',fontWeight:600}}>Invoices</h1>
          <p style={{color:'#6b7280',fontSize:'14px',marginTop:'4px'}}>
            {invoices?.length ?? 0} invoices · {unbilledByClient.length} clients with unbilled work
          </p>
        </div>
      </div>

      {/* Unbilled work alert */}
      {unbilledByClient.length > 0 && (
        <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'12px',padding:'20px',marginBottom:'24px'}}>
          <h2 style={{fontSize:'15px',fontWeight:600,color:'#92400e',marginBottom:'12px'}}>
            ⚠ Unbilled work ready to invoice
          </h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'10px'}}>
            {unbilledByClient.map(client => (
              <div key={client.id} style={{background:'white',borderRadius:'8px',padding:'12px',border:'1px solid #fde68a'}}>
                <p style={{fontWeight:600,fontSize:'14px',marginBottom:'4px'}}>{client.name}</p>
                <p style={{fontSize:'13px',color:'#6b7280'}}>
                  {client.unbilledSessions} sessions · ${client.unbilledValue.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invoices list */}
      {invoices && invoices.length > 0 ? (
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:'12px',overflow:'hidden'}}>
          <table style={{width:'100%',fontSize:'14px',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
                <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Invoice #</th>
                <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Client</th>
                <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Issued</th>
                <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Due</th>
                <th style={{textAlign:'right',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Amount</th>
                <th style={{textAlign:'left',padding:'12px 16px',color:'#6b7280',fontWeight:500}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const statusColors: Record<string, {bg:string,text:string}> = {
                  paid: {bg:'#dcfce7',text:'#166534'},
                  sent: {bg:'#dbeafe',text:'#1e40af'},
                  overdue: {bg:'#fee2e2',text:'#991b1b'},
                  draft: {bg:'#f3f4f6',text:'#374151'},
                  partial: {bg:'#fef3c7',text:'#92400e'},
                }
                const color = statusColors[inv.status] ?? statusColors.draft
                return (
                  <tr key={inv.id} style={{borderBottom:'1px solid #f3f4f6',background:i%2===0?'white':'#fafafa'}}>
                    <td style={{padding:'12px 16px',fontWeight:500,color:'#1e40af'}}>{inv.invoice_number}</td>
                    <td style={{padding:'12px 16px'}}>{clients?.find(c=>c.id===inv.client_id)?.name}</td>
                    <td style={{padding:'12px 16px',color:'#6b7280'}}>{inv.issue_date}</td>
                    <td style={{padding:'12px 16px',color:'#6b7280'}}>{inv.due_date}</td>
                    <td style={{padding:'12px 16px',textAlign:'right',fontWeight:500}}>${Number(inv.total_amount).toFixed(2)}</td>
                    <td style={{padding:'12px 16px'}}>
                      <span style={{background:color.bg,color:color.text,padding:'2px 10px',borderRadius:'999px',fontSize:'12px'}}>
                        {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'48px',textAlign:'center'}}>
          <p style={{fontSize:'16px',color:'#6b7280',marginBottom:'8px'}}>No invoices yet</p>
          <p style={{fontSize:'14px',color:'#9ca3af'}}>Unbilled sessions are ready to invoice above</p>
        </div>
      )}
    </div>
  )
}
