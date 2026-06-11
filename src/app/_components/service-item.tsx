"use client"

import {
  Barbershop,
  BarbershopService,
  Booking,
  PaymentMethod,
} from "@prisma/client"
import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { createStripeCheckout } from "../_actions/create-stripe-checkout"
import { Calendar } from "@/components/ui/calendar"
import { ptBR } from "date-fns/locale"
import { useState, useRef, useEffect, useMemo } from "react"
import { format, getTime, isPast, isToday, set, startOfDay } from "date-fns"
import { useSession } from "next-auth/react"
import { createBooking } from "../_actions/create-booking"
import { toast } from "sonner"
import { getBookings } from "../_actions/get-bookins"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import SignInDiaLog from "./sign-in-dialong"
import BookingSummary from "./booking-summary"

interface ServiceItemProps {
  service: BarbershopService
  barberShop: Pick<Barbershop, "name">
}

const TIME_LIST = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
]

interface GetTimeListProps {
  bookings: Booking[]
  selectDay: Date
}

// Função para gerar a lista de horários disponíveis com base nas reservas (bookings) do dia selecionado
const getTimeList = ({ bookings, selectDay }: GetTimeListProps) => {
  const timelist = TIME_LIST.filter((time) => {
    const hour = Number(time.split(":")[0])
    const minute = Number(time.split(":")[1])

    //Bloqueio de horarios anteriores do atual
    const timeIsOnThePast = isPast(
      set(new Date(), { hours: hour, minutes: minute }),
    )
    if (timeIsOnThePast && isToday(selectDay)) {
      return false
    }

    //Possui reserva no horario atual
    const hasBookingOnCurrentTime = bookings.some(
      (booking) =>
        booking.date.getHours() === hour &&
        booking.date.getMinutes() === minute,
    )
    if (hasBookingOnCurrentTime) {
      return false
    }
    return true
  })
  return timelist
}

