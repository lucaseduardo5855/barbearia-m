"use client"

import { useState, useMemo } from "react"
import { Booking, BarbershopService, Barber, User } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle2Icon, X } from "lucide-react"
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
      if (bDate < todayStart) {
        passadosList.push(b)
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
  }, [bookings])

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
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Histórico / Finalizados ({groupedBookings.passados.length})
                </h3>
                <div className="grid grid-cols-1 gap-3 opacity-75 hover:opacity-100 transition-opacity">
                  {groupedBookings.passados.map(renderBookingCard)}
                </div>
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
            <AlertDialogTitle className="flex items-center justify-center">Você quer cancelar está reserva?</AlertDialogTitle>
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
    </div>
  )
}
