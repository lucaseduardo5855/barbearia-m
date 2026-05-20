import { Input } from "./_components/ui/input"
import Header from "./_components/header"
import { Button } from "./_components/ui/button"
import { SearchIcon } from "lucide-react"
import Image from "next/image"

const Home = () => {
  return (
    <div>
      <Header />
      <div className="px-5">
        <h1 className="mt-5 text-xl font-bold">Olá, Lucas!</h1>
        <p>Quarta-feira, 20 de maio.</p>

        <div className="mt-6 flex items-center gap-2">
          <Input placeholder="Faça sua Busca..." />
          <Button size="icon">
            <SearchIcon />
          </Button>
        </div>

        <div className="relative mt-6 h-[150px] w-full">
          <Image
            alt="Agende nos melhores com FSW Barber"
            src="/Banner-01.png"
            fill
            className="rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  )
}

export default Home
