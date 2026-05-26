import Image from "next/image"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { CalendarIcon, HomeIcon, LogOutIcon, MenuIcon } from "lucide-react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import quickSearchOptions from "../_constants/search"
import { Avatar, AvatarImage } from "./ui/avatar"
import Link from "next/link"

const Header = () => {
  return (
    <Card>
      <CardContent className="flex flex-row items-center justify-between p-5">
        <Image
          src="/logo.png"
          alt="Logo da barbearia"
          height={18}
          width={120}
        />
        {/* Menu Hamburger para dispositivos móveis */}
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto p-5">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>

            {/* Foto Perfil */}
            <div className="flex items-center gap-3 border-b border-solid py-5">
              <Avatar className="ml-2">
                <AvatarImage src="/avatar.png" />
              </Avatar>

              {/* Informações do Usuário */}
              <div>
                <p className="font-bold">Lucas Eduardo </p>
                <p className="text-sm text-gray-400">lucas.eduardo@gmail.com</p>
              </div>
            </div>

            {/* Botões do Menu */}
            <div className="flex flex-col gap-4 border-b border-solid py-5">
              <SheetClose asChild>
                <Button asChild className="justify-start gap-2" variant="ghost">
                  <Link href="/">
                    <HomeIcon size={18} />
                    Início
                  </Link>
                </Button>
              </SheetClose>
              <Button className="justify-start gap-2" variant="ghost">
                <CalendarIcon size={18} />
                Agendamentos
              </Button>
            </div>

            {/* Botoes do Menu - Opções Rápidas */}
            <div className="flex flex-col gap-4 border-b border-solid py-5">
              {quickSearchOptions.map((option) => (
                // eslint-disable-next-line react/jsx-key
                <Button
                  key={option.title}
                  className="justify-start gap-2"
                  variant="ghost"
                >
                  <Image
                    alt={option.title}
                    src={option.imageUrl}
                    height={18}
                    width={18}
                  />
                  {option.title}
                </Button>
              ))}
            </div>

            {/* Botoes do Menu - Sair da Conta */}
            <div className="flex flex-col gap-2 py-5">
              <Button variant="ghost" className="justify-start gap-2">
                <LogOutIcon size={18} />
                Sair da Conta
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  )
}

//composition pattern
export default Header
