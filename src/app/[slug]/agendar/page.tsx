import { db } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Header from "@/app/_components/header"
import BookingFlow from "./_components/booking.flow"
// Importaremos o componente interativo que vamos criar depois
// import BookingFlow from "./_components/booking-flow"

interface AgendarPageProps {
    params: {
        slug: string
    }
}

export default async function AgendarPage({ params }: AgendarPageProps) {
    // 1. Buscamos a barbearia pelo slug, incluindo seus serviços e barbeiros
    const barbershop = await db.barbershop.findUnique({
        where: {
            slug: params.slug,
        },
        include: {
            services: true,
            barbers: true,
        },
    })

    // 2. Se a barbearia não existir na URL, disparou o erro 404
    if (!barbershop) {
        return notFound()
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <div className="flex-1 p-5 max-w-md mx-auto w-full">
                {/* Título da tela */}
                <h1 className="text-xl font-bold mb-6 flex justify-center text-primary mt-10">Novo Agendamento</h1>

                {/* Aqui chamaremos o fluxo interativo, passando os dados do banco */}
                <BookingFlow barbershop={JSON.parse(JSON.stringify(barbershop))} />
            </div>
        </div>
    )
}
