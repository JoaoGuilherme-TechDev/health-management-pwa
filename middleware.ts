import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'your-secret-key-at-least-32-chars-long'
const key = new TextEncoder().encode(SECRET_KEY)

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('session')?.value

  let user: any = null
  
  if (token) {
    try {
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['HS256'],
      })
      user = payload
    } catch (err) {
      // Invalid token, treat as logged out
    }
  }

  const { pathname } = request.nextUrl

  // Allow access to auth routes and API auth routes
  if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
    // Optional: If already logged in, could redirect to dashboard
    // For now, let them access login page
    return NextResponse.next()
  }

  // Check for protected routes
  const isProtectedRoute = pathname.startsWith('/patient') || pathname.startsWith('/admin')

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Role-based access control
  if (user) {
    const userRole = user.role || 'patient'

    // Admin trying to access patient dashboard
    if (pathname.startsWith('/patient') && userRole === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // Patient trying to access admin dashboard
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/patient'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
