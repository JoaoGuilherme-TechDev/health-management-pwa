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

  // Apenas fazer role-based redirects se estiver autenticado
  if (request.nextUrl.pathname.startsWith("/patient") || request.nextUrl.pathname.startsWith("/admin")) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        const userRole = profile?.role || "patient"

        // Redirecionar admin tentando acessar painel de paciente
        if (userRole === "admin" && request.nextUrl.pathname.startsWith("/patient")) {
          const url = request.nextUrl.clone()
          url.pathname = "/admin"
          return NextResponse.redirect(url)
        }

        // Redirecionar paciente tentando acessar painel admin
        if (userRole === "patient" && request.nextUrl.pathname.startsWith("/admin")) {
          const url = request.nextUrl.clone()
          url.pathname = "/patient"
          return NextResponse.redirect(url)
        }
      }
    } catch (err) {
      // Ignorar erros de sessão - usuário continua logado até pressionar logout
      console.log("[proxy] Erro de sessão ignorado:", err)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
