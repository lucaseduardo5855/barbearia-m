"use server"

import { BarbershopService } from "@prisma/client"
import Stripe from "stripe"

interface createStripeCheckoutInput {
  bookingId: string
  products: BarbershopService[]
}

export const createStripeCheckout = async ({
  bookingId,
  products,
}: createStripeCheckoutInput) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

    //cria uma sessão de checkout
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], //forma de pagamento
      mode: "payment",
      success_url: `${appUrl}/bookings`,
      cancel_url: `${appUrl}`,
      metadata: {
        bookingId,
      },
      line_items: products.map((product) => ({
        price_data: {
          currency: "brl",
          product_data: {
            name: product.name,
            images: [product.imageUrl],
          },
          unit_amount: Number(product.price) * 100,
        },
        quantity: 1,
      })),
    })

    return session.url
  } catch (error) {
    console.error("Erro no Stripe Checkout Session:", error)
    throw new Error("Erro ao criar checkout")
  }
}
