import { NextResponse } from "next/server"
import { authAdapter } from "@/lib/auth-local"
import { pool } from "@/lib/db"

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

    // 1. Create User in auth.users (without session)
    // We use createUser to avoid overwriting the admin's session
    const { user, error: createError } = await authAdapter.createUser(email, password, {
        first_name: firstName,
        last_name: lastName,
        role: "patient",
    });

    if (createError) {
      if (createError.message.includes("already exists")) {
        return NextResponse.json(
          { error: "Este email já está registrado no sistema" },
          { status: 400 },
        )
      }
      return NextResponse.json(
        { error: createError.message || "Falha ao criar usuário" },
        { status: 500 },
      )
    }

    if (!user) {
        return NextResponse.json({ error: "Falha inesperada na criação" }, { status: 500 });
    }

    // 2. Update Profile (created by trigger, or we ensure it exists)
    // We'll do an UPSERT just to be safe and ensure fields are set
    try {
        await pool.query(
            `INSERT INTO public.profiles (id, email, first_name, last_name, role)
             VALUES ($1, $2, $3, $4, 'patient')
             ON CONFLICT (id) DO UPDATE SET
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             role = EXCLUDED.role`,
            [user.id, email, firstName, lastName]
        );
    } catch (profileError: any) {
        console.error("Profile update error:", profileError);
        return NextResponse.json(
            { error: "Usuário criado, mas falha ao atualizar perfil: " + profileError.message },
            { status: 500 }
        );
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
  } catch (error: any) {
    console.error("Create patient error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
