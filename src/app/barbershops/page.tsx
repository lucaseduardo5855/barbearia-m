import { db } from "@/lib/prisma"
import BarbershopItem from "../_components/barbershop-item"
import Header from "../_components/header"
import Search from "../_components/search"

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
    <div className="">
      <Header />
      <div className="my-6 px-5">
        <Search initialValue={searchParams?.search ?? ""} />
      </div>
      <div className="px-5">
        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
          Resultados para &quot;{search ?? service ?? ""}&quot;
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {barbershops.map((barbershop) => (
            <BarbershopItem key={barbershop.id} barbershop={barbershop} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default BarbershopsPage
