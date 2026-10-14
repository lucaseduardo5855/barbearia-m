import { db } from "@/lib/prisma"
import Header from "../_components/header"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { notFound } from "next/dist/client/components/not-found"
import BookingItem from "../_components/booking-item"
import { getConfirmedBookings } from "../_data/get-confirmed-bookings"
import { getConcluedBookings } from "../_data/get-conclued-bookings"
import ConcluedBookingsList from "../_components/concluedbookingslist"

const Bookings = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    //TODO - Mostrar popup de login
    return notFound()
  }

  //Filtro de agendamentos
  //agendamentos do user logado, agendamentos confirmados
  const confirmedBookings = await getConfirmedBookings()

  //agendamentos ja finalizados
  const concluedBookings = await getConcluedBookings()

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl space-y-3 px-4 py-5 sm:px-6 lg:px-8">
        <h1 className="text-xl font-bold">Agendamentos</h1>
        {confirmedBookings.length === 0 && (
          <p className="text-muted-foreground">
            Você não tem agendamentos confirmados.
          </p>
        )}
        {confirmedBookings.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-primary/80">
              Confirmados
            </h2>
            {confirmedBookings.map((booking) => (
              <BookingItem
                key={booking.id}
                booking={JSON.parse(JSON.stringify(booking))}
              />
            ))}
          </>
        )}
        <ConcluedBookingsList
          bookings={JSON.parse(JSON.stringify(concluedBookings))}
        />
      </main>
    </>
  )
}

export default Bookings
