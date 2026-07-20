import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const FREE_EXPIRY = new Date(process.env.FREE_EXPIRY_DATE || '2027-07-20T00:00:00Z')

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/license-locked']

const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/telegram/', '/api/whatsapp/']

const LICENSE_API_PREFIXES = ['/api/license']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  const isPublicApi = PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))
  const isLicenseApi = LICENSE_API_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isPublicRoute || isPublicApi || isLicenseApi) {
    return NextResponse.next()
  }

  const isExpired = new Date() >= FREE_EXPIRY

  if (isExpired) {
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Access locked. A valid license is required to use this API.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const url = new URL('/license-locked', request.url)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const allCookies = request.cookies.getAll()
  const devSession = request.cookies.get('afcs_dev_session')
  const hasSession = allCookies.some(c => c.name.startsWith('afcs-auth-token')) || devSession

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
