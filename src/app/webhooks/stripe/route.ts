import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
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

  switch (event.type) {
    case "checkout.session.completed": {
      const bookingId = event.data.object.metadata?.bookingId

      if (!bookingId) {
        return NextResponse.json({ received: true }, { status: 400 })
      }

      // Atualizar o agendamento para CONFIRMED e PAID
      await db.booking.update({
        where: {
          id: bookingId,
        },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
        },
      })

      revalidatePath("/bookings")
      break
    }

    case "checkout.session.async_payment_failed": {
      const bookingId = event.data.object.metadata?.bookingId
      if (!bookingId) {
        return NextResponse.json({ received: true }, { status: 400 })
      }

      // Atualizar o agendamento para CANCELLED e FAILED
      await db.booking.update({
        where: {
          id: bookingId,
        },
        data: {
          status: "CANCELLED",
          paymentStatus: "FAILED",
        },
      })

      revalidatePath("/bookings")
      break
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
