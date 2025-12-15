import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { userId, message, phoneNumber } = await request.json()

    // Verificar variáveis de ambiente Z-API
    const instanceId = process.env.ZAPI_INSTANCE_ID
    const token = process.env.ZAPI_TOKEN

    if (!instanceId || !token) {
      console.error("[v0] Z-API não configurada: faltam credenciais")
      return NextResponse.json({ error: "Z-API não configurada" }, { status: 500 })
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: "Número de telefone não fornecido" }, { status: 400 })
    }

    // Formatar número para Z-API (sem +, sem espaços, apenas números)
    // Exemplo: +55 11 99999-9999 vira 5511999999999
    const formattedPhone = phoneNumber.replace(/\D/g, "")

    console.log(`[v0] Enviando WhatsApp via Z-API para ${formattedPhone}...`)

    // Enviar mensagem via Z-API
    const zapiResponse = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
      }),
    })

    if (!zapiResponse.ok) {
      const errorText = await zapiResponse.text()
      console.error(`[v0] Erro Z-API: ${zapiResponse.status} - ${errorText}`)
      return NextResponse.json({ error: `Erro ao enviar via Z-API: ${errorText}` }, { status: zapiResponse.status })
    }

    const zapiData = await zapiResponse.json()
    console.log(`[v0] WhatsApp enviado com sucesso. Z-API ID: ${zapiData.zaapId}`)

    // Registrar no banco de dados
    const supabase = await createClient()
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "WhatsApp enviado",
      message: message,
      notification_type: "whatsapp_sent",
      is_read: false,
    })

    return NextResponse.json({
      success: true,
      zaapId: zapiData.zaapId,
      messageId: zapiData.messageId,
      type: "whatsapp",
    })
  } catch (error: any) {
    console.error("[v0] Erro ao enviar mensagem via Z-API:", error)
    return NextResponse.json({ error: error.message || "Erro ao enviar mensagem" }, { status: 500 })
  }
}
