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

    const { data: existingUser, error: getUserError } =
      await supabaseAdmin.auth.admin.getUserById(email)

    if (getUserError && getUserError.message !== "User not found") {
      return NextResponse.json(
        { error: getUserError.message },
        { status: 500 },
      )
    }

    if (existingUser?.user) {
      return NextResponse.json(
        { error: "Este email já está registrado no sistema" },
        { status: 400 },
      )
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
      return NextResponse.json(
        {
          error:
            createError?.message ||
            "Falha ao criar usuário de autenticação (admin)",
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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

