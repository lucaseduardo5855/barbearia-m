"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { verifyOwnership } from "./ownership"
import { bookingAmounts, parseStoredItems } from "@/lib/financial-summary"
import { Prisma } from "@prisma/client"
import { productData } from "@/lib/product-schema"
import { validateMoney } from "@/lib/money"

export async function addBookingProductAction(params: {
  barbershopId: string
  bookingId: string
  productId: string
}) {
  const shop = await verifyOwnership(params.barbershopId)
  const updated = await db.$transaction(
    async (tx) => {
      const booking = await tx.booking.findFirst({
        where: {
          id: params.bookingId,
          service: { barbershopId: params.barbershopId },
        },
        include: { service: true, barber: true, user: true },
      })
      if (
        !booking ||
        booking.status === "DONE" ||
        booking.status === "CANCELLED"
      )
        throw new Error("Esta comanda não pode receber produtos.")
      const product = await tx.product.findFirst({
        where: { id: params.productId, barbershopId: params.barbershopId },
      })
      if (!product) throw new Error("Produto não encontrado.")
      const stock = await tx.product.updateMany({
        where: { id: product.id, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      })
      if (!stock.count)
        throw new Error(
          "Produto sem estoque. Atualize o estoque antes de vender.",
        )
      const extras = [
        ...parseStoredItems(booking.extraProducts),
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
        },
      ]
      const total = bookingAmounts(booking).total + Number(product.price)
      validateMoney(total, "Total da comanda")
      const rate = booking.barberId
        ? Number(booking.barber?.commissionRate ?? 0)
        : 0
      await tx.productSale.create({
        data: {
          barbershopId: params.barbershopId,
          productId: product.id,
          productName: product.name,
          barberId: booking.barberId,
          clientName: booking.user.name || "Cliente",
          bookingId: booking.id,
          quantity: 1,
          unitPrice: product.price,
          totalAmount: product.price,
          commissionAmount: (Number(product.price) * rate) / 100,
        },
      })
      return tx.booking.update({
        where: { id: booking.id },
        data: {
          extraProducts: JSON.stringify(extras),
          totalPrice: total,
          barberCommissionAmount: (total * rate) / 100,
        },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
  revalidatePath(`/${shop.slug}/admin`)
  return updated
}

export async function addProductAction(params: {
  barbershopId: string
  name: string
  price: number
  costPrice?: number
  stock: number
  minStock?: number
  brand?: string
  category?: string
  imageUrl?: string
  description?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const product = await db.product.create({
    data: {
      barbershopId: params.barbershopId,
      ...productData(params),
    },
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return product
}

export async function updateProductAction(params: {
  barbershopId: string
  productId: string
  name: string
  price: number
  costPrice?: number
  stock: number
  minStock?: number
  brand?: string
  category?: string
  imageUrl?: string
  description?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const updated = await db.product.update({
    where: { id: params.productId, barbershopId: params.barbershopId },
    data: {
      ...productData(params),
    },
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return updated
}

export async function deleteProductAction(params: {
  barbershopId: string
  productId: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  await db.product.delete({
    where: { id: params.productId, barbershopId: params.barbershopId },
  })

  revalidatePath(`/${barbershop.slug}/admin`)
}

export async function createProductSaleAction(params: {
  barbershopId: string
  productId: string
  barberId?: string | null
  clientName?: string
  quantity: number
  unitPrice: number
  date?: Date | string
  bookingId?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)
  validateMoney(params.unitPrice, "Preço de venda", true)

  const product = await db.product.findFirst({
    where: { id: params.productId, barbershopId: params.barbershopId },
  })
  if (!product) {
    throw new Error("Produto não encontrado.")
  }

  const quantity = params.quantity
  if (!Number.isInteger(quantity) || quantity < 1)
    throw new Error("Informe uma quantidade inteira maior que zero.")
  if (!Number.isFinite(params.unitPrice) || params.unitPrice < 0)
    throw new Error("Informe um preço válido.")
  const totalAmount = params.unitPrice * quantity
  validateMoney(totalAmount, "Total da venda")
  const barber = params.barberId
    ? await db.barber.findFirst({
        where: { id: params.barberId, barbershopId: params.barbershopId },
      })
    : null
  if (params.barberId && !barber)
    throw new Error("Profissional não encontrado nesta unidade.")
  if (params.bookingId) {
    const booking = await db.booking.findFirst({
      where: {
        id: params.bookingId,
        service: { barbershopId: params.barbershopId },
      },
    })
    if (!booking) throw new Error("Comanda não encontrada nesta unidade.")
  }
  const commissionAmount = barber
    ? (totalAmount * Number(barber.commissionRate ?? 0)) / 100
    : 0
  const sale = await db.$transaction(async (tx) => {
    const stock = await tx.product.updateMany({
      where: { id: product.id, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    })
    if (!stock.count)
      throw new Error(
        "Estoque insuficiente. Atualize o estoque antes de vender.",
      )
    return tx.productSale.create({
      data: {
        barbershopId: params.barbershopId,
        productId: product.id,
        productName: product.name,
        barberId: params.barberId || null,
        clientName: params.clientName || "Cliente",
        quantity,
        unitPrice: params.unitPrice,
        totalAmount,
        commissionAmount,
        date: params.date ? new Date(params.date) : new Date(),
        bookingId: params.bookingId || null,
      },
    })
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return sale
}
