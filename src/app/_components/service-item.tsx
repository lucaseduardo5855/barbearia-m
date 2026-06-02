"use client"

import { Barbershop, BarbershopService, Booking } from "@prisma/client"
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
import { Calendar } from "@/components/ui/calendar"
import { ptBR } from "date-fns/locale"
import { useState, useRef, useEffect } from "react"
import { format, set, startOfDay } from "date-fns"
import { useSession } from "next-auth/react"
import { createBooking } from "../_actions/create-booking"
import { toast } from "sonner"
import { getBookings } from "../_actions/get-bookins"

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

// Função para gerar a lista de horários disponíveis com base nas reservas (bookings) do dia selecionado
const getTimeList = (bookings: Booking[]) => {
  const timelist = TIME_LIST.filter((time) => {
    const hour = Number(time.split(":")[0])
    const minute = Number(time.split(":")[1])

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

  // função para limpar os estados e abrir/fechar a sheet de reservar quando user clicar em reservar
  const handleBookingSheetOpenChange = () => {
    setSelectDay(undefined)
    setSelectTime(undefined)
    setDayBookings([])
    setBookingSheetIsOpen(false)
  }

  // Função para lidar com a seleção de horário, atualizando o estado selectTime com o horário escolhido pelo usuário
  const handleTimeSelect = (time: string) => {
    setSelectTime(time)
  }

  // Função para lidar com a criação da reserva (booking) quando o usuário confirmar a seleção de data e horário
  const handleCreateBooking = async () => {
    try {
      if (!selectDay || !selectTime) return
      const hours = selectTime.split(":")[0] // Converte o horário selecionado (ex: "14:00") em um array de números [14, 0] para facilitar a criação do objeto Date
      const minute = selectTime.split(":")[1]
      const newDate = set(selectDay, {
        hours: Number(hours),
        minutes: Number(minute),
      }) // Cria um novo objeto Date com a data selecionada e o horário selecionado
      await createBooking({
        serviceId: service.id,
        userId: (data?.user as any).id,
        date: newDate,
      })
      handleBookingSheetOpenChange() // Limpa os estados e fecha a sheet de reserva após criar a reserva com sucesso
      toast.success("Reserva criada com sucesso!")
    } catch (error) {
      console.log(error)
      toast.error("erro ao criar reserva!")
    }
  }

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
                onClick={() => setBookingSheetIsOpen(true)}
              >
                Reservar
              </Button>

              <SheetContent className="max-h-[80vh] w-[420px] md:w-[520px]">
                <SheetHeader className="px-0">
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
                    className="flex snap-x snap-mandatory gap-3 overflow-x-auto border-b border-solid p-5 px-5 [&::-webkit-scrollbar]:hidden"
                  >
                    {getTimeList(dayBookings).map((time) => (
                      <Button
                        key={time}
                        variant={selectTime === time ? "default" : "outline"}
                        className="shrink-0 snap-center rounded-full"
                        onClick={() => handleTimeSelect(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}

                {selectTime &&
                  selectDay && ( // Se um horário foi selecionado, exibe o resumo da reserva
                    <div className="p-5">
                      <Card>
                        <CardContent className="space-y-3 p-3">
                          <div className="flex items-center justify-between">
                            <h2 className="font-bold">{service.name}</h2>
                            <p className="text-sm font-semibold">
                              {Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(Number(service.price))}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <h2 className="text-sm text-gray-400">Data</h2>
                            <p className="text-sm">
                              {format(selectDay, "d 'de' MMMM", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>

                          <div className="flex items-center justify-between">
                            <h2 className="text-sm text-gray-400">Horário</h2>
                            <p className="text-sm">{selectTime}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <h2 className="text-sm text-gray-400">Barbearia</h2>
                            <p className="text-sm">{barberShop.name}</p>
                          </div>
                        </CardContent>
                      </Card>
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
  )
}

export default ServiceItem
