import BookingItem from "@/app/_components/booking-item"
import Header from "@/app/_components/header"
import { authOptions } from "@/app/_lib/auth"
import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/app/_components/ui/button"

interface ReservasPageProps {
  params: {
    slug: string
  }
}

const ReservasPage = async ({ params }: ReservasPageProps) => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return notFound()
  }

  const userId = (session.user as any).id

  const barbershop = await db.barbershop.findUnique({
    where: { slug: params.slug },
    select: { name: true, slug: true },
  })

  // Buscamos os agendamentos Confirmados (data futura)
  const confirmedBookings = await db.booking.findMany({
    where: {
      userId: userId,
      status: {
        in: ["PENDING", "CONFIRMED"],
      },
      date: {
        gte: new Date(),
      },
      service: {
        barbershop: {
          slug: params.slug,
        },
      },
    },
    include: {
      service: {
        include: {
          barbershop: true,
        },
      },
      barber: true,
    },
    orderBy: {
      date: "asc",
    },
  })

  // Buscamos os agendamentos Concluídos/passados
  const concluedBookings = await db.booking.findMany({
    where: {
      userId: userId,
      status: "DONE",
      service: {
        barbershop: {
          slug: params.slug,
        },
      },
    },
    include: {
      service: {
        include: {
          barbershop: true,
        },
      },
      barber: true,
    },
    orderBy: {
      date: "desc",
    },
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Agendamentos</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {barbershop?.name
                ? `Suas reservas em ${barbershop.name}`
                : "Histórico de reservas"}
            </p>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link href={`/${params.slug}`}>
              <ChevronLeft className="size-4" />
              Barbearia
            </Link>
          </Button>
        </div>

        {confirmedBookings.length === 0 && concluedBookings.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Você não tem agendamentos nesta barbearia.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href={`/${params.slug}/agendar`}>Agendar horário</Link>
            </Button>
          </div>
        )}

        {confirmedBookings.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Confirmados
            </h2>
            <div className="space-y-3">
              {confirmedBookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  booking={JSON.parse(JSON.stringify(booking))}
                  hideBarberShopInfo
                />
              ))}
            </div>
          </section>
        )}

        {concluedBookings.length > 0 && (
          <section className="space-y-3 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Finalizados
            </h2>
            <div className="space-y-3">
              {concluedBookings.map((booking) => (
                <BookingItem
                  key={booking.id}
                  booking={JSON.parse(JSON.stringify(booking))}
                  hideBarberShopInfo
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default ReservasPage
