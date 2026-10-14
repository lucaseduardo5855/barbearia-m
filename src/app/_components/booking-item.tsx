"use client"

import * as React from "react"

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
import { MapPin, Navigation, XCircle } from "lucide-react"

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
  layout?: "stack" | "rail"
}

//Todo receber agendamento como prop
const BookingItem = ({ booking, hideBarberShopInfo = false, layout = "stack" }: BookingItemProps) => {
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
      toast.success("Agendamento cancelado.")
    } catch (e) {
      toast.error("Não foi possível cancelar o agendamento. Tente novamente.")
    }
  }

  //Lida com alteração se foi aberta ou fechada apos o cancelamento
  const handleSheetOpenChange = (isOpen: boolean) => {
    setIsShetOpen(isOpen)
  }

  return (
    <>
      <Sheet open={isShetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetTrigger
          className={
            layout === "rail"
              ? "w-[min(92vw,440px)] shrink-0 md:w-[440px]"
              : "w-full min-w-0"
          }
        >
          <Card className="w-full min-w-0 rounded-xl border border-border bg-card transition-colors hover:bg-muted/30">
            <CardContent className="flex min-w-0 justify-between p-0">
              {/* Esquerda */}
              <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
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
                      className="w-fit rounded-full bg-secondary text-secondary-foreground hover:bg-secondary"
                      variant="outline"
                    >
                      Pagar no local
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
                      <p className="min-w-0 truncate text-xs text-muted-foreground">{barbershop.name}</p>
                    </div>
                  )}

                  {/* Nome do Serviço em destaque */}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Serviço</span>
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                      {booking.service.name}
                    </h3>
                  </div>

                  {/* Nome do Barbeiro (se houver algum associado) */}
                  {booking.barber && (
                    <div className="flex flex-col mt-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Profissional</span>
                    <p className="text-xs text-secondary-foreground">
                        {booking.barber.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Direita */}
              <div className="flex min-w-20 flex-col items-center justify-center border-l border-border bg-muted/45 px-4">
                <p className="text-xs font-semibold capitalize text-muted-foreground">
                  {format(booking.date, "MMM", { locale: ptBR })}
                </p>
                <p className="text-2xl font-extrabold tracking-[-0.03em]">
                  {format(booking.date, "dd", { locale: ptBR })}
                </p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {format(booking.date, "HH:mm", { locale: ptBR })}
                </p>
              </div>
            </CardContent>
          </Card>
        </SheetTrigger>

        <SheetContent className="w-full overflow-y-auto bg-card sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="text-left">
              Informações do agendamento
            </SheetTitle>
          </SheetHeader>
          <div className="mx-4 mt-6">
            <Card className="gap-0 rounded-xl bg-muted/45 shadow-none ring-1 ring-border">
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  <AvatarImage src={barbershop.imageUrl} />
                </Avatar>
                  <div className="min-w-0">
                    <h3 className="truncate font-extrabold">{barbershop.name}</h3>
                    <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground"><MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>{barbershop.address}</span></p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="w-full shrink-0 gap-2 sm:w-auto">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`} target="_blank" rel="noopener noreferrer"><Navigation className="size-3.5" /> Ver no mapa</a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="mt-5 p-3">
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
                barber={booking.barber}
                paymentMethod="Pagar no local"
              />
            </div>

            {barbershop.phones.map((phone, index) => (
              <PhoneItem key={index} phone={phone} />
            ))}
            {barbershop.phones[0] && (
              <Button asChild variant="outline" className="mt-3 w-full border-success/30 text-success hover:bg-success/10 hover:text-success">
                <a href={`https://wa.me/${barbershop.phones[0].replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Falar no WhatsApp</a>
              </Button>
            )}
          </div>

          <SheetFooter className="mt-6">
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
              <SheetClose asChild>
                <Button variant="outline" className="w-full sm:flex-1">
                  Voltar
                </Button>
              </SheetClose>

              {isConfirmed && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full gap-2 border-destructive/40 bg-transparent text-destructive hover:bg-destructive/10 hover:text-destructive sm:flex-1">
                      <XCircle className="size-4" /> Cancelar agendamento
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="w-[90%] sm:max-w-md">
                    <AlertDialogHeader className="text-center sm:text-center">
                      <AlertDialogTitle>
                        Você quer cancelar este agendamento?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Deseja continuar?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <AlertDialogFooter className="flex-row justify-center gap-3 sm:justify-center">
                      <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button
                          variant="destructive"
                          onClick={handleCancelBookingClick}
                        >
                          Confirmar cancelamento
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
