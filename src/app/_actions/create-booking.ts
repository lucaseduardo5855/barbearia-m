"use server"

import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate"
import { authOptions } from "../_lib/auth"
import { PaymentMethod } from "@prisma/client"

interface CreateBookingParams {
  serviceId: string
  date: Date
  paymentMethod?: PaymentMethod
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
    data: {
      serviceId: params.serviceId,
      date: params.date,
      userId: (user.user as any).id,
      paymentMethod: params.paymentMethod || "ON_SITE",
      // Se for pagamento ONLINE, criamos com status PENDING até que o Stripe confirme.
      // Se for ON_SITE (no local), criamos como CONFIRMED direto.
      status: params.paymentMethod === "ONLINE" ? "PENDING" : "CONFIRMED",
    },
  })
  // revalidar a página da barbearia específica para atualizar SSR
  revalidatePath(`/barbershops/${service.barbershopId}`)
  revalidatePath("/bookings")
}
