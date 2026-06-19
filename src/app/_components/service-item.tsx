"use client"

import { Barbershop, BarbershopService } from "@prisma/client"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import SignInDiaLog from "./sign-in-dialong"

interface ServiceItemProps {
  service: BarbershopService
  barberShop: Barbershop
}

const ServiceItem = ({ service, barberShop }: ServiceItemProps) => {
  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)
  const { data } = useSession()
  const router = useRouter()

  const handleBookingClick = () => {
    if (data?.user) {
      // Redireciona diretamente para o fluxo unificado de etapas
      router.push(`/${barberShop.slug}/agendar?serviceId=${service.id}`)
      return
    }
    setSignInDialogIsOpen(true)
  }

  return (
    <>
      <Card>
        <CardContent className="flex items-center gap-3 p-3">
          {/* IMAGEM */}
          <div className="relative max-h-[110px] min-h-[110px] min-w-[110px] max-w-[110px]">
            <Image
              src={service.imageUrl}
              alt={service.name}
              fill
              className="rounded-xl object-cover"
            />
          </div>

          {/* DIREITA */}
          <div className="space-y-2 flex-1">
            <h3 className="text-sm font-semibold">{service.name}</h3>
            <p className="text-sm text-gray-400">{service.description}</p>

            {/* PREÇO E BOTÃO */}
            <div className="flex items-center justify-between gap-1 font-semibold text-primary">
              <p>
                {Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(Number(service.price))}
              </p>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleBookingClick}
              >
                Reservar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={signInDialogIsOpen} onOpenChange={setSignInDialogIsOpen}>
        <DialogContent className="w-[90%]">
          <SignInDiaLog />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ServiceItem
