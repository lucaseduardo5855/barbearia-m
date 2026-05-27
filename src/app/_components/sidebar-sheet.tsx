"use client"

import { SheetClose } from "@/components/ui/sheet"
import { CalendarIcon, HomeIcon, LogOutIcon } from "lucide-react"
import { Button } from "./ui/button"
import { AvatarImage, Avatar } from "./ui/avatar"
import quickSearchOptions from "../_constants/search"
import Image from "next/image"
import Link from "next/link"

type Props = {
  open?: boolean
  onClose?: () => void
}

const SidebarSheet = ({ open = false, onClose }: Props) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden
      />
      <aside className="relative ml-auto w-3/4 max-w-sm overflow-y-auto bg-popover p-5">
        <div className="mb-4">
          <h3 className="text-left text-base font-medium">Menu</h3>
        </div>

        {/* Foto Perfil */}
        <div className="flex items-center gap-3 border-b border-solid py-5">
          <Avatar>
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
          <Button
            onClick={onClose}
            className="justify-start gap-2"
            variant="ghost"
          >
            <HomeIcon size={18} />
            Início
          </Button>
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
      </aside>
    </div>
  )
}

export default SidebarSheet
