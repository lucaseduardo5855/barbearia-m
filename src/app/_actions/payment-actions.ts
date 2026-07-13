"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"

export async function createPixPaymentAction(barbershopId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    throw new Error("Usuário não autenticado!")
  }

  const user = session.user

  // Utiliza o e-mail do comprador de testes do Mercado Pago se configurado, senão usa o do usuário logado
  let email = process.env.MERCADO_PAGO_TEST_BUYER_EMAIL || user.email || "contato@barbeariasaas.com"
  if (email && !email.includes("@")) {
    email = `${email}@testuser.com`
  }

  const name = user.name || "Cliente"
  const nameParts = name.split(" ")
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(" ") || "SaaS"

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error("Token de acesso do Mercado Pago não configurado!")
  }

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `sub_${barbershopId}_${Date.now()}`,
    },
    body: JSON.stringify({
      transaction_amount: 49.90,
      description: `Assinatura Mensal - Barbearia`,
      payment_method_id: "pix",
      external_reference: barbershopId,
      payer: {
        email: email,
        first_name: firstName,
        last_name: lastName,
      },
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    console.error("Erro no Mercado Pago:", errorData)
    throw new Error("Erro ao gerar o pagamento Pix. Tente novamente.")
  }

  const data = await response.json()

  return {
    id: data.id,
    qrCode: data.point_of_interaction.transaction_data.qr_code,
    qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64,
  }
}
