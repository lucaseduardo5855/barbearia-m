"use client"

import { useState, useMemo, useEffect } from "react"
import { Booking, BarbershopService, Barber, User } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { CheckCircle2Icon, HistoryIcon, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog"

type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

interface AgendaTabProps {
  bookings: BookingWithDetails[]
  onUpdateStatus: (
    bookingId: string,
    status: "CONFIRMED" | "CANCELLED" | "DONE",
    paymentStatus?: "PENDING" | "PAID"
  ) => Promise<void>
}

export default function AgendaTab({ bookings, onUpdateStatus }: AgendaTabProps) {
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)
  const [historyClearedAt, setHistoryClearedAt] = useState<number | null>(null)
  const [isClearHistoryDialogOpen, setIsClearHistoryDialogOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("history_cleared_at")
    if (saved) {
      setHistoryClearedAt(Number(saved))
    }
  }, [])

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Rastreia se existem quaisquer agendamentos passados ou cancelados no banco de dados
  const hasRawPassados = useMemo(() => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    return bookings.some(b => b.status === "CANCELLED" || new Date(b.date) < todayStart)
  }, [bookings])

  // --- LÓGICA DE AGRUPAMENTO DE AGENDAMENTOS (Calculada no filho!) ---
  const groupedBookings = useMemo(() => {
    const today = new Date()

    const todayStart = new Date(today)
    todayStart.setHours(0, 0, 0, 0)

    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const next7DaysEnd = new Date(today)
    next7DaysEnd.setDate(today.getDate() + 7)
    next7DaysEnd.setHours(23, 59, 59, 999)

    const hojeList: BookingWithDetails[] = []
    const estaSemanaList: BookingWithDetails[] = []
    const futurosList: BookingWithDetails[] = []
    const passadosList: BookingWithDetails[] = []

    bookings.forEach((b) => {
      const bDate = new Date(b.date)
      // Se estiver cancelado ou for uma data no passado, vai direto para o histórico
      if (b.status === "CANCELLED" || bDate < todayStart) {
        // Só exibe se a data do agendamento for depois do momento da última limpeza
        if (!historyClearedAt || bDate.getTime() > historyClearedAt) {
          passadosList.push(b)
        }
      } else if (bDate >= todayStart && bDate <= todayEnd) {
        hojeList.push(b)
      } else if (bDate > todayEnd && bDate <= next7DaysEnd) {
        estaSemanaList.push(b)
      } else {
        futurosList.push(b)
      }
    })

    // Ordenar listas crescentes (do mais próximo para o futuro)
    const sortByDateAsc = (a: BookingWithDetails, b: BookingWithDetails) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()

    // Ordenar histórico decrescente (do mais recente para o mais antigo)
    const sortByDateDesc = (a: BookingWithDetails, b: BookingWithDetails) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()

    return {
      hoje: hojeList.sort(sortByDateAsc),
      estaSemana: estaSemanaList.sort(sortByDateAsc),
      futuros: futurosList.sort(sortByDateAsc),
      passados: passadosList.sort(sortByDateDesc),
    }
  }, [bookings, historyClearedAt])

  const renderBookingCard = (booking: BookingWithDetails) => {
    const isPastBooking = new Date(booking.date) < new Date()
    return (
      <Card key={booking.id} className="border-secondary hover:border-primary/40 transition-colors">
        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-200">
                {booking.user.name || "Cliente sem Nome"}
              </span>

              {booking.status === "CANCELLED" ? (
                <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-semibold">Cancelado</span>
              ) : booking.status === "DONE" ? (
                <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-semibold">Concluído</span>
              ) : isPastBooking ? (
                <span className="text-[10px] bg-secondary text-gray-400 px-2 py-0.5 rounded-full">Expirado</span>
              ) : (
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">Agendado</span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Serviço: <strong className="text-gray-300">{booking.service.name}</strong> •
              Preço: <strong className="text-gray-300">R$ {Number(booking.service.price).toFixed(2)}</strong>
            </p>

            <p className="text-xs text-muted-foreground">
              Profissional: <strong className="text-gray-300">{booking.barber?.name || "Qualquer Profissional"}</strong>
            </p>

            {/* Botão Lembrar no WhatsApp (Estilizado embaixo do Profissional) */}
            {(booking.status === "CONFIRMED" || booking.status === "PENDING") && (
              <Button
                variant="default"
                size="sm"
                className="mt-4 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 h-8 px-3 rounded-lg shadow-sm transition-all"
                title="Lembrar Cliente via WhatsApp"
                onClick={() => {
                  if (!booking.user.phone) {
                    toast.error("Este cliente não cadastrou um número de telefone no perfil!")
                    return
                  }
                  const cleanPhone = booking.user.phone.replace(/\D/g, "")
                  const formattedDate = format(new Date(booking.date), "dd/MM")
                  const formattedTime = format(new Date(booking.date), "HH:mm")
                  const barberName = booking.barber?.name || "Qualquer Profissional"
                  const message = `Olá, ${booking.user.name || "Cliente"}! Passando para lembrar do seu agendamento no dia ${formattedDate} às ${formattedTime} para o serviço de *${booking.service.name}* com o profissional *${barberName}*. Aguardamos por você!`
                  window.open(`https://wa.me/${cleanPhone.startsWith("55") ? cleanPhone : "55" + cleanPhone}?text=${encodeURIComponent(message)}`, "_blank")
                }}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.007c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Lembrar no WhatsApp
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="bg-secondary/40 p-3 rounded-lg border border-secondary text-right w-full sm:w-auto">
              <p className="text-xs font-bold text-primary uppercase">
                {format(new Date(booking.date), "dd 'de' MMMM", { locale: ptBR })}
              </p>
              <p className="text-sm font-semibold text-gray-300">
                às {format(new Date(booking.date), "HH:mm")}
              </p>
            </div>

            {(booking.status === "CONFIRMED" || booking.status === "PENDING") && (
              <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white font-bold h-9 w-9 p-0 rounded-lg transition-all"
                  title="Concluir Atendimento"
                  onClick={() => onUpdateStatus(booking.id, "DONE", "PAID")}
                >
                  <CheckCircle2Icon className="w-5 h-5" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-9 w-9 p-0 rounded-lg transition-all"
                  title="Cancelar Agendamento"
                  onClick={() => setBookingToCancel(booking.id)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Agendamentos Realizados</h2>
        <p className="text-xs text-muted-foreground">Listagem histórica dos horários marcados pelos clientes.</p>
      </div>

      <div className="space-y-6">
        {bookings.length > 0 ? (
          <>
            {/* Hoje */}
            {groupedBookings.hoje.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Hoje ({groupedBookings.hoje.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {groupedBookings.hoje.map(renderBookingCard)}
                </div>
              </div>
            )}

            {/* Esta Semana */}
            {groupedBookings.estaSemana.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Esta Semana ({groupedBookings.estaSemana.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {groupedBookings.estaSemana.map(renderBookingCard)}
                </div>
              </div>
            )}

            {/* Próximos */}
            {groupedBookings.futuros.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                  Próximos Compromissos ({groupedBookings.futuros.length})
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {groupedBookings.futuros.map(renderBookingCard)}
                </div>
              </div>
            )}

            {/* Histórico */}
            {groupedBookings.passados.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-secondary/40">
                <div
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                >
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-400 transition-colors">
                    Histórico / Finalizados ({groupedBookings.passados.length})
                  </h3>

                  <div className="flex items-center gap-2">
                    {isHistoryOpen && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 h-8 font-semibold"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsClearHistoryDialogOpen(true)
                        }}
                      >
                        Limpar Histórico
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-300 h-8">
                      {isHistoryOpen ? "Recolher" : "Expandir"}
                    </Button>
                  </div>
                </div>

                {isHistoryOpen && (
                  <div className="grid grid-cols-1 gap-3 opacity-75 hover:opacity-100 transition-opacity animate-in fade-in duration-200">
                    {groupedBookings.passados.map(renderBookingCard)}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-secondary rounded-lg">
            Nenhum agendamento realizado até o momento.
          </p>
        )}

      </div>

      {/* AlertDialog de Cancelamento Isolado no Componente da Agenda */}
      <AlertDialog open={!!bookingToCancel} onOpenChange={(open) => !open && setBookingToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-center">Você quer cancelar esta reserva?</AlertDialogTitle>
            <AlertDialogDescription className="flex items-center justify-center">
              Tem certeza que deseja fazer o cancelamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-center sm:justify-center gap-3 w-full">
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (bookingToCancel) {
                  onUpdateStatus(bookingToCancel, "CANCELLED")
                  setBookingToCancel(null)
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog de Confirmação de Limpeza de Histórico */}
      <AlertDialog open={isClearHistoryDialogOpen} onOpenChange={setIsClearHistoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-center">Limpar visualização do histórico?</AlertDialogTitle>
            <AlertDialogDescription className="flex items-center justify-center text-center text-sm text-muted-foreground">
              Tem certeza que deseja ocultar estes agendamentos passados? Isso não afetará os dados do faturamento financeiro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-center sm:justify-center gap-3 w-full">
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const now = Date.now()
                localStorage.setItem("history_cleared_at", String(now))
                setHistoryClearedAt(now)
                setIsClearHistoryDialogOpen(false)
                toast.success("Histórico limpo visualmente!")
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
