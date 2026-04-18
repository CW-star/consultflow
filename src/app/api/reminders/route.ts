import { NextRequest, NextResponse } from 'next/server'
import { sendReminderEmail } from '@/lib/email/templates'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await sendReminderEmail(body)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}