import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/content/') || pathname.startsWith('/pdfs/')) {
    const accessCookie = request.cookies.get('cm_access')
    if (!accessCookie) {
      const loginUrl = new URL('/auth/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/content/:path*', '/pdfs/:path*'],
}
