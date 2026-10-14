import { db } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { BarbershopCatalog } from "@/app/_components/barbershop-catalog"
import Header from "../_components/header"
import Search from "../_components/search"
import Link from "next/link"
import { Button } from "../_components/ui/button"

interface BarbershopsPageProps {
  searchParams?: {
    search?: string
    title?: string
    service?: string
    page?: string
  }
}
export default async function BarbershopsPage({
  searchParams,
}: BarbershopsPageProps) {
  const search = searchParams?.search?.trim()
  const service = searchParams?.service?.trim()
  const queryLabel = search || service
  const parsedPage = Number(searchParams?.page)
  const page =
    Number.isSafeInteger(parsedPage) && parsedPage > 0
      ? Math.min(parsedPage, 10000)
      : 1
  const pageSize = 12
  const where: Prisma.BarbershopWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          {
            services: {
              some: { name: { contains: search, mode: "insensitive" } },
            },
          },
          { address: { contains: search, mode: "insensitive" } },
        ],
      }
    : service
      ? {
          services: {
            some: { name: { contains: service, mode: "insensitive" } },
          },
        }
      : {}
  const rows = await db.barbershop.findMany({
    where,
    select: { id: true, name: true, slug: true, address: true, imageUrl: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: pageSize + 1,
    skip: (page - 1) * pageSize,
  })
  const hasNextPage = rows.length > pageSize
  const barbershops = rows.slice(0, pageSize)
  const pageHref = (next: number) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (service) params.set("service", service)
    params.set("page", String(next))
    return "/barbershops?" + params.toString()
  }
  return (
    <div className="min-w-0">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-7">
          <Search initialValue={search || ""} />
        </div>
        <div className="mb-5">
          <h1 className="text-2xl">
            {queryLabel
              ? `Resultados para “${queryLabel}”`
              : "Encontre sua barbearia"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escolha um perfil para consultar serviços e horários.
          </p>
        </div>
        {barbershops.length ? (
          <BarbershopCatalog barbershops={barbershops} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <h2 className="text-lg">Nenhuma barbearia encontrada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente outro nome, endereço ou serviço.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/barbershops">Ver todas as barbearias</Link>
            </Button>
          </div>
        )}
        {(page > 1 || hasNextPage) && (
          <nav
            aria-label="Páginas de barbearias"
            className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5"
          >
            <span className="text-sm text-muted-foreground">Página {page}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Button asChild variant="outline">
                  <Link href={pageHref(page - 1)}>Anterior</Link>
                </Button>
              )}
              {hasNextPage && (
                <Button asChild variant="outline">
                  <Link href={pageHref(page + 1)}>Próxima</Link>
                </Button>
              )}
            </div>
          </nav>
        )}
      </main>
    </div>
  )
}
