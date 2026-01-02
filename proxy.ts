import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // Refresh session if needed
  const { data: { session } } = await supabase.auth.getSession()

  // If no session and trying to access protected routes, redirect to login
  if (!session && (request.nextUrl.pathname.startsWith("/patient") || request.nextUrl.pathname.startsWith("/admin"))) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    url.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If session exists, check role-based access
  if (session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    const userRole = profile?.role || "patient"

    // ✅ FIX: Always allow admin to access /admin routes (including patient details)
    if (userRole === "admin" && request.nextUrl.pathname.startsWith("/admin")) {
      return response // Allow access to all admin routes
    }

    // Redirect patient trying to access admin routes
    if (userRole === "patient" && request.nextUrl.pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone()
      url.pathname = "/patient"
      return NextResponse.redirect(url)
    }

    // Redirect admin trying to access patient routes
    if (userRole === "admin" && request.nextUrl.pathname.startsWith("/patient")) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
