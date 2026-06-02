"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate"

interface CreateBookingParams {
  userId: string
  serviceId: string
  date: Date
}

// Função para criar uma nova reserva (booking) no banco de dados
export const createBooking = async (params: CreateBookingParams) => {
  await db.booking.create({
    data: params,
  })
  revalidatePath("/barbershop/[id]")
}
