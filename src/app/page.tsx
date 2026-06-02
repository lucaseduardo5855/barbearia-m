import { Input } from "./_components/ui/input"
import Header from "./_components/header"
import { Button } from "./_components/ui/button"
import Image from "next/image"
import { db } from "@/lib/prisma"
import BarbershopItem from "./_components/barbershop-item"
import BookingItem from "./_components/booking-item"
import quickSearchOptions from "./_constants/search"
import Search from "./_components/search"
import { getServerSession } from "next-auth"
import { authOptions } from "./_lib/auth"

const Home = async () => {
  const session = await getServerSession(authOptions)
  //chamar bd
  const barbershops = await db.barbershop.findMany({}) //pega todas as barbearias
  const popularBarbershops = await db.barbershop.findMany({
    orderBy: {
      name: "desc",
    },
  }) //pega as barbearias populares

  // Busca as reservas do usuário autenticado, incluindo os dados do serviço e da barbearia
  const bookings = session?.user
    ? await db.booking.findMany({
        where: {
          userId: (session.user as any).id,
        },
        include: {
          service: {
            include: {
              barbershop: true,
            },
          },
        },
      })
    : []

  return (
    <div>
      <Header />
      <div className="px-5">
        {/* Texto */}
        <h1 className="mt-5 text-xl font-bold">Olá, Lucas!</h1>
        <p>Quarta-feira, 20 de maio.</p>

        {/* Busca */}
        <div className="mt-6">
          <Search />
        </div>

        {/* Busca Rápida */}
        <div className="mt-6 flex gap-3 overflow-x-scroll [&::-webkit-scrollbar]:hidden">
          {quickSearchOptions.map((option) => (
            <Button
              asChild
              className="gap-2"
              variant="secondary"
              key={option.title}
            >
              <a
                href={`/barbershops?service=${encodeURIComponent(option.title)}`}
              >
                <Image
                  src={option.imageUrl}
                  width={16}
                  height={16}
                  alt={option.title}
                />
                {option.title}
              </a>
            </Button>
          ))}
        </div>

        {/* Imagem */}
        <div className="relative mt-6 h-[150px] w-full">
          <Image
            alt="Agende nos melhores com FSW Barber"
            src="/Banner-01.png"
            fill
            className="rounded-xl object-contain"
          />
        </div>

        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
          Agendamentos
        </h2>

        {/* Agendamentos */}
        <div className="mt-3 flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {bookings.map((booking) => (
            <BookingItem key={booking.id} booking={booking} />
          ))}
        </div>

        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
          Recomendados
        </h2>
        <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
          {barbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </div>

        {/* Barbearias Populares */}
        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
          Populares
        </h2>
        <div className="flex gap-4 overflow-auto [&::-webkit-scrollbar]:hidden">
          {popularBarbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home
