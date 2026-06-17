"use client"

import { useState, useEffect, useMemo } from "react"
import { Barbershop, BarbershopService, Barber } from "@prisma/client"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { ChevronLeftIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { ptBR } from "date-fns/locale"
import { format, isPast, isToday, set, startOfDay } from "date-fns"
import { getBookings } from "@/app/_actions/get-bookins"
import { createBooking } from "@/app/_actions/create-booking"
import { createStripeCheckout } from "@/app/_actions/create-stripe-checkout"
import BookingSummary from "@/app/_components/booking-summary"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { PaymentMethod } from "@prisma/client"


// Estendemos os tipos da barbearia para incluir os serviços e barbeiros que buscamos no banco
interface BookingFlowProps {
    barbershop: Barbershop & {
        services: BarbershopService[]
        barbers: Barber[]
    }
}

export default function BookingFlow({ barbershop }: BookingFlowProps) {
    // Estados para controlar o passo atual e as escolhas do cliente
    const [step, setStep] = useState(1)
    const [selectedService, setSelectedService] = useState<BarbershopService | null>(null)
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // Função para voltar um passo atrás no botão "Voltar"
    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    // Lista padrão de horários de atendimento da barbearia
    const TIME_LIST = [
        "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
    ]

    // Estado para armazenar os agendamentos já ocupados do dia selecionado
    const [dayBookings, setDayBookings] = useState<any[]>([])

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ON_SITE")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    // Busca no banco de dados quais horários já estão ocupados do dia selecionado
    useEffect(() => {
        if (!selectedDate) return

        const fetchBookings = async () => {
            const bookings = await getBookings({
                date: selectedDate,
                serviceId: selectedService?.id || ""
            })
            setDayBookings(bookings)
        }

        fetchBookings()
    }, [selectedDate, selectedService])

    // Filtra e gera apenas os horários livres
    const availableTimes = useMemo(() => {
        if (!selectedDate) return []

        return TIME_LIST.filter((time) => {
            const hour = Number(time.split(":")[0])
            const minute = Number(time.split(":")[1])

            // 1. Bloqueia horários passados se o dia for hoje
            const timeIsPast = isPast(set(new Date(), { hours: hour, minutes: minute }))
            if (timeIsPast && isToday(selectedDate)) {
                return false
            }

            // 2. Bloqueia horários que já possuem agendamento no banco
            const hasBooking = dayBookings.some(
                (booking) =>
                    new Date(booking.date).getHours() === hour &&
                    new Date(booking.date).getMinutes() === minute
            )

            return !hasBooking
        })
    }, [dayBookings, selectedDate])

    // Junta o dia selecionado com a string de horário (ex: "09:00") para criar um objeto Date completo
    const selectDate = useMemo(() => {
        if (!selectedDate || !selectedTime) return null

        return set(selectedDate, {
            hours: Number(selectedTime.split(":")[0]),
            minutes: Number(selectedTime.split(":")[1]),
        })
    }, [selectedDate, selectedTime])

    // Função que é disparada ao clicar no botão final de agendamento
    const handleCreateBooking = async () => {
        try {
            if (!selectDate || !selectedService) return
            setIsSubmitting(true) // Ativa a trava de segurança para evitar cliques duplos

            // 1. Cria a reserva no banco de dados chamando a nossa Server Action
            const booking = await createBooking({
                serviceId: selectedService.id,
                date: selectDate,
                paymentMethod,
                barberId: selectedBarber?.id || null // Associa o barbeiro selecionado à reserva
            })

            // 2. Se a forma de pagamento selecionada for ONLINE (Stripe)
            if (paymentMethod === "ONLINE") {
                const checkoutUrl = await createStripeCheckout({
                    products: [selectedService],
                    bookingId: booking.id,
                })

                if (checkoutUrl) {
                    window.location.href = checkoutUrl // Redireciona para a tela de pagamento do Stripe
                    return
                }

                toast.error("Erro ao gerar link de pagamento!")
                setIsSubmitting(false)
                return
            }

            // 3. Se for pagamento no local, finaliza direto
            toast.success("Reserva realizada com sucesso!")

            // Redireciona o usuário para o histórico de reservas desta barbearia
            router.push(`/${barbershop.slug}/reservas`)
        } catch (error) {
            console.error(error)
            toast.error("Erro ao criar reserva. Tente novamente.")
            setIsSubmitting(false) // Destrava o botão caso dê algum erro
        }
    }


    return (
        <div className="space-y-6">
            {/* Indicador de Progresso & Botão Voltar */}
            {step > 1 && (
                <div className="flex items-center justify-between">
                    <Button variant="outline" size="icon" className="h-10 w-10 hover:bg-secondary transition-all" onClick={handleBack}>
                        <ChevronLeftIcon className="h-5 w-5 text-white" />
                    </Button>
                </div>
            )}

            {/* Renderização Condicional da Etapa Ativa */}
            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Selecione o Serviço</h2>
                    <p className="text-sm text-muted-foreground">Escolha o serviço que você deseja agendar hoje.</p>

                    {/* Aqui vamos listar os serviços da barbearia no próximo passo */}
                    <div className="space-y-3">
                        {barbershop.services.map((service) => (
                            <Card
                                key={service.id}
                                className="cursor-pointer hover:border-primary transition-all"
                                onClick={() => {
                                    setSelectedService(service)
                                    setStep(2) // Avança para o Passo 2 após escolher o serviço
                                }}
                            >
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-sm">{service.name}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>
                                        <p className="text-sm font-bold mt-2 text-primary">
                                            {Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(service.price))}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <h2 className="text-lg font-semibold">Escolha o Profissional</h2>
                    <p className="text-sm text-muted-foreground">Serviço selecionado: <strong className="text-primary">{selectedService?.name}</strong></p>

                    <div className="space-y-3">
                        {/* Opção para escolher qualquer profissional */}
                        <Card
                            className="cursor-pointer hover:border-primary transition-all"
                            onClick={() => {
                                setSelectedBarber(null) // null significa "Qualquer Profissional"
                                setStep(3)              // Avança para o passo 3 (calendário)
                            }}
                        >
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-semibold text-xs text-primary">
                                    Qualquer
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Qualquer Profissional</h3>
                                    <p className="text-xs text-muted-foreground">O barbeiro mais rápido disponível</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Listando os barbeiros cadastrados */}
                        {barbershop.barbers.map((barber) => (
                            <Card
                                key={barber.id}
                                className="cursor-pointer hover:border-primary transition-all"
                                onClick={() => {
                                    setSelectedBarber(barber) // Guarda o barbeiro selecionado
                                    setStep(3)                // Avança para o calendário
                                }}
                            >
                                <CardContent className="p-4 flex items-center gap-3">
                                    {/* Imagem do profissional */}
                                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                        <img
                                            src={barber.imageUrl}
                                            alt={barber.name}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">{barber.name}</h3>
                                        <p className="text-xs text-muted-foreground">Profissional disponível</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h2 className="text-lg font-semibold">Selecione Data e Horário</h2>

                    {/* Renderização do Calendário */}
                    <div className="flex justify-center border-b border-solid border-secondary pb-6">
                        <div className="w-[300px] bg-card p-3 rounded-xl border border-solid border-secondary">
                            <Calendar
                                mode="single"
                                locale={ptBR}
                                className="w-full capitalize [&_table]:w-full"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={{ before: startOfDay(new Date()) }} // Impede agendar em datas passadas
                            />
                        </div>
                    </div>

                    {/* Renderização do Grid de Horários (Só aparece após selecionar um dia no calendário) */}
                    {selectedDate && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Horários Disponíveis
                            </h3>

                            {availableTimes.length > 0 ? (
                                <div className="grid grid-cols-4 gap-3">
                                    {availableTimes.map((time) => (
                                        <Button
                                            key={time}
                                            variant={selectedTime === time ? "default" : "outline"}
                                            className={`rounded-full py-4 transition-all ${selectedTime === time
                                                ? "bg-primary text-primary-foreground font-semibold"
                                                : "hover:border-primary text-gray-300"
                                                }`}
                                            onClick={() => {
                                                setSelectedTime(time) // Guarda o horário selecionado
                                                setStep(4)            // Avança para o passo 4 (Resumo)
                                            }}
                                        >
                                            {time}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4">
                                    Não há horários disponíveis para este dia.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {step === 4 && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <h2 className="text-lg font-semibold">Resumo do Agendamento</h2>
                    <p className="text-sm text-muted-foreground -mt-4">Revise os dados antes de confirmar o seu agendamento.</p>

                    {/* 1. Componente de Resumo Reutilizado do seu projeto */}
                    {selectedService && selectDate && (
                        <div className="border border-solid border-secondary rounded-xl overflow-hidden bg-card p-4">
                            <BookingSummary
                                barbershop={barbershop}
                                service={selectedService}
                                selectDay={selectDate}
                            />
                        </div>
                    )}

                    {/* 2. Seleção de Método de Pagamento */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
                            Método de Pagamento
                        </h3>
                        
                        <div className="flex gap-3">
                            {/* Botão Pagar no Local */}
                            <Button
                                type="button"
                                className="flex-1 py-6"
                                variant={paymentMethod === "ON_SITE" ? "default" : "outline"}
                                onClick={() => setPaymentMethod("ON_SITE")}
                                disabled={isSubmitting}
                            >
                                Pagar no local
                            </Button>
                            
                            {/* Botão Pagar Online */}
                            <Button
                                type="button"
                                className="flex-1 py-6"
                                variant={paymentMethod === "ONLINE" ? "default" : "outline"}
                                onClick={() => setPaymentMethod("ONLINE")}
                                disabled={isSubmitting}
                            >
                                Pagar online (Stripe)
                            </Button>
                        </div>
                    </div>

                    {/* 3. Botão de Envio com loading */}
                    <Button 
                        onClick={handleCreateBooking} 
                        disabled={isSubmitting} 
                        className="w-full py-6 text-lg font-bold"
                    >
                        {isSubmitting ? "Finalizando agendamento..." : "Confirmar e Agendar"}
                    </Button>
                </div>
            )}
        </div>
    )
}