const ServiceItem = ({ service, barberShop }: ServiceItemProps) => {
  const [signInDialogIsOpen, setSignInDialogIsOpen] = useState(false)

  // Hook para obter os dados da sessão do usuário, como nome, email e imagem de perfil
  const { data } = useSession()

  // Estado para armazenar a data selecionada no calendário
  const [selectDay, setSelectDay] = useState<Date | undefined>(undefined)

  // Estado para armazenar o horário selecionado
  const [selectTime, setSelectTime] = useState<string | undefined>(undefined)

  // Estado para armazenar as reservas (bookings) do dia selecionado
  const [dayBookings, setDayBookings] = useState<Booking[]>([])

  //
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ON_SITE")

  useEffect(() => {
    if (!selectDay) return
    const fetch = async () => {
      const bookings = await getBookings({
        date: selectDay,
        serviceId: service.id,
      })
      setDayBookings(bookings)
    }
    fetch()
  }, [selectDay, service.id])

  // Junta a data (dia) e o horário (string) selecionados em um único objeto Date completo,
  // recriando esse valor automaticamente sempre que o usuário trocar o dia ou a hora.
  const selectDate = useMemo(() => {
    if (!selectDay || !selectTime) return

    return set(selectDay, {
      hours: Number(selectTime.split(":")[0]),
      minutes: Number(selectTime.split(":")[1]),
    })
  }, [selectDay, selectTime])

  //
  const handleBookingClick = () => {
    if (data?.user) {
      return setBookingSheetIsOpen(true)
    }
    return setSignInDialogIsOpen(true)
  }

  // função para limpar os estados e abrir/fechar a sheet de reservar quando user clicar em reservar
  const handleBookingSheetOpenChange = () => {
    setSelectDay(undefined)
    setSelectTime(undefined)
    setDayBookings([])
    setPaymentMethod("ON_SITE")
    setBookingSheetIsOpen(false)
  }

  // Função para lidar com a seleção de horário, atualizando o estado selectTime com o horário escolhido pelo usuário
  const handleTimeSelect = (time: string) => {
    setSelectTime(time)
  }

  // Função para lidar com a criação da reserva (booking) quando o usuário confirmar a seleção de data e horário
  const handleCreateBooking = async () => {
    try {
      if (!selectDate) return

      // cria a reserva no banco de dados primeiro
      const booking = await createBooking({
        serviceId: service.id,
        date: selectDate,
        paymentMethod,
      })

      // se a forma de pagamento for online, cria um checkout no stripe e redireciona
      if (paymentMethod === "ONLINE") {
        const checkoutUrl = await createStripeCheckout({
          products: [service],
          bookingId: booking.id,
        })

        // se o checkout for criado com sucesso, redireciona o usuário para a página de pagamento
        if (checkoutUrl) {
          window.location.href = checkoutUrl
          return
        }

        toast.error("Erro ao gerar link de pagamento!")
        return
      }

      // Limpa os estados e fecha a sheet de reserva após criar a reserva com sucesso (pagamento no local)
      handleBookingSheetOpenChange()
      toast.success("Reserva realizada com sucesso!")
    } catch (error) {
      console.log(error)
      toast.error("erro ao criar reserva!")
    }
  }

  // Memoriza a lista de horários (cache) para evitar recálculos pesados. Só executa novamente se o dia ou as reservas mudarem.
  const timeList = useMemo(() => {
    if (!selectDay) return []
    return getTimeList({
      bookings: dayBookings,
      selectDay,
    })
  }, [dayBookings, selectDay])

  // refs para scroll por drag
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const isDown = useRef(false)
  const startX = useRef(0)
  const scrollLeftRef = useRef(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onDown = (e: MouseEvent) => {
      // apenas botão esquerdo
      if (e.button !== 0) return
      isDown.current = true
      startX.current = e.pageX - el.offsetLeft
      scrollLeftRef.current = el.scrollLeft
      el.classList.add("cursor-grabbing")
      el.classList.remove("cursor-grab")
      e.preventDefault()
    }

    const onUp = () => {
      isDown.current = false
      el.classList.remove("cursor-grabbing")
      el.classList.add("cursor-grab")
    }

    const onMove = (e: MouseEvent) => {
      if (!isDown.current) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      const walk = (x - startX.current) * 1 // sensibilidade
      el.scrollLeft = scrollLeftRef.current - walk
    }

    el.addEventListener("mousedown", onDown)
    window.addEventListener("mouseup", onUp)
    window.addEventListener("mousemove", onMove)

    // cursor inicial
    el.classList.add("cursor-grab")

    return () => {
      el.removeEventListener("mousedown", onDown)
      window.removeEventListener("mouseup", onUp)
      window.removeEventListener("mousemove", onMove)
    }
  }, [])

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
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">{service.name}</h3>
            <p className="text-sm text-gray-400">{service.description}</p>

            {/* PREÇO E BOTÃO */}
            <div className="flex items-center justify-between gap-1 font-semibold text-primary">
              <p>
                {Intl.NumberFormat("pt-BR", {
                  // Formata o preço do serviço para o formato de moeda brasileira (BRL)
                  style: "currency",
                  currency: "BRL",
                }).format(Number(service.price))}
              </p>

              <Sheet
                open={bookingSheetIsOpen}
                onOpenChange={handleBookingSheetOpenChange}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleBookingClick}
                >
                  Reservar
                </Button>

                <SheetContent className="max-h-[80vh] w-[420px] overflow-y-auto md:w-[520px] [&::-webkit-scrollbar]:hidden">
                  <SheetHeader className="ml-6 p-5 px-0">
                    <SheetTitle>Fazer Reserva</SheetTitle>
                  </SheetHeader>

                  <div className="flex justify-center border-b border-solid py-5">
                    {/* A caixa invisível de 300px centralizada */}
                    <div className="w-[300px]">
                      <Calendar
                        mode="single"
                        locale={ptBR}
                        /* O w-full aqui garante que o calendário ocupe os 300px inteiros e fique no meio */
                        className="w-full capitalize [&_table]:w-full"
                        selected={selectDay}
                        onSelect={setSelectDay}
                        disabled={{ before: startOfDay(new Date()) }}
                      />
                    </div>
                  </div>

                  {selectDay && (
                    <div
                      ref={scrollRef}
                      onWheel={(e) => {
                        // converte scroll vertical em horizontal para facilitar uso do trackpad/wheel
                        if (Math.abs(e.deltaY) > 0) {
                          ;(e.currentTarget as HTMLDivElement).scrollLeft +=
                            e.deltaY
                        }
                      }}
                      className="grid grid-cols-4 gap-3 border-b border-solid p-5"
                    >
                      {timeList.length > 0 ? (
                        timeList.map((time) => (
                          <Button
                            key={time}
                            variant={
                              selectTime === time ? "default" : "outline"
                            }
                            className="shrink-0 snap-center rounded-full"
                            onClick={() => handleTimeSelect(time)}
                          >
                            {time}
                          </Button>
                        ))
                      ) : (
                        <p className="text-xs">
                          Não há horários disponíveis para este dia
                        </p>
                      )}
                    </div>
                  )}

                  {selectDate && ( // Se um horário foi selecionado, exibe o resumo da reserva
                    <div className="space-y-3 p-5">
                      <BookingSummary
                        barbershop={barberShop}
                        service={service}
                        selectDay={selectDate}
                      />

                      {/* Seletor de Método de Pagamento */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase text-gray-400">
                          Método de Pagamento
                        </h4>
                        <div className="flex gap-3">
                          <Button
                            type="button"
                            className="flex-1"
                            variant={
                              paymentMethod === "ON_SITE"
                                ? "default"
                                : "outline"
                            }
                            onClick={() => setPaymentMethod("ON_SITE")}
                          >
                            Pagar no local
                          </Button>
                          <Button
                            type="button"
                            className="flex-1"
                            variant={
                              paymentMethod === "ONLINE" ? "default" : "outline"
                            }
                            onClick={() => setPaymentMethod("ONLINE")}
                          >
                            Pagar online (Stripe)
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <SheetFooter className="-mt-5 px-5">
                    <Button
                      onClick={handleCreateBooking}
                      disabled={!selectDay || !selectTime}
                    >
                      Confirmar
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
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
