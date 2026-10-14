"use server"

import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidatePath } from "next/cache"

export const deleteBooking = async (bookingId: string) => {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    throw new Error("Usuário não autenticado!")
  }

  const userId = (session.user as any).id

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: {
        select: {
          barbershop: {
            select: { ownerId: true }
          }
        }
      }
    }
  })

  if (!booking) {
    throw new Error("Agendamento não encontrado.")
  }

  const isCustomer = booking.userId === userId
  const isOwner = booking.service.barbershop.ownerId === userId

  if (!isCustomer && !isOwner) {
    throw new Error("Acesso negado! Você não tem permissão para cancelar este agendamento.")
  }

  await db.booking.delete({
    where: {
      id: bookingId,
    },
  })
  revalidatePath("/bookings")
}

