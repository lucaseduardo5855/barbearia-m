import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"

export async function verifyOwnership(barbershopId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    throw new Error("Usuário não autenticado!")
  }

  const userId = (session.user as any).id
  const barbershop = await db.barbershop.findUnique({
    where: { id: barbershopId },
    select: { ownerId: true, slug: true },
  })

  if (!barbershop || barbershop.ownerId !== userId) {
    throw new Error("Acesso negado! Você não é o proprietário desta barbearia.")
  }

  return barbershop
}
