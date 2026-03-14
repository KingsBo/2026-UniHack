import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** Sample report is public; any path under /result/demo is accessible without auth */
const PUBLIC_SAMPLE_REPORT = '/result/demo'
/** Dashboard is currently open for preview/testing; set to true to require auth again */
const DASHBOARD_REQUIRES_AUTH = false

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Sample report: always allow (no auth)
  if (pathname === PUBLIC_SAMPLE_REPORT || pathname.startsWith(`${PUBLIC_SAMPLE_REPORT}/`)) {
    return NextResponse.next()
  }

  // Dashboard: optional auth (off for preview; flip DASHBOARD_REQUIRES_AUTH to protect)
  if (pathname.startsWith('/dashboard')) {
    if (!DASHBOARD_REQUIRES_AUTH) return NextResponse.next()
    const token = request.cookies.get('vc_token')?.value
    if (!token) {
      const loginUrl = new URL('/', request.url)
      loginUrl.hash = 'auth-form'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Other /result/:id pages: require auth
  if (pathname.startsWith('/result/')) {
    const token = request.cookies.get('vc_token')?.value
    if (!token) {
      const loginUrl = new URL('/', request.url)
      loginUrl.hash = 'auth-form'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/result/:path*'],
}
