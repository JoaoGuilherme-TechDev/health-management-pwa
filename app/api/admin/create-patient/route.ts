import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password } = body ?? {}

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: "patient",
        },
      })

    if (createError || !created?.user) {
      const message = createError?.message ?? ""
      if (
        message.includes("already registered") ||
        message.toLowerCase().includes("duplicate key")
      ) {
        return NextResponse.json(
          { error: "Este email já está registrado no sistema" },
          { status: 400 },
        )
      }
      return NextResponse.json(
        {
          error:
            message || "Falha ao criar usuário de autenticação (admin)",
        },
        { status: 500 },
      )
    }

    const user = created.user

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: "patient",
      },
      { onConflict: "id" },
    )

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message || "Falha ao criar perfil do paciente" },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email,
          firstName,
          lastName,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] create-patient admin error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    )
  }
}

