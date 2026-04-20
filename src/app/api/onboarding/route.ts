import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { slug, name, email, phone, company, currency, notes,
            project_description, budget_range, how_did_you_hear, preferred_contact } = body

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    }

    // Get onboarding link
    const linkRes = await fetch(
      `${url}/rest/v1/onboarding_links?slug=eq.${slug}&is_active=eq.true&select=*`,
      { headers }
    )
    const links = await linkRes.json()
    if (!links.length) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
    const link = links[0]

    // Check if client already exists
    const existRes = await fetch(
      `${url}/rest/v1/clients?user_id=eq.${link.user_id}&email=eq.${email}&select=id`,
      { headers }
    )
    const existing = await existRes.json()
    if (existing.length > 0) {
      return NextResponse.json({ error: 'A client with this email already exists.' }, { status: 409 })
    }

    // Build notes
    const notesFull = [
      notes,
      project_description ? `Project: ${project_description}` : '',
      budget_range ? `Budget: ${budget_range}` : '',
      how_did_you_hear ? `Source: ${how_did_you_hear}` : '',
      preferred_contact ? `Preferred contact: ${preferred_contact}` : '',
    ].filter(Boolean).join('\n')

    // Create client
    const createRes = await fetch(`${url}/rest/v1/clients`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        user_id: link.user_id,
        name,
        email,
        phone: phone || null,
        company: company || null,
        currency: currency || 'CAD',
        notes: notesFull || null,
        payment_terms_days: 14,
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.json()
      return NextResponse.json({ error: err.message || 'Failed to create client' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}