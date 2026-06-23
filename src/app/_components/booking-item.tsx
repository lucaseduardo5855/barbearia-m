"use client"

import * as React from "react"
//test

import { Badge } from "./ui/badge"
import { Card, CardContent } from "./ui/card"
import { Avatar, AvatarImage } from "./ui/avatar"
import { Booking, Prisma } from "@prisma/client"
import { format, isFuture } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import Image from "next/image"
import PhoneItem from "./phone-item"
import { Button } from "./ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteBooking } from "../_actions/delete-booking"
import { toast } from "sonner"
import { useState } from "react"
import { useRouter } from "next/navigation"
import BookingSummary from "./booking-summary"

//Puxa o service para utilizarmos dentro de outros componentes
interface BookingItemProps {
  booking: Prisma.BookingGetPayload<{
    include: {
      service: {
        include: {
          barbershop: true
        }
      },
      barber: true
    }
  }>
  hideBarberShopInfo?: boolean
}

//Todo receber agendamento como prop
const BookingItem = ({ booking, hideBarberShopInfo = false }: BookingItemProps) => {
  const [isShetOpen, setIsShetOpen] = useState(false)

  const {
    service: { barbershop },
  } = booking

  const isFutureBooking = isFuture(booking.date)
  const isConfirmed = isFutureBooking && booking.status !== "CANCELLED"

  const router = useRouter()

  //Cancelamento da reserva
  const handleCancelBookingClick = async () => {
    try {
      await deleteBooking(booking.id)
      setIsShetOpen(false) //fecha o sheet
      toast.success("Reserva cancelada com sucesso")
    } catch (e) {
      console.log(e)
      toast.error("Erro ao cancelar reserva. Tente novamente.")
    }
  }

  //Lida com alteração se foi aberta ou fechada apos o cancelamento
  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsShetOpen(isOpen)
  }

  return (
    <>
      <Sheet open={isShetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetTrigger className="w-full min-w-[90%]">
          <Card className="min-w-[90%]">
            <CardContent className="flex justify-between p-0">
              {/* Esquerda */}
              <div className="flex flex-col gap-2 p-5 py-5">
                <div className="flex flex-col items-start gap-1">
                  {/* 1. Status Principal do Agendamento */}
                  <Badge
                    className="w-fit rounded-full"
                    variant={!isFutureBooking ? "secondary" : "default"}
                  >
                    {!isFutureBooking ? "Finalizado" : "Confirmado"}
                  </Badge>

                  {/* 2. Status do Pagamento (Apenas para agendamentos futuros) */}
                  {isFutureBooking && (
                    <Badge
                      className={`w-fit rounded-full ${booking.paymentMethod === "ONLINE"
                        ? booking.paymentStatus === "PAID"
                          ? "bg-green-500/20 text-green-500 border-none hover:bg-green-500/20"
                          : "bg-yellow-500/20 text-yellow-500 border-none hover:bg-yellow-500/20"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary"
                        }`}
                      variant="outline"
                    >
                      {booking.paymentMethod === "ONLINE"
                        ? booking.paymentStatus === "PAID"
                          ? "Pagamento confirmado"
                          : "Aguardando Pagamento"
                        : "Pagar no local"}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 items-start text-left">
                  {/* Se hideBarberShopInfo for falso, exibe a logo e o nome da barbearia */}
                  {!hideBarberShopInfo && (
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={barbershop.imageUrl} />
                      </Avatar>
                      <p className="text-xs text-gray-400">{barbershop.name}</p>
                    </div>
                  )}

                  {/* Nome do Serviço em destaque */}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Serviço</span>
                    <h3 className="text-sm font-semibold text-white">
                      {booking.service.name}
                    </h3>
                  </div>

                  {/* Nome do Barbeiro (se houver algum associado) */}
                  {booking.barber && (
                    <div className="flex flex-col mt-0.5">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Profissional</span>
                      <p className="text-xs text-gray-300">
                        {booking.barber.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Direita */}
              <div className="flex flex-col items-center justify-center border-l-2 border-solid px-5">
                <p className="text-sm capitalize">
                  {format(booking.date, "MMM", { locale: ptBR })}
                </p>
                <p className="text-2xl">
                  {format(booking.date, "dd", { locale: ptBR })}
                </p>
                <p className="text-sm">
                  {format(booking.date, "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>
        </SheetTrigger>

        <SheetContent>
          <SheetHeader>
            <SheetTitle className="text-left">
              Informações da Reserva
            </SheetTitle>
          </SheetHeader>
          <div className="relative mx-4 mt-6 flex h-[180px] items-end rounded-xl">
            <Image
              alt={`Mapa da Barbearia ${barbershop.name}`}
              src="/map.png"
              fill
              className="rounded-xl object-cover"
            />

            <Card className="z-50 mx-5 mb-3 w-full rounded-xl">
              <CardContent className="flex items-center gap-3 px-5 py-3">
                <Avatar>
                  <AvatarImage src={barbershop.imageUrl} />
                </Avatar>
                <div>
                  <h3 className="font-bold">{barbershop.name}</h3>
                  <p className="text-xs">{barbershop.address}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6 p-3">
            <Badge
              className="rounded-full"
              variant={isConfirmed ? "default" : "secondary"}
            >
              {isConfirmed ? "Confirmado" : "Finalizado"}
            </Badge>

            {/*Quadrado de agendamento */}
            <div className="mb-6 mt-3">
              <BookingSummary
                barbershop={barbershop}
                service={booking.service}
                selectDay={booking.date}
              />
            </div>

            {barbershop.phones.map((phone, index) => (
              <PhoneItem key={index} phone={phone} />
            ))}
          </div>

          <SheetFooter className="mt-6">
            <div className="flex items-center gap-3 ">
              <SheetClose asChild>
                <Button variant="outline" className="flex-1">
                  Voltar
                </Button>
              </SheetClose>

              {isConfirmed && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      Cancelar Reserva
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="w-[90%]">
                    <AlertDialogHeader className="text-center sm:text-center">
                      <AlertDialogTitle>
                        Você quer cancelar sua reserva?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja fazer o cancelamento? Essa ação é
                        irreversível.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <AlertDialogFooter className="flex-row justify-center gap-3 sm:justify-center">
                      <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button
                          variant="destructive"
                          onClick={handleCancelBookingClick}
                        >
                          Confirmar
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default BookingItem
