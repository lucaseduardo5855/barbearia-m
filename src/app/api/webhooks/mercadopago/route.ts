import { NextResponse } from "next/server"
import { db } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    // 1. Captura os parâmetros enviados pelo Mercado Pago.
    // O Mercado Pago pode enviar dados tanto na query string quanto no corpo da requisição (JSON).
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get("topic") || searchParams.get("type")
    const id = searchParams.get("id") || searchParams.get("data.id")

    // Tenta ler o corpo da requisição caso as informações venham no JSON
    let body: any = {}
    try {
      body = await request.json()
    } catch (e) {
      // Corpo vazio ou não-JSON
    }

    // Identifica o ID do pagamento e a ação
    const paymentId = id || body?.data?.id || body?.id
    const action = topic || body?.action || body?.type

    // Se não houver ID ou se a ação não for relacionada a pagamentos, respondemos sucesso (200) para o Mercado Pago parar de reenviar
    if (!paymentId || (action !== "payment" && action !== "payment.created" && action !== "payment.updated")) {
      return NextResponse.json({ received: true })
    }

    // Chama a função que consulta a API e atualiza a barbearia no banco de dados
    return await handlePaymentUpdate(paymentId)
  } catch (error: any) {
    console.error("Erro no Webhook do Mercado Pago:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handlePaymentUpdate(paymentId: string) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  
  // 2. Consulta o status real do pagamento diretamente no Mercado Pago.
  // Isso evita fraudes (evita que alguém envie dados falsos simulando um pagamento aprovado).
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    console.error(`Erro ao consultar pagamento ${paymentId}:`, await response.text())
    return NextResponse.json({ error: "Erro ao consultar pagamento no Mercado Pago" }, { status: 400 })
  }

  const paymentData = await response.json()

  // 3. Se o status for "approved" e contiver o external_reference (nosso barbershopId)
  if (paymentData.status === "approved" && paymentData.external_reference) {
    const barbershopId = paymentData.external_reference

    // Define uma validade de 30 dias para a assinatura a partir de hoje
    const nextExpiration = new Date()
    nextExpiration.setDate(nextExpiration.getDate() + 30)

    // 4. Atualiza a barbearia no banco de dados
    await db.barbershop.update({
      where: { id: barbershopId },
      data: {
        subscriptionActive: true,
        trialEndsAt: nextExpiration, // estende a vigência por 30 dias
      },
    })

    console.log(`[Webhook] Assinatura da barbearia ID ${barbershopId} ativada com sucesso!`)
  }

  return NextResponse.json({ received: true })
}
