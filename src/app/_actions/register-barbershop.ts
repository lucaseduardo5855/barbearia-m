"use server"

import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const registerBarbershopSchema = z.object({
  name: z.string().min(2, "Nome da barbearia deve ter pelo menos 2 caracteres"),
  address: z.string().min(3, "Endereço inválido"),
  phones: z.array(z.string()).min(1, "Informe ao menos um telefone"),
  description: z.string().min(3, "Descrição muito curta"),
  imageUrl: z.string().min(1, "Imagem da barbearia é obrigatória"),
  bannerUrl: z.string().optional(),
  welcomeMessage: z.string().optional(),
  instagramUrl: z.string().optional(),
  cortePrice: z.string().min(1, "Preço do corte é obrigatório"),
  barbaPrice: z.string().min(1, "Preço da barba é obrigatório"),
  sobrancelhaPrice: z.string().min(1, "Preço da sobrancelha é obrigatório"),
  workDays: z.array(z.string()).default([]),
  barberName: z.string().optional(),
})

interface RegisterBarbershopParams {
  name: string
  address: string
  phones: string[]
  description: string
  imageUrl: string
  bannerUrl?: string
  welcomeMessage?: string
  instagramUrl?: string
  cortePrice: string
  barbaPrice: string
  sobrancelhaPrice: string
  workDays: string[]
  barberName?: string
}

export async function registerBarbershop(params: RegisterBarbershopParams) {
  const validated = registerBarbershopSchema.parse(params)

  // 1. Busca a sessão do usuário que está chamando a action
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    throw new Error("Usuário não autenticado!")
  }

  const userId = (session.user as any).id
  const ownerName = session.user.name || "Proprietário"
  const ownerImage = session.user.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"

  if (!userId) {
    throw new Error("ID do usuário não encontrado na sessão!")
  }

  // 2. Valida se o usuário já possui alguma barbearia cadastrada (1-para-1)
  const existingBarbershop = await db.barbershop.findUnique({
    where: { ownerId: userId }
  })

  if (existingBarbershop) {
    throw new Error("Este usuário já possui uma barbearia cadastrada!")
  }

  // 3. Gera o slug único de forma simples (ex: "Barbearia do R10" -> "barbearia-do-r10")
  const baseSlug = params.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, "-") // Substitui espaços por hífen

  // Adiciona um sufixo aleatório curto para garantir que o slug seja único no banco
  const uniqueSuffix = Math.random().toString(36).substring(2, 6)
  const slug = `${baseSlug}-${uniqueSuffix}`

  // 4. Calcula a data final do trial (data atual + 7 dias)
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 7)

  const dayKeys: Record<string, string> = {
    Segunda: "seg",
    "Terça": "ter",
    Quarta: "qua",
    Quinta: "qui",
    Sexta: "sex",
    "Sábado": "sab",
    Domingo: "dom",
  }
  const openingHours = Object.fromEntries(
    Object.entries(dayKeys).map(([label, key]) => [key, {
      active: params.workDays.includes(label),
      start: "09:00",
      end: key === "sab" ? "17:00" : "19:00",
    }]),
  )

  // 5. Cria a barbearia e atualiza a role do usuário para ADMIN em uma transação
  const result = await db.$transaction(async (tx) => {
    const barbershop = await tx.barbershop.create({
      data: {
        name: params.name,
        slug,
        address: params.address,
        phones: params.phones,
        description: params.description,
        imageUrl: params.imageUrl,
        bannerUrl: params.bannerUrl || null,
        welcomeMessage: params.welcomeMessage || "Bem-vindo ao nosso sistema de agendamentos!",
        instagramUrl: params.instagramUrl || null,
        ownerId: userId,
        subscriptionActive: false, // Começa como falso pois está usando o Trial de 7 dias
        trialEndsAt,
        openingHours: JSON.stringify(openingHours),
      }
    })

    // 5.1 Criar o Barbeiro Proprietário (Dono)
    await tx.barber.create({
      data: {
        name: ownerName,
        imageUrl: ownerImage,
        barbershopId: barbershop.id,
      }
    })

    // 5.2 Criar o Colaborador (se houver)
    if (params.barberName && params.barberName.trim() !== "") {
      await tx.barber.create({
        data: {
          name: params.barberName,
          imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=300&auto=format&fit=crop", // Foto de barbeiro genérica
          barbershopId: barbershop.id,
        }
      })
    }

    await tx.barbershopService.createMany({
      data: [
        {
          name: 'Cabelo',
          description: 'Corte de Cabelo',
          price: Number(params.cortePrice),
          imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=300&auto=format&fit=crop',
          barbershopId: barbershop.id
        },
        {
          name: 'Barba',
          description: 'Barba',
          price: Number(params.barbaPrice),
          imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=300&auto=format&fit=crop',
          barbershopId: barbershop.id
        },
        {
          name: 'Sobrancelha',
          description: 'Sobrancelha',
          price: Number(params.sobrancelhaPrice),
          imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=300&auto=format&fit=crop',
          barbershopId: barbershop.id
        }
      ]
    })

    // Atualiza a role do usuário para ADMIN
    await tx.user.update({
      where: { id: userId },
      data: { role: "ADMIN" }
    })

    return barbershop
  })

  // 6. Revalida as páginas para limpar o cache do Next.js
  revalidatePath("/")
  revalidatePath("/admin")

  return result
}
