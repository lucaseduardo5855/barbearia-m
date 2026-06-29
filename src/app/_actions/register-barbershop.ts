"use server"

import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidatePath } from "next/cache"

interface RegisterBarbershopParams {
  name: string
  address: string
  phones: string[]
  description: string
  imageUrl: string
  bannerUrl?: string
  welcomeMessage?: string
  instagramUrl?: string
}

export async function registerBarbershop(params: RegisterBarbershopParams) {
  // 1. Busca a sessão do usuário que está chamando a action
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    throw new Error("Usuário não autenticado!")
  }

  const userId = (session.user as any).id

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
      }
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
