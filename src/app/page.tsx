import { Input } from "./_components/ui/input"
import Header from "./_components/header"
import { Button } from "./_components/ui/button"
import { EyeIcon, FootprintsIcon, SearchIcon } from "lucide-react"
import { Badge } from "./_components/ui/badge"
import Image from "next/image"
import { Card, CardContent } from "./_components/ui/card"
import { Avatar, AvatarImage } from "./_components/ui/avatar"
import { db } from "@/lib/prisma"
import BarbershopItem from "./_components/barbershop-item"

const Home = async () => {
  //chamar bd
  const barbershops = await db.barbershop.findMany({}) //pega todas as barbearias
  const popularBarbershops = await db.barbershop.findMany({
    orderBy: {
      name: "desc",
    },
  }) //pega as barbearias populares

  return (
    <div>
      <Header />
      <div className="px-5">
        {/* Texto */}
        <h1 className="mt-5 text-xl font-bold">Olá, Lucas!</h1>
        <p>Quarta-feira, 20 de maio.</p>

        {/* Busca */}
        <div className="mt-6 flex items-center gap-2">
          <Input placeholder="Faça sua Busca..." />
          <Button size="icon">
            <SearchIcon />
          </Button>
        </div>

        {/* Busca Rapida */}
        <div className="mt-6 flex justify-center gap-3 overflow-x-scroll [&::-webkit-scrollbar]:hidden">
          <Button className="gap-2" variant="secondary">
            <Image
              src="/tesoura.png"
              alt="Ícone de tesoura"
              width={16}
              height={16}
            />
            Cabelo
          </Button>

          <Button className="gap-2" variant="secondary">
            <Image
              src="/barba.png"
              alt="Ícone de barba"
              width={16}
              height={16}
            />
            Barba
          </Button>

          <Button className="gap-2" variant="secondary">
            <Image
              src="/navalha.png"
              alt="Ícone de navalha"
              width={16}
              height={16}
            />
            Acabamento
          </Button>

          <Button className="gap-2" variant="secondary">
            <Image
              src="/navalha.png"
              alt="Ícone de navalha"
              width={16}
              height={16}
            />
            Cabelo + Barba
          </Button>

          <Button className="gap-2" variant="secondary">
            <FootprintsIcon size={16} />
            Pézinho
          </Button>

          <Button className="gap-2" variant="secondary">
            <EyeIcon className="text-gray-400" size={16} />
            Sobrancelha
          </Button>

          <Button className="gap-2" variant="secondary">
            <Image
              src="/navalha.png"
              alt="Ícone de navalha"
              width={16}
              height={16}
            />
            Sombrancelha
          </Button>

          <Button className="gap-2" variant="secondary">
            <Image
              src="/navalha.png"
              alt="Ícone de navalha"
              width={16}
              height={16}
            />
            Platinado
          </Button>
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

        {/* Agendamento */}
        <h2 className="mb-3 mt-6 text-xs font-bold uppercase text-gray-400">
          Agendamentos
        </h2>
        <Card>
          <CardContent className="flex justify-between p-0">
            {/* Esquerda */}
            <div className="flex flex-col gap-2 p-5 py-5">
              <Badge className="rounded-full">Confirmado</Badge>
              <h3 className="font-semibold">Corte de Cabelo</h3>

              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="https://utfs.io/f/c97a2dc9-cf62-468b-a851-bfd2bdde775f-16p.png" />
                </Avatar>
                <p className="text-sm">Barbearia do Minhoca</p>
              </div>
            </div>

            {/* Direita */}
            <div className="flex flex-col items-center justify-center border-l-2 border-solid px-5">
              <p className="text-sm">Maio</p>
              <p className="text-2xl">20</p>
              <p className="text-sm">20:00</p>
            </div>
          </CardContent>
        </Card>

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

      <footer>
        <Card className="mt-10 px-2 py-6">
          <CardContent>
            <p className="text-sm text-gray-400">
              © 2026 Copyright <span className="font-bold">Barberia-M</span>
            </p>
          </CardContent>
        </Card>
      </footer>
    </div>
  )
}

export default Home
