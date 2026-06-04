"use server"

import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate"
import { authOptions } from "../_lib/auth"

interface CreateBookingParams {
  serviceId: string
  date: Date
}

// Função para criar uma nova reserva (booking) no banco de dados
export const createBooking = async (params: CreateBookingParams) => {
  const user = await getServerSession(authOptions)
  if (!user) {
    throw new Error("Usuário não autenticado!")
  }
  // validações
  if (!params.serviceId) {
    throw new Error("Serviço inválido")
  }

  const service = await db.barbershopService.findUnique({
    where: { id: params.serviceId },
  })

  if (!service) {
    throw new Error("Serviço não encontrado para agendamento")
  }

  if (new Date(params.date) <= new Date()) {
    throw new Error("Não é possível agendar em data passada")
  }

  await db.booking.create({
    data: { ...params, userId: (user.user as any).id },
  })
  // revalidar a página da barbearia específica para atualizar SSR
  revalidatePath(`/barbershops/${service.barbershopId}`)
  revalidatePath("/bookings")
}
