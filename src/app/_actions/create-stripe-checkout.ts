"use server"

import { BarbershopService } from "@prisma/client"
import Stripe from "stripe"

interface createStripeCheckoutInput {
  products: BarbershopService[]
}

export const createStripeCheckout = async ({
  products,
}: createStripeCheckoutInput) => {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2026-05-27.dahlia" as any,
    })

    //cria uma sessão de checkout
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "boleto", "pix"], //forma de pagamento
      mode: "payment",
      success_url: `${appUrl}/booking/sucess?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/booking/cancel`,
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
    throw new Error("Erro ao criar checkout")
  }
}
