import { db } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("missing stripe secret key, handle it please")
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.error()
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error("missing webhook secret, handle it please")
  }

  const text = await request.text()
  const event = Stripe.webhooks.constructEvent(text, signature, webhookSecret)

  const paymentIsSucessful = event.type === "checkout.session.completed"
  if (paymentIsSucessful) {
    //Atualizar o meu pedido
    db.booking.update({
      where: {
        id: event.data.object.metadata?.bookingId,
      },
      data: {
        status: "CONFIRMED",
      },
    })
  }
}
