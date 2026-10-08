import { db } from "@/lib/prisma"
import BarbershopItem from "../_components/barbershop-item"
import Header from "../_components/header"
import Search from "../_components/search"
import Link from "next/link"
import { Button } from "../_components/ui/button"

interface BarbershopsPageProps {
  searchParams?: {
    search?: string
    title?: string
    service?: string
  }
}

const BarbershopsPage = async ({ searchParams }: BarbershopsPageProps) => {
  const search = searchParams?.search
  const service = searchParams?.service
  const queryLabel = search || service

  let barbershops
  if (search) {
    barbershops = await db.barbershop.findMany({
      where: {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    })
  } else if (service) {
    barbershops = await db.barbershop.findMany({
      where: {
        services: {
          some: {
            name: {
              contains: service,
              mode: "insensitive",
            },
          },
        },
      },
    })
  } else {
    barbershops = await db.barbershop.findMany()
  }

  return (
    <div className="min-w-0">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="my-6">
        <Search initialValue={searchParams?.search ?? ""} />
      </div>
      <div>
        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-primary/80">
          {queryLabel ? `Resultados para "${queryLabel}"` : "Todas as barbearias"}
        </h2>
        {barbershops.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {barbershops.map((barbershop) => (
              <BarbershopItem key={barbershop.id} barbershop={barbershop} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card px-5 py-8 text-center">
            <h3 className="font-semibold">Nenhuma barbearia encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente buscar por outro nome ou serviço.
            </p>
            {queryLabel && (
              <Button asChild variant="outline" className="mt-5">
                <Link href="/barbershops">Ver todas as barbearias</Link>
              </Button>
            )}
          </div>
        )}
      </div>
      </main>
    </div>
  )
}

export default BarbershopsPage
