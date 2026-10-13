import { getServerSession } from "next-auth"
import { authOptions } from "@/app/_lib/auth"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/prisma"
import PixLockScreen from "./_components/pix-lock-screen"
import AdminDashboardClient from "./_components/admin-dashboard-client"

interface AdminPageProps {
  params: {
    slug: string
  }
}

export default async function AdminPage({ params }: AdminPageProps) {
  // 1. Busca a sessão do usuário de forma segura no servidor
  const session = await getServerSession(authOptions)

  // 2. Se não estiver logado, joga de volta para a Home
  if (!session || !session.user) {
    redirect("/")
  }

  const userId = (session.user as any).id

  // 3. Busca a barbearia pelo slug, incluindo serviços, barbeiros, produtos, bloqueios, vendas e transações
  const barbershop = await db.barbershop.findUnique({
    where: { slug: params.slug },
    include: {
      services: true,
      barbers: true,
      products: true,
      blockedTimes: true,
      productSales: {
        include: {
          product: true,
          barber: true,
        },
        orderBy: {
          date: "desc",
        },
      },
      transactions: {
        orderBy: {
          date: "desc",
        },
      },
      subscriptionPayments: {
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  })

  // Busca todas as unidades do proprietário para o seletor de unidades
  const userBarbershops = await db.barbershop.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      subscriptionActive: true,
    },
  })

  // 4. Se a barbearia não existir, retorna erro 404
  if (!barbershop) {
    notFound()
  }

  // 5. Valida se o usuário logado é o proprietário ou um barbeiro cadastrado (Segurança)
  let loggedInBarber = barbershop.barbers.find((b) => b.userId === userId)

  // Se o barbeiro não estiver vinculado por userId, mas o e-mail cadastrado for igual ao do usuário logado:
  if (!loggedInBarber && session?.user?.email) {
    const barberWithSameEmail = barbershop.barbers.find(
      (b) => b.email === session.user?.email,
    )
    if (barberWithSameEmail) {
      await db.barber.update({
        where: { id: barberWithSameEmail.id },
        data: { userId: userId },
      })
      barberWithSameEmail.userId = userId
      loggedInBarber = barberWithSameEmail
    }
  }
  const isOwner = barbershop.ownerId === userId
  const isBarber = !!loggedInBarber

  if (!isOwner && !isBarber) {
    redirect("/")
  }

  // Define o nível de acesso: OWNER (Dono), ADMIN (Sócio) ou EMPLOYEE (Funcionário)
  const userRole = isOwner
    ? "OWNER"
    : loggedInBarber?.role === "ADMIN"
      ? "ADMIN"
      : "EMPLOYEE"

  // 6. Verifica a vigência da assinatura ou do período de testes (Trial)
  const isTrialActive =
    barbershop.trialEndsAt && new Date() < new Date(barbershop.trialEndsAt)
  const isSubActive = barbershop.subscriptionActive

  if (!isTrialActive && !isSubActive) {
    return (
      <PixLockScreen
        barbershopId={barbershop.id}
        barbershopName={barbershop.name}
      />
    )
  }

  //Busca os agendamentos (filtrando apenas os do próprio profissional caso seja funcionário)
  const bookings = await db.booking.findMany({
    where: {
      service: {
        barbershopId: barbershop.id,
      },
      ...(userRole === "EMPLOYEE" ? { barberId: loggedInBarber?.id } : {}),
    },
    include: {
      service: true,
      barber: true,
      user: { select: { id: true, name: true, phone: true, image: true } },
    },
    orderBy: {
      date: "desc", // Mais novos primeiro na listagem
    },
  })

  // Serializa os dados antes de passar para o Client Component (evita warnings do Next.js sobre instâncias de Date)
  const serializedBarbershop = JSON.parse(JSON.stringify(barbershop))
  const serializedBookings = JSON.parse(JSON.stringify(bookings))
  const serializedUserBarbershops = JSON.parse(JSON.stringify(userBarbershops))

  return (
    <AdminDashboardClient
      barbershop={serializedBarbershop}
      bookings={serializedBookings}
      userBarbershops={serializedUserBarbershops}
      userRole={userRole}
    />
  )
}
