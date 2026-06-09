import { db } from "@/lib/prisma";
import Header from "../_components/header";
import { getServerSession } from "next-auth";
import { authOptions } from "../_lib/auth";
import { notFound } from "next/dist/client/components/not-found";
import BookingItem from "../_components/booking-item";
import { getConfirmedBookings } from "../_data/get-confirmed-bookings";
import { getConcluedBookings } from "../_data/get-conclued-bookings";

const Bookings = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    //TODO - Mostrar popup de login
    return notFound();
  }

  //Filtro de agendamentos
  //agendamentos do user logado, agendamentos confirmados
  const confirmedBookings = await getConfirmedBookings();

  //agendamentos ja finalizados
  const concluedBookings = await getConcluedBookings();

  return (
    <>
      <Header />
      <div className="space-y-3 p-5">
        <h1 className="text-xl font-bold">Agendamentos</h1>
        {confirmedBookings.length === 0 && (
          <p className="text-gray-400">
            Você não tem agendamentos confirmados.
          </p>
        )}
        {confirmedBookings.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
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
        {concluedBookings.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
              Finalizados
            </h2>
            {concluedBookings.map((booking: any) => (
              <BookingItem
                key={booking.id}
                booking={JSON.parse(JSON.stringify(booking))}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default Bookings;
