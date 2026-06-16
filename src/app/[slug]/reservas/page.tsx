import BookingItem from "@/app/_components/booking-item"
import Header from "@/app/_components/header"
import { authOptions } from "@/app/_lib/auth"
import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { notFound } from "next/navigation"

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

    //buscamos os agendamentos Confirmados (data futura)
    const confirmedBookings = await db.booking.findMany({
        where: {
            userId: userId,
            date: {
                gte: new Date(),
            },
            service: {
                barbershop: {
                    slug: params.slug
                },
            },
        },
        include: {
            service: {
                include: {
                    barbershop: true
                },
            },
            barber: true
        },
        orderBy: {
            date: "asc",
        },

    })

    //Buscamos os agendamentos Concluidos/passados 
    const concluedBookings = await db.booking.findMany({
        where: {
            userId: userId,
            date: {
                lt: new Date(),
            },
            service: {
                barbershop: {
                    slug: params.slug
                },
            },
        },
        include: {
            service: {
                include: {
                    barbershop: true
                }
            },
            barber: true
        },
        orderBy: {
            date: "asc",
        },
    })

    return (
        <>
            <Header />
            <div className="space-y-3 p-5">
                <h1 className="text-xl font-bold">Agendamentos</h1>
                {confirmedBookings.length === 0 && (
                    <p className="text-gray-400 text-center">
                        Você não tem agendamentos confirmado nesta barbearia.
                    </p>
                )}
                {confirmedBookings.length > 0 && (
                    <>
                        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">Confirmados</h2>
                        {confirmedBookings.map(booking => (
                            <BookingItem
                                key={booking.id}
                                booking={JSON.parse(JSON.stringify(booking))}
                                hideBarberShopInfo
                            />
                        ))}
                    </>
                )}
            </div>
        </>
    )
}

export default ReservasPage