import { NextResponse } from "next/server"
import { db } from "@/lib/prisma"
import { Resend } from "resend"

export const dynamic = "force-dynamic"

export async function GET() {
  // Instanciamos o Resend passando a nossa chave de API apenas quando a rota for chamada
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    // 1. Calculamos o período de "Amanhã" (das 00:00:00 às 23:59:59)
    const amanhaInicio = new Date()
    amanhaInicio.setDate(amanhaInicio.getDate() + 1)
    amanhaInicio.setHours(0, 0, 0, 0)

    const amanhaFim = new Date(amanhaInicio)
    amanhaFim.setHours(23, 59, 59, 999)

    // 2. Buscamos no banco os agendamentos confirmados de amanhã
    const bookings = await db.booking.findMany({
      where: {
        status: "CONFIRMED",
        date: {
          gte: amanhaInicio,
          lte: amanhaFim,
        },
      },
      include: {
        user: true,
        barber: true,
        service: {
          include: {
            barbershop: true,
          },
        },
      },
    })

    if (bookings.length === 0) {
      return NextResponse.json({
        message: "Nenhum agendamento para amanhã."
      })
    }

    // 3. Mapeamos os agendamentos para criar uma fila de disparos de e-mail
    const emailPromises = bookings.map(async (booking) => {
      if (!booking.user.email) return

      const formattedTime = new Date(booking.date).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })

      // Chamado oficial do Resend para envio do e-mail em formato HTML
      return resend.emails.send({
        from: "Barbearia <onboarding@resend.dev>",
        to: booking.user.email,
        subject: `Lembrete: Seu horário na ${booking.service.barbershop.name}`,
        html: `
          <div style="font-family: sans-serif; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #4f46e5; margin-top: 0;">Olá, ${booking.user.name || "Cliente"}!</h2>
            <p>Passando para lembrar que você tem um horário agendado amanhã na <strong>${booking.service.barbershop.name}</strong>.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="margin-bottom: 5px;"><strong>Detalhes do seu agendamento:</strong></p>
            <ul style="padding-left: 20px; line-height: 1.6;">
              <li><strong>Serviço:</strong> ${booking.service.name}</li>
              <li><strong>Horário:</strong> ${formattedTime}</li>
              <li><strong>Profissional:</strong> ${booking.barber?.name || "Qualquer Profissional"}</li>
              <li><strong>Preço:</strong> R$ ${Number(booking.service.price).toFixed(2)}</li>
            </ul>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280; margin-bottom: 0;">
              Se precisar alterar ou cancelar o horário, acesse o nosso aplicativo com antecedência. Agradecemos a preferência!
            </p>
          </div>
        `
      })
    })

    // 4. Executa todos os disparos em paralelo no Node.js
    await Promise.all(emailPromises)

    return NextResponse.json({
      success: true,
      message: `${bookings.length} e-mail(s) de lembrete enviado(s) com sucesso!`
    })
  } catch (error: any) {
    console.error("Erro no cron de lembretes:", error)
    return NextResponse.json(
      { error: "Erro interno ao processar lembretes por e-mail." },
      { status: 500 }
    )
  }
}