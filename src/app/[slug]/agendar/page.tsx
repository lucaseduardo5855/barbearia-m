import { CalendarDays } from "lucide-react"
import { notFound } from "next/navigation"
import Header from "@/app/_components/header"
import { db } from "@/lib/prisma"
import BookingFlow from "./_components/booking.flow"

interface AgendarPageProps {
  params: { slug: string }
}

export default async function AgendarPage({ params }: AgendarPageProps) {
  const barbershop = await db.barbershop.findUnique({
    where: { slug: params.slug },
    include: { services: true, barbers: true },
  })

  if (!barbershop) return notFound()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
          <div className="flex items-start gap-3 border-b border-border pb-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><CalendarDays className="size-5" /></span>
            <div>
              <h1 className="text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">Novo agendamento</h1>
              <p className="mt-1 text-sm text-muted-foreground">Escolha um serviço, um profissional e o melhor horário em {barbershop.name}.</p>
            </div>
          </div>
          <div className="mt-6"><BookingFlow barbershop={JSON.parse(JSON.stringify(barbershop))} /></div>
        </div>
      </main>
    </div>
  )
}
