import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/prisma"

export default async function AdminPage() {
  // 1. Busca a sessão no servidor de forma segura
  const session = await getServerSession(authOptions)

  // 2. Se não estiver logado, redireciona para a home para fazer login
  if (!session || !session.user) {
    redirect("/")
  }

  const userId = (session.user as any).id

  // 3. Busca se este usuário possui alguma barbearia cadastrada
  const barbershop = await db.barbershop.findUnique({
    where: { ownerId: userId },
    select: { slug: true }
  })

  // 4. Se não tem barbearia, redireciona para a tela de criação
  if (!barbershop) {
    redirect("/admin/register")
  }

  // 5. Se tem barbearia, redireciona para a rota administrativa do tenant
  redirect(`/${barbershop.slug}/admin`)
}
