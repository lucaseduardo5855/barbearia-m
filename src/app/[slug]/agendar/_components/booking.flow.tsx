"use client"

import { useState } from "react"
import { Barbershop, BarbershopService, Barber } from "@prisma/client"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { ChevronLeftIcon } from "lucide-react"

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
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)

    // Função para voltar um passo atrás no botão "Voltar"
    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    return (
        <div className="space-y-6">
            {/* Indicador de Progresso & Botão Voltar */}
            {step > 1 && (
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ChevronLeftIcon className="h-6 w-6" />
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
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Selecione Data e Horário</h2>
                    <Button onClick={() => setStep(4)} className="w-full py-6">
                        Avançar para Resumo (Provisório)
                    </Button>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Resumo do Agendamento</h2>
                    <p className="text-sm text-muted-foreground">Tudo pronto para finalizar!</p>
                    <Button onClick={() => alert("Finalizar agendamento!")} className="w-full py-6">
                        Confirmar e Agendar
                    </Button>
                </div>
            )}
        </div>
    )
}
