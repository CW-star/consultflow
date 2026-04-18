import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { client_id, session_ids, tax_rate = 0, notes, due_days = 14 } = await req.json()

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .in('id', session_ids)

    if (!sessions?.length) return NextResponse.json({ error: 'No sessions' }, { status: 400 })

    const subtotal = sessions.reduce((s: number, sess: any) => s + (sess.charge || 0), 0)
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + due_days)

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        client_id,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal,
        tax_rate,
        currency: 'CAD',
        notes,
        status: 'draft',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase
      .from('sessions')
      .update({ invoice_id: invoice.id, is_invoiced: true })
      .in('id', session_ids)

    return NextResponse.json({ invoice })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}