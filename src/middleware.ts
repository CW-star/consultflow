import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — no auth needed
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon')

  if (isPublic) return NextResponse.next()

  // Check for Supabase session cookie
  const hasSession =
    request.cookies.get('sb-ctudpjtlngbymimlecje-auth-token') ||
    request.cookies.getAll().some(c => c.name.includes('sb-') && c.name.includes('-auth-token'))

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}