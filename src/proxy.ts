import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/api/auth', '/api/telegram/webhook', '/api/telegram/poll', '/api/whatsapp/webhook']

const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/telegram/', '/api/whatsapp/']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/')) ||
    PUBLIC_API_PREFIXES.some(prefix => pathname.startsWith(prefix))

  if (isPublic) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const allCookies = request.cookies.getAll()
  const devSession = request.cookies.get('afcs_dev_session')
  const hasSession = allCookies.some(c => c.name.startsWith('afcs-auth-token')) || devSession

  if (pathname === '/api/cron' || pathname === '/api/automation/engine') {
    return NextResponse.next()
  }

  if (!hasSession && !pathname.startsWith('/_next') && !pathname.startsWith('/images')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

export const proxyConfig = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}
