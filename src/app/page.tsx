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
import LandingPage from "./_components/landing-page"
import RegionBanner from "./_components/region-banner"

interface HomeProps {
  searchParams?: { state?: string; city?: string; view?: string }
}

export default async function Home({ searchParams }: HomeProps) {
  if (searchParams?.view === "landing") {
    return <LandingPage />
  }

  const selectedState = searchParams?.state?.trim() || ""
  const selectedCity = searchParams?.city?.trim() || ""
  const locationWhere = {
    ...(selectedState ? { state: { equals: selectedState, mode: "insensitive" as const } } : {}),
    ...(selectedCity ? { city: { contains: selectedCity, mode: "insensitive" as const } } : {}),
  }

  let session: Session | null = null
  let barbershops: Awaited<ReturnType<typeof db.barbershop.findMany>> = []
  let popularBarbershops: Awaited<ReturnType<typeof db.barbershop.findMany>> = []
  let confirmedBookings: Awaited<ReturnType<typeof getConfirmedBookings>> = []

  try {
    const homeData = await Promise.race([
      (async () => {
        const currentSession: Session | null = await getServerSession(authOptions)
        const [shops, popularShops, bookings] = await Promise.all([
          db.barbershop.findMany({ where: locationWhere }),
          db.barbershop.findMany({ where: locationWhere, orderBy: { name: "desc" } }),
          getConfirmedBookings(),
        ])
        return { currentSession, shops, popularShops, bookings }
      })(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ])

    if (homeData) {
      session = homeData.currentSession
      barbershops = homeData.shops
      popularBarbershops = homeData.popularShops
      confirmedBookings = homeData.bookings
    }
  } catch {
    // A página continua navegável se o banco estiver reiniciando ou indisponível.
  }

  const locationLabel = selectedCity ? `em ${selectedCity}${selectedState ? `, ${selectedState}` : ""}` : "perto de você"

  return (
    <div className="min-h-screen bg-background text-foreground">
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

        <nav className="mt-6 flex justify-start sm:justify-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Buscar por serviço">
          {quickSearchOptions.map((option, index) => (
            <Button asChild className="shrink-0 gap-2 rounded-xl" variant="secondary" key={`${option.title}-${index}`}>
              <a href={`/barbershops?service=${encodeURIComponent(option.title)}`}>
                <Scissors className="size-3.5 text-primary" />
                {option.title}
              </a>
            </Button>
          ))}
        </nav>

        <RegionBanner />

        {confirmedBookings.length > 0 && (
          <section className="mt-10" aria-labelledby="bookings-title">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="bookings-title" className="text-lg font-bold tracking-tight">Seus próximos horários</h2>
                <p className="mt-1 text-sm text-muted-foreground">Toque em um agendamento para ver os detalhes.</p>
              </div>
            </div>
            <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {confirmedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={JSON.parse(JSON.stringify(booking))} layout="rail" />
              ))}
            </div>
          </section>
        )}

        <section className="mt-10" aria-labelledby="recommended-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="recommended-title" className="text-lg font-bold tracking-tight">Barbearias {locationLabel}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Arraste para conhecer as opções.</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0 text-primary"><Link href="/barbershops">Ver todas</Link></Button>
          </div>
          {barbershops.length > 0 ? (
            <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {barbershops.map((barberShopItem) => <BarbershopItem key={barberShopItem.id} barbershop={barberShopItem} layout="rail" />)}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Ainda não encontramos barbearias para esse filtro. Tente outra cidade.</p>
          )}
        </section>

        {popularBarbershops.length > 0 && (
          <section className="mt-10" aria-labelledby="popular-title">
            <div>
              <h2 id="popular-title" className="text-lg font-bold tracking-tight">Mais opções para você</h2>
              <p className="mt-1 text-sm text-muted-foreground">Perfis disponíveis para explorar.</p>
            </div>
            <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {popularBarbershops.map((popularShopItem) => <BarbershopItem key={popularShopItem.id} barbershop={popularShopItem} layout="rail" />)}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
