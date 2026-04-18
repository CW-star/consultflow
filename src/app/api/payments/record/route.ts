import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invoice_id, amount, payment_date, payment_method, transaction_id, notes } = await req.json()

  const { error } = await supabase.from('payments').insert({
    user_id: user.id,
    invoice_id, amount,
    payment_date: payment_date || new Date().toISOString().split('T')[0],
    payment_method, transaction_id, notes,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Cancel any pending reminders for this invoice
  await supabase.from('reminders')
    .update({ status: 'cancelled' })
    .eq('invoice_id', invoice_id)
    .eq('status', 'scheduled')

  return NextResponse.json({ success: true })
}