"use server"

import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidatePath } from "next/cache"

// Função auxiliar para verificar permissões de dono
async function verifyOwnership(barbershopId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    throw new Error("Usuário não autenticado!")
  }

  const userId = (session.user as any).id
  const barbershop = await db.barbershop.findUnique({
    where: { id: barbershopId },
    select: { ownerId: true, slug: true }
  })

  if (!barbershop || barbershop.ownerId !== userId) {
    throw new Error("Acesso negado! Você não é o proprietário desta barbearia.")
  }

  return barbershop
}

// 1. Cadastrar um Novo Serviço
export async function addServiceAction(params: {
  barbershopId: string
  name: string
  price: number
  description: string
  imageUrl: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const service = await db.barbershopService.create({
    data: {
      name: params.name,
      price: params.price,
      description: params.description,
      imageUrl: params.imageUrl,
      barbershopId: params.barbershopId
    }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return service
}

// 2. Excluir um Serviço
export async function deleteServiceAction(params: {
  barbershopId: string
  serviceId: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  // Primeiro removemos agendamentos atrelados para evitar erros de chave estrangeira (boas práticas SQL)
  await db.booking.deleteMany({
    where: { serviceId: params.serviceId }
  })

  await db.barbershopService.delete({
    where: { id: params.serviceId }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
}

// 3. Cadastrar um Novo Barbeiro (Equipe)
export async function addBarberAction(params: {
  barbershopId: string
  name: string
  imageUrl: string
  email?: string
  phone?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  // Tenta encontrar o usuário correspondente ao e-mail para vincular na hora
  let linkedUserId: string | null = null
  if (params.email) {
    const existingUser = await db.user.findUnique({
      where: { email: params.email }
    })
    if (existingUser) {
      linkedUserId = existingUser.id
    }
  }

  const barber = await db.barber.create({
    data: {
      name: params.name,
      imageUrl: params.imageUrl,
      email: params.email || null,
      phone: params.phone || null,
      barbershopId: params.barbershopId,
      userId: linkedUserId
    }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return barber
}

// 4. Remover um Barbeiro
export async function deleteBarberAction(params: {
  barbershopId: string
  barberId: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  // Remove agendamentos vinculados a esse barbeiro antes
  await db.booking.deleteMany({
    where: { barberId: params.barberId }
  })

  await db.barber.delete({
    where: { id: params.barberId }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
}

// 5. Atualizar Configurações do Estabelecimento
export async function updateBarbershopConfig(params: {
  barbershopId: string
  name: string
  address: string
  phones: string[]
  description: string
  imageUrl: string
  bannerUrl?: string | null
  welcomeMessage?: string | null
  instagramUrl?: string | null
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const updated = await db.barbershop.update({
    where: { id: params.barbershopId },
    data: {
      name: params.name,
      address: params.address,
      phones: params.phones,
      description: params.description,
      imageUrl: params.imageUrl,
      bannerUrl: params.bannerUrl,
      welcomeMessage: params.welcomeMessage,
      instagramUrl: params.instagramUrl
    }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return updated
}

// 6. Atualizar Status e Pagamento de um Agendamento
export async function updateBookingStatusAction(params: {
  barbershopId: string
  bookingId: string
  status: "CONFIRMED" | "CANCELLED" | "DONE"
  paymentStatus?: "PENDING" | "PAID"
}) {
  // Roda a segurança para verificar se o usuário atual é dono da barbearia
  const barbershop = await verifyOwnership(params.barbershopId)

  // Atualiza no banco de dados
  const updatedBooking = await db.booking.update({
    where: { id: params.bookingId },
    data: {
      status: params.status,
      ...(params.paymentStatus ? { paymentStatus: params.paymentStatus } : {})
    }
  })

  // Limpa o cache das páginas do cliente e do admin para atualizar as telas na hora
  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)

  return updatedBooking
}

