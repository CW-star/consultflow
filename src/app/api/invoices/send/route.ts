import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendInvoiceEmail } from '@/lib/email/templates'
import { formatDate } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invoice_id } = await req.json()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', invoice_id)
    .single()

  if (!invoice?.clients?.email)
    return NextResponse.json({ error: 'Client has no email address' }, { status: 400 })

  await sendInvoiceEmail({
    to: invoice.clients.email,
    clientName: invoice.clients.name,
    invoiceNumber: invoice.invoice_number,
    amount: invoice.total_amount,
    dueDate: formatDate(invoice.due_date),
    pdfUrl: invoice.pdf_url,
    currency: invoice.currency,
  })

  await supabase.from('invoices').update({
    status: 'sent',
    sent_at: new Date().toISOString(),
  }).eq('id', invoice_id)

  return NextResponse.json({ success: true })
}