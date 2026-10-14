"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { verifyOwnership } from "./ownership"

export async function updateBookingStatusAction(params: {
  barbershopId: string
  bookingId: string
  status: "CONFIRMED" | "CANCELLED" | "DONE"
  paymentStatus?: "PENDING" | "PAID"
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const existingBooking = await db.booking.findFirst({
    where: {
      id: params.bookingId,
      service: { barbershopId: params.barbershopId },
    },
  })
  if (!existingBooking) {
    throw new Error("Agendamento não encontrado nesta barbearia.")
  }

  const updatedBooking = await db.booking.update({
    where: { id: params.bookingId },
    data: {
      status: params.status,
      completedAt:
        params.status === "DONE"
          ? (existingBooking.completedAt ?? new Date())
          : null,
      ...(params.paymentStatus ? { paymentStatus: params.paymentStatus } : {}),
    },
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  revalidatePath(`/${barbershop.slug}/reservas`)
  revalidatePath("/bookings")

  return updatedBooking
}

export async function createAdminBookingAction(params: {
  barbershopId: string
  barberId?: string
  serviceId: string
  date: Date | string
  clientName: string
  clientPhone?: string
  bookingType?: "PADRAO" | "ENCAIXE"
  notes?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const service = await db.barbershopService.findFirst({
    where: { id: params.serviceId, barbershopId: params.barbershopId },
  })
  if (!service) {
    throw new Error("Serviço selecionado não existe.")
  }

  // Tenta encontrar ou criar o usuário cliente pelo telefone/nome
  let targetUser = null
  const cleanPhone = params.clientPhone
    ? params.clientPhone.replace(/\D/g, "")
    : null

  if (cleanPhone) {
    targetUser = await db.user.findFirst({
      where: { phone: cleanPhone },
    })
  }

  if (!targetUser) {
    targetUser = await db.user.create({
      data: {
        name: params.clientName || "Cliente Balcão",
        phone: cleanPhone || `manual_${Date.now()}`,
        role: "CLIENT",
      },
    })
  }

  // Gera número da comanda de 7 dígitos aleatórios
  const orderNumber = String(Math.floor(1000000 + Math.random() * 9000000))

  const newBooking = await db.booking.create({
    data: {
      serviceId: params.serviceId,
      barberId: params.barberId || null,
      userId: targetUser.id,
      date: new Date(params.date),
      bookingType: params.bookingType || "PADRAO",
      orderNumber,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      paymentMethod: "ON_SITE",
      totalPrice: service.price,
    },
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return newBooking
}

export async function updateBookingDetailsAction(params: {
  barbershopId: string
  bookingId: string
  barberId?: string | null
  status?: "CONFIRMED" | "CANCELLED" | "DONE"
  extraServices?: { id: string; name: string; price: number }[]
  extraProducts?: {
    id: string
    name: string
    price: number
    quantity: number
  }[]
  barberCommissionAmount?: number
  totalPrice?: number
  paymentStatus?: "PENDING" | "PAID"
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const existingBooking = await db.booking.findFirst({
    where: {
      id: params.bookingId,
      service: { barbershopId: params.barbershopId },
    },
    include: { service: true, barber: true },
  })
  if (!existingBooking) {
    throw new Error("Agendamento não encontrado.")
  }

  const assignedBarber = params.barberId
    ? await db.barber.findFirst({
        where: { id: params.barberId, barbershopId: params.barbershopId },
      })
    : null
  if (params.barberId && !assignedBarber)
    throw new Error("Profissional não encontrado nesta barbearia.")
  const assignedCommission =
    params.barberId !== undefined
      ? (Number(existingBooking.totalPrice ?? existingBooking.service.price) *
          Number(assignedBarber?.commissionRate ?? 0)) /
        100
      : undefined

  const updatedBooking = await db.booking.update({
    where: { id: params.bookingId },
    data: {
      ...(params.barberId !== undefined
        ? {
            barberId: params.barberId,
            barberCommissionAmount: assignedCommission,
          }
        : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.status
        ? {
            completedAt:
              params.status === "DONE"
                ? (existingBooking.completedAt ?? new Date())
                : null,
          }
        : {}),
      ...(params.paymentStatus ? { paymentStatus: params.paymentStatus } : {}),
      ...(params.extraServices !== undefined
        ? { extraServices: JSON.stringify(params.extraServices) }
        : {}),
      ...(params.extraProducts !== undefined
        ? { extraProducts: JSON.stringify(params.extraProducts) }
        : {}),
      ...(params.barberCommissionAmount !== undefined
        ? { barberCommissionAmount: params.barberCommissionAmount }
        : {}),
      ...(params.totalPrice !== undefined
        ? { totalPrice: params.totalPrice }
        : {}),
    },
    include: { barber: true },
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  revalidatePath(`/${barbershop.slug}/reservas`)
  revalidatePath("/bookings")
  return updatedBooking
}

export async function createBlockedTimeAction(params: {
  barbershopId: string
  barberId?: string | null
  date: Date | string
  reason?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const blocked = await db.blockedTime.create({
    data: {
      barbershopId: params.barbershopId,
      barberId: params.barberId || null,
      date: new Date(params.date),
      reason: params.reason || "Horário Bloqueado",
    },
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return blocked
}

export async function deleteBlockedTimeAction(params: {
  barbershopId: string
  blockedTimeId: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  await db.blockedTime.delete({
    where: { id: params.blockedTimeId, barbershopId: params.barbershopId },
  })

  revalidatePath(`/${barbershop.slug}/admin`)
}
