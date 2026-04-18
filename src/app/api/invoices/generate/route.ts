import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/invoices/InvoicePDF'
import { createElement } from 'react'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { client_id, session_ids, tax_rate = 0, notes, due_days = 14 } = await req.json()

  // Fetch sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .in('id', session_ids)
    .eq('user_id', user.id)

  if (!sessions?.length) return NextResponse.json({ error: 'No sessions found' }, { status: 400 })

  // Fetch client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', client_id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const subtotal = sessions.reduce((s, sess) => s + (sess.charge || 0), 0)
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + due_days)

  // Create invoice record
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      user_id: user.id,
      client_id,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal,
      tax_rate,
      currency: client.currency,
      notes,
      status: 'draft',
    })
    .select()
    .single()

  if (error || !invoice) return NextResponse.json({ error: error?.message }, { status: 500 })

  // Link sessions to invoice
  await supabase
    .from('sessions')
    .update({ invoice_id: invoice.id, is_invoiced: true })
    .in('id', session_ids)

  // Generate PDF
  const pdf = await renderToBuffer(
    createElement(InvoicePDF, { invoice, client, sessions, consultant: 'Your Name' })
  )

  // Upload to Supabase Storage
  const filePath = `${user.id}/${invoice.invoice_number}.pdf`
  await supabase.storage.from('invoices').upload(filePath, pdf, {
    contentType: 'application/pdf',
    upsert: true,
  })

  const { data: { signedUrl } } = await supabase.storage
    .from('invoices')
    .createSignedUrl(filePath, 60 * 60 * 24 * 30) // 30 days

  // Save PDF URL to invoice
  await supabase.from('invoices').update({ pdf_url: signedUrl }).eq('id', invoice.id)

  // Schedule reminders
  const reminderDays = [3, 7, 14, 30]
  const reminderTypes = ['day3', 'day7', 'day14', 'day30']
  await supabase.from('reminders').insert(
    reminderDays.map((days, i) => ({
      user_id: user.id,
      invoice_id: invoice.id,
      type: reminderTypes[i],
      scheduled_for: new Date(dueDate.getTime() + days * 86400000).toISOString(),
      status: 'scheduled',
    }))
  )

  return NextResponse.json({ invoice, pdf_url: signedUrl })
}