import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const twilio = require("twilio")

export async function POST(request: Request) {
  try {
    const { userId, message, phoneNumber, type = "sms" } = await request.json()

    // Verificar variáveis de ambiente Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER
    const twilioWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER

    if (!accountSid || !authToken) {
      console.error("[v0] Twilio não configurado: faltam credenciais")
      return NextResponse.json({ error: "Twilio não configurado" }, { status: 500 })
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: "Número de telefone não fornecido" }, { status: 400 })
    }

    const client = twilio(accountSid, authToken)

    const messageConfig: any = {
      body: message,
      to: phoneNumber,
    }

    if (type === "whatsapp") {
      if (!twilioWhatsApp) {
        console.error("[v0] Número WhatsApp do Twilio não configurado")
        return NextResponse.json({ error: "WhatsApp não configurado" }, { status: 500 })
      }
      messageConfig.from = `whatsapp:${twilioWhatsApp}`
      messageConfig.to = `whatsapp:${phoneNumber}`
    } else {
      if (!twilioPhone) {
        console.error("[v0] Número SMS do Twilio não configurado")
        return NextResponse.json({ error: "SMS não configurado" }, { status: 500 })
      }
      messageConfig.from = twilioPhone
    }

    console.log(`[v0] Enviando ${type} para ${phoneNumber}...`)

    const twilioMessage = await client.messages.create(messageConfig)

    console.log(`[v0] ${type} enviado com sucesso. SID: ${twilioMessage.sid}`)

    // Registrar no banco de dados
    const supabase = await createClient()
    await supabase.from("notifications").insert({
      user_id: userId,
      title: type === "whatsapp" ? "WhatsApp enviado" : "SMS enviado",
      message: message,
      notification_type: type === "whatsapp" ? "whatsapp_sent" : "sms_sent",
      is_read: false,
    })

    return NextResponse.json({
      success: true,
      messageSid: twilioMessage.sid,
      type: type,
    })
  } catch (error: any) {
    console.error("[v0] Erro ao enviar mensagem via Twilio:", error)
    return NextResponse.json({ error: error.message || "Erro ao enviar mensagem" }, { status: 500 })
  }
}
