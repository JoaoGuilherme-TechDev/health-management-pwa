import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Don't call getUser() if we're already on auth pages to avoid redirect loops
  if (
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api")
  ) {
    return supabaseResponse
  }

  // Try to get user, but handle session errors gracefully
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // If session error (expired/invalid), redirect to login
  if (error || !user) {
    if (request.nextUrl.pathname.startsWith("/patient") || request.nextUrl.pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      url.searchParams.set("redirectTo", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // User is authenticated, check role-based access
  if (request.nextUrl.pathname.startsWith("/patient") || request.nextUrl.pathname.startsWith("/admin")) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const userRole = profile?.role || "patient"

    // Redirect admin trying to access patient panel
    if (userRole === "admin" && request.nextUrl.pathname.startsWith("/patient")) {
      const url = request.nextUrl.clone()
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }

    // Redirect patient trying to access admin panel
    if (userRole === "patient" && request.nextUrl.pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone()
      url.pathname = "/patient"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
