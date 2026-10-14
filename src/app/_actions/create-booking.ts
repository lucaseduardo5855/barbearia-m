"use server"

import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { authOptions } from "../_lib/auth"
import { PaymentMethod, Prisma } from "@prisma/client"
import { openingTimeSlots } from "@/lib/opening-hours"
import { z } from "zod"

const schema = z.object({
  serviceId: z.string().min(1, "Serviço inválido"),
  date: z.coerce.date(),
  barberId: z.string().nullable().optional(),
  emailReminderConsent: z.boolean().default(false),
  whatsappReminderConsent: z.boolean().default(false),
  marketingConsent: z.boolean().default(false),
  phone: z.string().optional(),
})
interface CreateBookingParams {
  serviceId: string
  date: Date
  paymentMethod?: PaymentMethod
  barberId?: string | null
  emailReminderConsent?: boolean
  whatsappReminderConsent?: boolean
  marketingConsent?: boolean
  phone?: string
}
export const createBooking = async (params: CreateBookingParams) => {
  const data = schema.parse(params)
  data.date.setSeconds(0, 0)
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) throw new Error("Entre na sua conta para agendar.")
  const phone = data.phone?.replace(/\D/g, "")
  if (
    (data.whatsappReminderConsent || data.marketingConsent) &&
    !/^(55)?\d{10,11}$/.test(phone || "")
  )
    throw new Error("Informe seu WhatsApp com DDD para receber mensagens.")
  if (data.date <= new Date()) throw new Error("Escolha um horário futuro.")
  const service = await db.barbershopService.findUnique({
    where: { id: data.serviceId },
    include: {
      barbershop: {
        select: {
          id: true,
          slug: true,
          openingHours: true,
          barbers: { select: { id: true } },
        },
      },
    },
  })
  if (!service) throw new Error("Serviço não encontrado.")
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(data.date)
  if (
    !openingTimeSlots(data.date, service.barbershop.openingHours).includes(time)
  )
    throw new Error("Este horário está fora do expediente da barbearia.")
  const candidates = service.barbershop.barbers.filter(
    (barber) => !data.barberId || barber.id === data.barberId,
  )
  if (!candidates.length)
    throw new Error("Profissional indisponível nesta barbearia.")
  try {
    const booking = await db.$transaction(
      async (tx) => {
        if (phone) {
          if (!/^(55)?\d{10,11}$/.test(phone))
            throw new Error("Telefone inválido. Informe o DDD.")
          await tx.user.update({ where: { id: userId }, data: { phone } })
        }
        const [occupied, blocked] = await Promise.all([
          tx.booking.findMany({
            where: {
              service: { barbershopId: service.barbershopId },
              date: data.date,
              status: { not: "CANCELLED" },
            },
            select: { barberId: true },
          }),
          tx.blockedTime.findMany({
            where: { barbershopId: service.barbershopId, date: data.date },
            select: { barberId: true },
          }),
        ])
        const busy = [...occupied, ...blocked]
        const available = candidates.find(
          (barber) =>
            !busy.some(
              (entry) => !entry.barberId || entry.barberId === barber.id,
            ),
        )
        if (!available)
          throw new Error(
            "O horário acabou de ser ocupado. Escolha outro horário.",
          )
        return tx.booking.create({
          data: {
            serviceId: service.id,
            date: data.date,
            userId,
            barberId: available.id,
            totalPrice: service.price,
            paymentMethod: "ON_SITE",
            status: "CONFIRMED",
            emailReminderConsent: data.emailReminderConsent,
            whatsappReminderConsent: data.whatsappReminderConsent,
            marketingConsent: data.marketingConsent,
          },
        })
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
    revalidatePath(`/${service.barbershop.slug}`)
    revalidatePath(`/${service.barbershop.slug}/admin`)
    revalidatePath(`/${service.barbershop.slug}/reservas`)
    revalidatePath(`/barbershops/${service.barbershopId}`)
    revalidatePath("/bookings")
    return booking
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new Error(
        "Este telefone já está vinculado a outra conta. Use o telefone da sua conta ou agende sem mensagens no WhatsApp.",
      )
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    )
      throw new Error("O horário acabou de ser ocupado. Escolha outro horário.")
    throw error
  }
}
