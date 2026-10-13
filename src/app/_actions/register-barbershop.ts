"use server"

import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { randomUUID } from "node:crypto"
import {
  registrationSchema,
  type RegistrationInput,
} from "@/lib/registration-schema"

export async function getOwnedBarbershop() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return null
  return db.barbershop.findUnique({
    where: { ownerId: userId },
    select: { slug: true, name: true },
  })
}

export async function registerBarbershop(params: RegistrationInput) {
  const parsed = registrationSchema.safeParse(params)
  if (!parsed.success)
    return { ok: false as const, message: parsed.error.issues[0].message }
  const data = parsed.data
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId)
    return {
      ok: false as const,
      message: "Entre na sua conta para cadastrar a barbearia.",
      needsLogin: true,
    }
  const existing = await db.barbershop.findUnique({
    where: { ownerId: userId },
    select: { slug: true },
  })
  if (existing)
    return {
      ok: false as const,
      message:
        "Esta conta já possui uma barbearia. Acesse seu painel para gerenciar os dados.",
      existingSlug: existing.slug,
    }
  const baseSlug =
    data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") || "barbearia"
  const slug = baseSlug + "-" + randomUUID().slice(0, 8)
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 7)
  if (data.barberEmail) {
    const existingBarber = await db.barber.findUnique({
      where: { email: data.barberEmail.toLowerCase() },
      select: { id: true },
    })
    if (existingBarber)
      return {
        ok: false as const,
        message:
          "Este e-mail já está vinculado a um profissional. Você pode cadastrar a equipe depois pelo painel.",
      }
  }
  try {
    const shop = await db.$transaction(
      async (tx) => {
        const barbershop = await tx.barbershop.create({
          data: {
            name: data.name,
            slug,
            address: data.address,
            phones: data.phones,
            description: data.description,
            imageUrl: data.imageUrl,
            ownerId: userId,
            welcomeMessage:
              data.welcomeMessage ||
              "Bem-vindo! Escolha um serviço para agendar.",
            instagramUrl: data.instagramUrl || null,
            subscriptionActive: false,
            trialEndsAt,
            openingHours: JSON.stringify(
              Object.fromEntries(
                data.openingHours.map((day) => [
                  day.key,
                  { active: day.active, start: day.start, end: day.end },
                ]),
              ),
            ),
          },
        })
        await tx.barber.create({
          data: {
            name: session!.user?.name || "Proprietário",
            imageUrl: session!.user?.image || "/avatar.png",
            barbershopId: barbershop.id,
          },
        })
        if (data.barberName)
          await tx.barber.create({
            data: {
              name: data.barberName,
              email: data.barberEmail?.toLowerCase() || null,
              imageUrl: "/avatar.png",
              barbershopId: barbershop.id,
            },
          })
        await tx.barbershopService.createMany({
          data: data.services.map((service) => ({
            name: service.name,
            price: service.price,
            description: service.description || service.name,
            imageUrl: data.imageUrl,
            barbershopId: barbershop.id,
          })),
        })
        await tx.user.update({ where: { id: userId }, data: { role: "ADMIN" } })
        return barbershop
      },
      { maxWait: 10000, timeout: 20000 },
    )
    revalidatePath("/")
    revalidatePath("/barbershops")
    revalidatePath("/admin")
    return { ok: true as const, slug: shop.slug }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false as const,
        message:
          "A conta ou o e-mail já está vinculado a um cadastro. Acesse seu painel ou use outro e-mail para o profissional.",
      }
    }
    console.error(
      "register-barbershop",
      error instanceof Error ? error.name : "UnknownError",
    )
    return {
      ok: false as const,
      message:
        "Não foi possível salvar agora. Confira sua conexão e tente novamente; seus dados continuam no formulário.",
    }
  }
}
