"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { verifyOwnership } from "./ownership"
import { validateMoney } from "@/lib/money"

export async function addServiceAction(params: {
  barbershopId: string
  name: string
  price: number
  description: string
  imageUrl: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)
  validateMoney(params.price, "Preço do serviço", true)

  const service = await db.barbershopService.create({
    data: {
      name: params.name,
      price: params.price,
      description: params.description,
      imageUrl: params.imageUrl,
      barbershopId: params.barbershopId,
    },
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return service
}

export async function deleteServiceAction(params: {
  barbershopId: string
  serviceId: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  // Validação Multi-tenant: Confirma se o serviço pertence a esta barbearia
  const existingService = await db.barbershopService.findFirst({
    where: { id: params.serviceId, barbershopId: params.barbershopId },
  })
  if (!existingService) {
    throw new Error("Serviço não encontrado nesta barbearia.")
  }

  // Primeiro removemos agendamentos atrelados para evitar erros de chave estrangeira (boas práticas SQL)
  await db.booking.deleteMany({
    where: { serviceId: params.serviceId },
  })

  await db.barbershopService.delete({
    where: { id: params.serviceId },
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
}

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
      where: { email: params.email },
    })
    if (existingUser) {
      linkedUserId = existingUser.id
    }
  }

  const DEFAULT_AVATAR = "/avatar2.png"

  const barber = await db.barber.create({
    data: {
      name: params.name,
      imageUrl: params.imageUrl || DEFAULT_AVATAR,
      email: params.email || null,
      phone: params.phone || null,
      barbershopId: params.barbershopId,
      userId: linkedUserId,
    },
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return barber
}

export async function deleteBarberAction(params: {
  barbershopId: string
  barberId: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  // Validação Multi-tenant: Confirma se o profissional pertence a esta barbearia
  const existingBarber = await db.barber.findFirst({
    where: { id: params.barberId, barbershopId: params.barbershopId },
  })
  if (!existingBarber) {
    throw new Error("Profissional não encontrado nesta barbearia.")
  }

  // Remove agendamentos vinculados a esse barbeiro antes
  await db.booking.deleteMany({
    where: { barberId: params.barberId },
  })

  await db.barber.delete({
    where: { id: params.barberId },
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
}

export async function updateBarbershopConfig(params: {
  barbershopId: string
  name: string
  address: string
  city?: string | null
  state?: string | null
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
      city: params.city || null,
      state: params.state || null,
      phones: params.phones,
      description: params.description,
      imageUrl: params.imageUrl,
      bannerUrl: params.bannerUrl,
      welcomeMessage: params.welcomeMessage,
      instagramUrl: params.instagramUrl,
    },
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return updated
}

export async function updateBarberCommissionRateAction(params: {
  barbershopId: string
  barberId: string
  commissionRate: number
}) {
  const barbershop = await verifyOwnership(params.barbershopId)
  if (
    !Number.isFinite(params.commissionRate) ||
    params.commissionRate < 0 ||
    params.commissionRate > 100
  )
    throw new Error("A comissão deve ser um percentual entre 0 e 100.")

  const updated = await db.barber.update({
    where: { id: params.barberId, barbershopId: params.barbershopId },
    data: { commissionRate: params.commissionRate },
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return updated
}

export async function quickSetupBarbershopAction(params: {
  barbershopId: string
  name: string
  address: string
  city?: string
  state?: string
  phones: string[]
  openingHours?: string
  imageUrl?: string
  selectedServices?: {
    name: string
    description: string
    price: number
    imageUrl: string
  }[]
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  // Atualiza dados da barbearia, logo e horários de trabalho
  const updatedBarbershop = await db.barbershop.update({
    where: { id: params.barbershopId },
    data: {
      name: params.name,
      address: params.address,
      city: params.city || null,
      state: params.state || null,
      phones: params.phones,
      openingHours: params.openingHours || null,
      ...(params.imageUrl ? { imageUrl: params.imageUrl } : {}),
    },
  })

  // Se selecionou serviços pré-definidos do catálogo rápido de Beleza, cria os serviços que ainda não existem
  if (params.selectedServices && params.selectedServices.length > 0) {
    for (const s of params.selectedServices) {
      const exists = await db.barbershopService.findFirst({
        where: {
          barbershopId: params.barbershopId,
          name: s.name,
        },
      })
      if (!exists) {
        await db.barbershopService.create({
          data: {
            barbershopId: params.barbershopId,
            name: s.name,
            description: s.description,
            price: s.price,
            imageUrl: s.imageUrl,
          },
        })
      }
    }
  }

  revalidatePath(`/${updatedBarbershop.slug}`)
  revalidatePath(`/${updatedBarbershop.slug}/admin`)
  return updatedBarbershop
}
