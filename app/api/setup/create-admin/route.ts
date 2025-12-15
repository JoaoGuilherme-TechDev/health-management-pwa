import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: existingAdmin } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1)

    if (existingAdmin && existingAdmin.length > 0) {
      return Response.json({ error: "Admin já existe" }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: "admin@example.com",
      password: "Admin123456!",
      options: {
        data: {
          first_name: "Admin",
          last_name: "Sistema",
          role: "admin",
        },
        emailRedirectTo: undefined,
      },
    })

    if (authError || !authData.user) {
      console.error("[v0] Erro ao criar usuário:", authError)
      return Response.json({ error: authError?.message || "Falha ao criar usuário admin" }, { status: 400 })
    }

    console.log("[v0] Usuário criado com ID:", authData.user.id)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "admin", first_name: "Admin", last_name: "Sistema" })
      .eq("id", authData.user.id)

    if (updateError) {
      console.error("[v0] Erro ao atualizar perfil:", updateError)
      return Response.json({ error: `Falha ao atualizar perfil: ${updateError.message}` }, { status: 400 })
    }

    const { data: verifyProfile } = await supabase.from("profiles").select("role").eq("id", authData.user.id).single()

    console.log("[v0] Perfil verificado:", verifyProfile)

    return Response.json({
      success: true,
      message: "Usuário admin criado com sucesso",
      email: "admin@example.com",
      password: "Admin123456!",
      profile: verifyProfile,
    })
  } catch (error) {
    console.error("[v0] Erro geral:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Erro desconhecido" }, { status: 500 })
  }
}
