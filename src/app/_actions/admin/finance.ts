"use server"

import { db } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { verifyOwnership } from "./ownership"
import { validateMoney } from "@/lib/money"

export async function createFinancialTransactionAction(params: {
  barbershopId: string
  barberId?: string | null
  type: "RECEITA" | "DESPESA" | "COMISSAO_PAGA" | "VALE"
  category: string
  description: string
  amount: number
  date?: Date | string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)
  validateMoney(params.amount, "Valor do lançamento", false)
  if (!["RECEITA", "DESPESA", "COMISSAO_PAGA", "VALE"].includes(params.type))
    throw new Error("Tipo de lançamento inválido.")
  if (!params.description.trim())
    throw new Error("Informe a descrição do lançamento.")
  if (params.date && !Number.isFinite(new Date(params.date).getTime()))
    throw new Error("Data do lançamento inválida.")
  if (
    params.barberId &&
    !(await db.barber.findFirst({
      where: { id: params.barberId, barbershopId: params.barbershopId },
      select: { id: true },
    }))
  )
    throw new Error("Profissional não encontrado nesta barbearia.")

  const transaction = await db.financialTransaction.create({
    data: {
      barbershopId: params.barbershopId,
      barberId: params.barberId || null,
      type: params.type,
      category: params.category,
      description: params.description,
      amount: params.amount,
      date: params.date ? new Date(params.date) : new Date(),
    },
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return transaction
}

export async function payBarberCommissionsAction(params: {
  barbershopId: string
  barberId: string
  amount: number
  description?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)
  validateMoney(params.amount, "Valor da comissão", false)

  const barber = await db.barber.findFirst({
    where: { id: params.barberId, barbershopId: params.barbershopId },
  })
  if (!barber) {
    throw new Error("Colaborador não encontrado.")
  }

  const transaction = await db.financialTransaction.create({
    data: {
      barbershopId: params.barbershopId,
      barberId: params.barberId,
      type: "COMISSAO_PAGA",
      category: "Comissões",
      description:
        params.description || `Pagamento de comissão para ${barber.name}`,
      amount: params.amount,
      date: new Date(),
    },
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return transaction
}
