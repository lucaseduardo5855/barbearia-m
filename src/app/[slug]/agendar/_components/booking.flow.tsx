"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Barbershop, BarbershopService, Barber } from "@prisma/client"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Badge } from "@/app/_components/ui/badge"
import {
  BanknoteIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  MapPinIcon,
  ScissorsIcon,
  UserRoundIcon,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { ptBR } from "date-fns/locale"
import { format, isPast, isToday, set, startOfDay } from "date-fns"
import { getBookings } from "@/app/_actions/get-bookins"
import { createBooking } from "@/app/_actions/create-booking"
import BookingSummary from "@/app/_components/booking-summary"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import SignInDiaLog from "@/app/_components/sign-in-dialong"
import { openingTimeSlots } from "@/lib/opening-hours"
import { Input } from "@/app/_components/ui/input"
import Link from "next/link"

const BOOKING_STEPS = ["Serviço", "Profissional", "Horário", "Confirmar"]

// Estendemos os tipos da barbearia para incluir os serviços e barbeiros que buscamos no banco
interface BookingFlowProps {
  barbershop: Barbershop & {
    services: BarbershopService[]
    barbers: Barber[]
  }
}

export default function BookingFlow({ barbershop }: BookingFlowProps) {
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // Estados para controlar o passo atual e as escolhas do cliente
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] =
    useState<BarbershopService | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Pré-seleciona o serviço caso seja passado via query param (?serviceId=xxx)
  useEffect(() => {
    const serviceId = searchParams.get("serviceId")
    if (serviceId) {
      const service = barbershop.services.find((s) => s.id === serviceId)
      if (service) {
        setSelectedService(service)
        setStep(2)
      }
    }
  }, [searchParams, barbershop.services])

  // Função para voltar um passo atrás no botão "Voltar"
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    } else {
      const origin = searchParams.get("origin")
      const barbershopId = searchParams.get("barbershopId")

      // Se veio do marketplace principal, volta para a página do marketplace da barbearia
      if (origin === "marketplace" && barbershopId) {
        router.push(`/barbershops/${barbershopId}`)
      } else {
        // Se veio do Instagram, volta para a landing page do inquilino (exclusiva)
        router.push(`/${barbershop.slug}`)
      }
    }
  }

  // Estado para armazenar os agendamentos já ocupados do dia selecionado
  const [dayBookings, setDayBookings] = useState<any[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState(false)
  const [availabilityRetry, setAvailabilityRetry] = useState(0)

  const paymentMethod = "ON_SITE"
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)
  const [emailReminderConsent, setEmailReminderConsent] = useState(false)
  const [whatsappReminderConsent, setWhatsappReminderConsent] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [contactPhone, setContactPhone] = useState("")
  const router = useRouter()

  // Busca no banco de dados quais horários já estão ocupados do dia selecionado
  useEffect(() => {
    if (!selectedDate) return

    let cancelled = false
    setAvailabilityLoading(true)
    setAvailabilityError(false)
    setDayBookings([])

    getBookings({
      date: selectedDate,
      serviceId: selectedService?.id || "",
      barberId: selectedBarber?.id || null,
      days: 4,
    })
      .then((bookings) => {
        if (!cancelled) setDayBookings(bookings)
      })
      .catch(() => {
        if (!cancelled) setAvailabilityError(true)
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedDate, selectedService, selectedBarber?.id, availabilityRetry])

  // Filtra e gera apenas os horários livres
  const availableTimes = useMemo(() => {
    if (!selectedDate) return []

    return openingTimeSlots(selectedDate, barbershop.openingHours).filter(
      (time) => {
        const hour = Number(time.split(":")[0])
        const minute = Number(time.split(":")[1])

        // 1. Bloqueia horários passados se o dia for hoje
        const timeIsPast = isPast(
          set(new Date(), { hours: hour, minutes: minute }),
        )
        if (timeIsPast && isToday(selectedDate)) {
          return false
        }

        // 2. Bloqueia horários que já possuem agendamento no banco
        const hasBooking = dayBookings.some(
          (booking) =>
            new Date(booking.date).toDateString() ===
              selectedDate.toDateString() &&
            new Date(booking.date).getHours() === hour &&
            new Date(booking.date).getMinutes() === minute,
        )

        return !hasBooking
      },
    )
  }, [dayBookings, selectedDate, barbershop.openingHours])

  // Junta o dia selecionado com a string de horário (ex: "09:00") para criar um objeto Date completo
  const selectDate = useMemo(() => {
    if (!selectedDate || !selectedTime) return null

    return set(selectedDate, {
      hours: Number(selectedTime.split(":")[0]),
      minutes: Number(selectedTime.split(":")[1]),
      seconds: 0,
      milliseconds: 0,
    })
  }, [selectedDate, selectedTime])

  const availabilityReady = !availabilityLoading && !availabilityError

  // Função que é disparada ao clicar no botão final de agendamento
  const submitBooking = useCallback(async () => {
    try {
      if (!selectDate || !selectedService) {
        toast.error("Escolha o serviço, a data e o horário antes de confirmar.")
        return
      }
      setIsSubmitting(true) // Ativa a trava de segurança para evitar cliques duplos

      // 1. Cria a reserva no banco de dados chamando a nossa Server Action
      await createBooking({
        serviceId: selectedService.id,
        date: selectDate,
        paymentMethod,
        barberId: selectedBarber?.id || null, // Associa o barbeiro selecionado à reserva
        emailReminderConsent,
        whatsappReminderConsent,
        marketingConsent,
        phone: contactPhone || undefined,
      })

      // 2. Se for pagamento no local, finaliza direto
      toast.success(
        "Agendamento confirmado! Você será direcionado às suas reservas.",
      )

      // Redireciona o usuário para o histórico de reservas desta barbearia
      router.push(`/${barbershop.slug}/reservas`)
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível confirmar o agendamento. Verifique o horário e tente novamente.",
      )
      setIsSubmitting(false) // Destrava o botão caso dê algum erro
    }
  }, [
    barbershop.slug,
    paymentMethod,
    router,
    selectDate,
    selectedBarber?.id,
    selectedService,
    emailReminderConsent,
    whatsappReminderConsent,
    marketingConsent,
    contactPhone,
  ])

  const handleCreateBooking = async () => {
    if (!session?.user) {
      setPendingConfirmation(true)
      setLoginOpen(true)
      return
    }

    await submitBooking()
  }

  useEffect(() => {
    if (pendingConfirmation && session?.user && !loginOpen) {
      setPendingConfirmation(false)
      void submitBooking()
    }
  }, [loginOpen, pendingConfirmation, session?.user, submitBooking])

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between gap-3">
        <Button
          aria-label="Voltar para a etapa anterior"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={handleBack}
        >
          <ChevronLeftIcon className="h-5 w-5 text-foreground" />
        </Button>
        <p className="text-sm font-semibold text-muted-foreground">
          Etapa {step} de {BOOKING_STEPS.length}
        </p>
      </div>

      <ol className="grid grid-cols-4 gap-2" aria-label="Etapas do agendamento">
        {BOOKING_STEPS.map((label, index) => {
          const isCurrent = index + 1 === step
          const isComplete = index + 1 < step
          return (
            <li key={label} className="min-w-0">
              <div
                className={`h-1.5 rounded-full ${isCurrent || isComplete ? "bg-primary" : "bg-muted"}`}
                aria-current={isCurrent ? "step" : undefined}
              />
              <span
                className={`mt-2 block truncate text-[10px] font-semibold sm:text-xs ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>

      {/* Renderização Condicional da Etapa Ativa */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Escolha um serviço</h2>
          <p className="text-sm text-muted-foreground">
            Selecione o serviço que você quer agendar.
          </p>

          {/* Aqui vamos listar os serviços da barbearia no próximo passo */}
          <div className="space-y-3">
            {barbershop.services.map((service) => (
              <Card
                key={service.id}
                className="cursor-pointer rounded-xl border border-border bg-card shadow-none transition-colors hover:border-border/90 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedService(service)
                  setStep(2) // Avança para o Passo 2 após escolher o serviço
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setSelectedService(service)
                    setStep(2)
                  }
                }}
              >
                <CardContent className="flex min-h-24 items-center gap-4 p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <ScissorsIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold">{service.name}</h3>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {service.description}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(service.price))}
                    </p>
                  </div>
                  <ChevronLeftIcon className="size-4 rotate-180 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-in fade-in space-y-4 duration-300">
          <h2 className="text-lg font-semibold">Escolha um profissional</h2>
          <p className="text-sm text-muted-foreground">
            Serviço:{" "}
            <strong className="font-semibold text-foreground">
              {selectedService?.name}
            </strong>
          </p>

          <div className="space-y-3">
            {/* Opção para escolher qualquer profissional */}
            <Card
              className="cursor-pointer rounded-xl border border-border bg-card shadow-none transition-colors hover:border-border/90 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedBarber(null) // null significa "Qualquer Profissional"
                setStep(3) // Avança para o passo 3 (calendário)
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setSelectedBarber(null)
                  setStep(3)
                }
              }}
            >
              <CardContent className="flex min-h-20 items-center gap-3 p-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  <UserRoundIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">
                    Qualquer Profissional
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Encontre o primeiro horário disponível.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Listando os barbeiros cadastrados */}
            {barbershop.barbers.map((barber) => (
              <Card
                key={barber.id}
                className="cursor-pointer rounded-xl border border-border bg-card shadow-none transition-colors hover:border-border/90 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSelectedBarber(barber) // Guarda o barbeiro selecionado
                  setStep(3) // Avança para o calendário
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setSelectedBarber(barber)
                    setStep(3)
                  }
                }}
              >
                <CardContent className="flex min-h-20 items-center gap-3 p-4">
                  {/* Imagem do profissional */}
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image
                      src={barber.imageUrl}
                      alt={barber.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{barber.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Profissional disponível
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-in fade-in space-y-6 duration-300">
          <div className="flex flex-col items-start gap-3 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
            <h2 className="text-lg font-semibold">
              Escolha uma data e um horário
            </h2>

            {/* Botão para abrir o seletor de calendário tradicional caso o cliente prefira */}
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-primary hover:bg-primary/10"
              onClick={() => {
                // Se já tiver uma data customizada, limpa para voltar à lista sugerida, senão define hoje
                if (selectedDate && !isToday(selectedDate)) {
                  setSelectedDate(new Date())
                  toast.info("Próximas datas disponíveis novamente.")
                } else {
                  // Define uma data de amanhã temporária para abrir o calendário
                  const tomorrow = new Date()
                  tomorrow.setDate(tomorrow.getDate() + 1)
                  setSelectedDate(tomorrow)
                  toast.info("Escolha uma data no calendário.")
                }
              }}
            >
              {selectedDate &&
              !isToday(selectedDate) &&
              selectedDate.getDate() !== new Date().getDate()
                ? "Ver datas sugeridas"
                : "Outra data"}
            </Button>
          </div>

          {availabilityLoading && (
            <p role="status" className="text-sm text-muted-foreground">
              Buscando horários disponíveis...
            </p>
          )}

          {availabilityError && (
            <div
              role="alert"
              className="space-y-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4"
            >
              <p className="text-sm text-destructive">
                Não foi possível carregar os horários. Tente novamente.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAvailabilityRetry((value) => value + 1)}
              >
                Tentar novamente
              </Button>
            </div>
          )}

          {availabilityReady && (
            <>
              {/* SELETOR DE CALENDÁRIO TRADICIONAL (Caso o cliente queira uma data distante específica) */}
              {selectedDate &&
              !isToday(selectedDate) &&
              selectedDate.getDate() !== new Date().getDate() ? (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="w-full max-w-[320px] rounded-xl bg-muted/45 p-3 ring-1 ring-border">
                      <Calendar
                        mode="single"
                        locale={ptBR}
                        className="w-full capitalize [&_table]:w-full"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          setSelectedTime(null)
                        }}
                        disabled={(date) =>
                          date < startOfDay(new Date()) ||
                          openingTimeSlots(date, barbershop.openingHours)
                            .length === 0
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Horários para{" "}
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </h3>

                    {availableTimes.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 min-[420px]:grid-cols-4 sm:gap-3">
                        {availableTimes.map((time) => (
                          <Button
                            key={time}
                            variant={
                              selectedTime === time ? "default" : "outline"
                            }
                            className={`min-h-11 rounded-lg py-4 transition-colors ${
                              selectedTime === time
                                ? "bg-primary font-semibold text-primary-foreground"
                                : "text-secondary-foreground hover:border-primary"
                            }`}
                            onClick={() => {
                              setSelectedTime(time)
                              setStep(4)
                            }}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        Nenhum horário disponível nesta data. Escolha outro dia.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // LISTA DE DATAS SUGERIDAS (Hoje e os próximos 3 dias)
                <div className="space-y-6">
                  {[0, 1, 2, 3].map((daysToAdd) => {
                    const targetDate = new Date()
                    targetDate.setDate(targetDate.getDate() + daysToAdd)

                    // Filtra os horários livres para este dia específico da lista
                    const dayTimes = openingTimeSlots(
                      targetDate,
                      barbershop.openingHours,
                    ).filter((time) => {
                      const hour = Number(time.split(":")[0])
                      const minute = Number(time.split(":")[1])

                      // Bloqueia se for no passado (se for hoje)
                      const timeIsPast = isPast(
                        set(new Date(), { hours: hour, minutes: minute }),
                      )
                      if (timeIsPast && daysToAdd === 0) {
                        return false
                      }

                      // Checa se já possui agendamento no banco
                      const hasBooking = dayBookings.some((booking) => {
                        const bookingDate = new Date(booking.date)
                        return (
                          bookingDate.getDate() === targetDate.getDate() &&
                          bookingDate.getMonth() === targetDate.getMonth() &&
                          bookingDate.getHours() === hour &&
                          bookingDate.getMinutes() === minute
                        )
                      })

                      return !hasBooking
                    })

                    return (
                      <div
                        key={daysToAdd}
                        className="space-y-3 rounded-xl bg-muted/45 p-3 ring-1 ring-border sm:p-4"
                      >
                        {/* Cabeçalho do Dia (Ex: Quinta-feira, 18 de Junho) */}
                        <div className="flex items-center justify-between border-b border-secondary/50 pb-2">
                          <span className="text-sm font-bold capitalize text-foreground">
                            {format(targetDate, "EEEE, d 'de' MMMM", {
                              locale: ptBR,
                            })}
                          </span>
                          {daysToAdd === 0 && (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                              Hoje
                            </span>
                          )}
                        </div>

                        {/* Grade Estilo Grid de Horários Livres (Sem Barra de Rolar) */}
                        {dayTimes.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 pt-1 min-[360px]:grid-cols-3 sm:grid-cols-4">
                            {dayTimes.map((time) => (
                              <Button
                                key={time}
                                variant="outline"
                                className="min-h-11 w-full rounded-lg py-2 text-xs text-secondary-foreground hover:border-primary"
                                onClick={() => {
                                  setSelectedDate(targetDate)
                                  setSelectedTime(time)
                                  setStep(4)
                                }}
                              >
                                {time}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <p className="py-1 text-xs text-muted-foreground">
                            Nenhum horário disponível nesta data. Escolha outro
                            dia.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="animate-in fade-in space-y-6 duration-300">
          <h2 className="text-lg font-semibold">
            Revise e confirme seu agendamento
          </h2>
          <p className="-mt-4 text-sm text-muted-foreground">
            Confira o serviço, profissional, data e horário antes de confirmar.
          </p>

          {/* 1. Componente de Resumo Reutilizado do seu projeto */}
          {selectedService && selectDate && (
            <BookingSummary
              barbershop={barbershop}
              service={selectedService}
              selectDay={selectDate}
              barber={selectedBarber}
              paymentMethod="Pagar no local"
            />
          )}

          {/* 2. Informações Claras de Pagamento Presencial */}
          <Button
            asChild
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPinIcon className="size-4 text-primary" /> Ver localização no
              Google Maps
            </a>
          </Button>

          <div className="space-y-2 rounded-xl bg-success/10 p-4 ring-1 ring-success/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BanknoteIcon className="h-4 w-4 text-success" />
                <span>Pagamento no local</span>
              </div>
              <Badge className="border-none bg-success/20 text-xs font-semibold text-success hover:bg-success/20">
                Pagar no local
              </Badge>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Nenhum valor será cobrado agora. Você paga presencialmente na
              barbearia, no momento do atendimento.
            </p>
          </div>

          <fieldset className="space-y-3 rounded-xl border border-border p-4">
            <legend className="px-1 text-sm">Mensagens opcionais</legend>
            <label className="flex items-start gap-3 text-sm">
              <input
                className="mt-0.5 size-4 accent-primary"
                type="checkbox"
                checked={emailReminderConsent}
                onChange={(event) =>
                  setEmailReminderConsent(event.target.checked)
                }
              />
              Quero receber um lembrete por e-mail antes do atendimento.
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                className="mt-0.5 size-4 accent-primary"
                type="checkbox"
                checked={whatsappReminderConsent}
                onChange={(event) =>
                  setWhatsappReminderConsent(event.target.checked)
                }
              />
              Quero receber um lembrete no WhatsApp.
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input
                className="mt-0.5 size-4 accent-primary"
                type="checkbox"
                checked={marketingConsent}
                onChange={(event) => setMarketingConsent(event.target.checked)}
              />
              Aceito receber pedidos de avaliação e convites para retornar pelo
              WhatsApp.
            </label>
            {(whatsappReminderConsent || marketingConsent) && (
              <label className="block space-y-2 text-sm">
                <span>Seu WhatsApp com DDD</span>
                <Input
                  type="tel"
                  autoComplete="tel"
                    placeholder="(11) 90000-0000"
                  value={contactPhone}
                  onChange={(event) => setContactPhone(event.target.value)}
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">
              Mensagens dependem da configuração da barbearia. Você pode{" "}
              <Link
                href="/notifications"
                className="text-primary underline underline-offset-4"
              >
                revogar as autorizações
              </Link>{" "}
              a qualquer momento.
            </p>
          </fieldset>

          {/* 3. Botão de Envio com loading */}
          <Button
            onClick={handleCreateBooking}
            disabled={isSubmitting}
            className="w-full py-6 text-base font-bold"
          >
            <CheckCircle2Icon className="size-4" />
            {isSubmitting
              ? "Confirmando agendamento..."
              : "Confirmar agendamento"}
          </Button>
        </div>
      )}

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="w-[90%] sm:max-w-md">
          <SignInDiaLog
            redirectAfterLogin={false}
            onLoginSuccess={() => setLoginOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
