"use client"

import {
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { CalendarIcon, HomeIcon, LogInIcon, LogOutIcon } from "lucide-react"
import { Button } from "./ui/button"
import { AvatarImage, Avatar } from "./ui/avatar"
import quickSearchOptions from "../_constants/search"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const SidebarSheet = () => {
  return (
    <SheetContent className="overflow-y-auto p-5">
      <SheetHeader>
        <SheetTitle className="text-left">Menu</SheetTitle>
      </SheetHeader>

      {/* Foto Perfil e Informações do Usuário */}
      <div className="flex items-center justify-between gap-3 border-b border-solid py-5">
        <h2 className="text-lg font-bold">Olá, Realize seu Login!</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="icon">
              <LogInIcon />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[90%]">
            <DialogHeader>
              <DialogTitle>Faça login na plataforma</DialogTitle>
              <DialogDescription>
                Conecte-se usando sua conta do Google.
              </DialogDescription>
            </DialogHeader>

            <Button variant="outline" className="gap-2 font-bold">
              <Image
                alt="Fazer login com o Google"
                src="/Google.svg"
                width={18}
                height={18}
              />
              Google
            </Button>
          </DialogContent>
        </Dialog>

        {/*<Avatar>
          <AvatarImage src="/avatar.png" />
        </Avatar>

        <div>
          <p className="font-bold">Lucas Eduardo</p>
          <p className="text-sm text-gray-400">lucas.eduardo@gmail.com</p>
        </div>
      */}
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
        <SheetClose asChild>
          <Button asChild className="justify-start gap-2" variant="ghost">
            <Link href="/appointments">
              <CalendarIcon size={18} />
              Agendamentos
            </Link>
          </Button>
        </SheetClose>
      </div>

      {/* Botoes do Menu - Opções Rápidas */}
      <div className="flex flex-col gap-4 border-b border-solid py-5">
        {quickSearchOptions.map((option) => (
          <SheetClose key={option.title} asChild>
            <Button className="justify-start gap-2" variant="ghost" asChild>
              <Link href={`/barbershops?service=${option.title}`}>
                <Image
                  alt={option.title}
                  src={option.imageUrl}
                  height={18}
                  width={18}
                />
                {option.title}
              </Link>
            </Button>
          </SheetClose>
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
  )
}

export default SidebarSheet
