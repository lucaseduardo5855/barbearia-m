import { db } from "@/lib/prisma"
import BarbershopItem from "../_components/barbershop-item"
import Header from "../_components/header"
import Search from "../_components/search"

interface BarbershopsPageProps {
  searchParams: {
    search?: string
  }
}

const BarbershopsPage = async ({ searchParams }: BarbershopsPageProps) => {
  const barbershops = await db.barbershop.findMany({
    where: {
      name: {
        contains: searchParams?.search, // Filtra os barbearias pelo nome usando o parâmetro de busca
        mode: "insensitive", // Ignora maiúsculas e minúsculas na busca
      },
    },
  })

  return (
    <div className="">
      <Header />
      <div className="my-6 px-5">
        <Search initialValue={searchParams?.search ?? ""} />
      </div>
      <div className="px-5">
        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
          Resultados para &quot;{searchParams?.search}&quot;
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
