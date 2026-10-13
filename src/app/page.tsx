import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { Scissors } from "lucide-react"
import { authOptions } from "./_lib/auth"
import { db } from "@/lib/prisma"
import { getConfirmedBookings } from "./_data/get-confirmed-bookings"
import Header from "./_components/header"
import LocationFilter from "./_components/location-filter"
import BarbershopItem from "./_components/barbershop-item"
import BookingItem from "./_components/booking-item"
import { Button } from "./_components/ui/button"
import quickSearchOptions from "./_constants/search"
import { redirect } from "next/navigation"
import RegionBanner from "./_components/region-banner"
import { HorizontalRail } from "./_components/horizontal-rail"

interface HomeProps {
  searchParams?: { state?: string; city?: string; view?: string }
}

export default async function Home({ searchParams }: HomeProps) {
  if (searchParams?.view === "landing") {
    redirect("/landing")
  }

  const selectedState = searchParams?.state?.trim() || ""
  const selectedCity = searchParams?.city?.trim() || ""
  const locationWhere = {
    ...(selectedState
      ? { state: { equals: selectedState, mode: "insensitive" as const } }
      : {}),
    ...(selectedCity
      ? { city: { contains: selectedCity, mode: "insensitive" as const } }
      : {}),
  }

  let session: Session | null = null
  let barbershops: Awaited<ReturnType<typeof db.barbershop.findMany>> = []
  let popularBarbershops: Awaited<ReturnType<typeof db.barbershop.findMany>> =
    []
  let confirmedBookings: Awaited<ReturnType<typeof getConfirmedBookings>> = []

  try {
    const homeData = await Promise.race([
      (async () => {
        const currentSession: Session | null =
          await getServerSession(authOptions)
        const [shops, bookings] = await Promise.all([
          db.barbershop.findMany({
            where: locationWhere,
            take: 24,
            orderBy: { name: "asc" },
          }),
          getConfirmedBookings(),
        ])
        return { currentSession, shops, bookings }
      })(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ])

    if (homeData) {
      session = homeData.currentSession
      barbershops = homeData.shops.slice(0, 6)
      popularBarbershops = homeData.shops.slice(6)
      confirmedBookings = homeData.bookings
    }
  } catch {
    // A página continua navegável se o banco estiver reiniciando ou indisponível.
  }

  const locationLabel = selectedCity
    ? `em ${selectedCity}${selectedState ? `, ${selectedState}` : ""}`
    : "perto de você"

  return (
    <div className="min-w-0 bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <section className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Olá, {session?.user?.name || "seja bem-vindo"}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>

          <LocationFilter />
        </section>

        <nav
          className="mt-6 flex justify-start gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden"
          aria-label="Buscar por serviço"
        >
          {quickSearchOptions.map((option, index) => (
            <Button
              asChild
              className="shrink-0 gap-2 rounded-xl"
              variant="secondary"
              key={`${option.title}-${index}`}
            >
              <a
                href={`/barbershops?service=${encodeURIComponent(option.title)}`}
              >
                <Scissors className="size-3.5 text-primary" />
                {option.title}
              </a>
            </Button>
          ))}
        </nav>

        <RegionBanner />

        {confirmedBookings.length > 0 && (
          <HorizontalRail
            title="Seus próximos horários"
            description="Toque em um agendamento para ver os detalhes."
          >
            {confirmedBookings.map((booking) => (
              <BookingItem
                key={booking.id}
                booking={JSON.parse(JSON.stringify(booking))}
                layout="rail"
              />
            ))}
          </HorizontalRail>
        )}
        <HorizontalRail
          title={`Barbearias ${locationLabel}`}
          description="Deslize ou use as setas para conhecer as opções."
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/barbershops">Ver todas</Link>
            </Button>
          }
        >
          {barbershops.length ? (
            barbershops.map((shop) => (
              <BarbershopItem key={shop.id} barbershop={shop} layout="rail" />
            ))
          ) : (
            <p className="w-full rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Nenhuma barbearia encontrada para este filtro.
            </p>
          )}
        </HorizontalRail>
        {popularBarbershops.length > 0 && (
          <HorizontalRail
            title="Mais opções para você"
            description="Perfis disponíveis para explorar."
          >
            {popularBarbershops.map((shop) => (
              <BarbershopItem key={shop.id} barbershop={shop} layout="rail" />
            ))}
          </HorizontalRail>
        )}
      </main>
    </div>
  )
}
