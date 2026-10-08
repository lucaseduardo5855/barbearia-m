"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Booking, BarbershopService, Barber, User, Product, BlockedTime } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format, addDays, subDays, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { AdminPageHeader } from "./admin-page-header"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Ban,
  ShoppingBag,
  RefreshCw,
  Clock,
  User as UserIcon,
  Phone,
  Scissors,
  DollarSign,
  Star,
  CheckCircle2,
  Trash2,
  Share2,
  Receipt,
  PlusCircle,
  X,
  Sparkles
} from "lucide-react"
import {
  createAdminBookingAction,
  createBlockedTimeAction,
  deleteBlockedTimeAction,
  createProductSaleAction,
  updateBookingDetailsAction,
  updateBookingStatusAction
} from "@/app/_actions/admin-actions"

type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

interface AgendaTabProps {
  barbershop: {
    id: string
    name: string
    slug?: string | null
    services: BarbershopService[]
    barbers: Barber[]
    products?: Product[]
    blockedTimes?: BlockedTime[]
  }
  bookings: BookingWithDetails[]
  onUpdateStatus?: (
    bookingId: string,
    status: "CONFIRMED" | "CANCELLED" | "DONE",
    paymentStatus?: "PENDING" | "PAID"
  ) => Promise<void>
}

// Lista padrão de horários de 30 em 30 min (das 08:00 às 20:30)
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
]

export default function AgendaTab({ barbershop, bookings, onUpdateStatus }: AgendaTabProps) {
  // Controle de Data selecionada
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showBlockedTimes, setShowBlockedTimes] = useState<boolean>(true)
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | Booking["status"]>("ALL")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modais de Ação
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)
  const [isBlockTimeOpen, setIsBlockTimeOpen] = useState(false)
  const [isNewProductSaleOpen, setIsNewProductSaleOpen] = useState(false)
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<BookingWithDetails | null>(null)

  // Estado do formulário de Novo Agendamento
  const [newBookingBarberId, setNewBookingBarberId] = useState<string>("")
  const [newBookingServiceId, setNewBookingServiceId] = useState<string>("")
  const [newBookingType, setNewBookingType] = useState<"PADRAO" | "ENCAIXE">("PADRAO")
  const [newBookingTime, setNewBookingTime] = useState<string>("09:00")
  const [newBookingClientName, setNewBookingClientName] = useState<string>("")
  const [newBookingClientPhone, setNewBookingClientPhone] = useState<string>("")
  const [isCreatingBooking, setIsCreatingBooking] = useState(false)

  // Estado do formulário de Bloquear Horário
  const [blockBarberId, setBlockBarberId] = useState<string>("")
  const [blockTime, setBlockTime] = useState<string>("12:00")
  const [blockReason, setBlockReason] = useState<string>("Intervalo / Almoço")
  const [isCreatingBlock, setIsCreatingBlock] = useState(false)

  // Estado do formulário de Venda de Produto
  const [saleProductId, setSaleProductId] = useState<string>("")
  const [saleBarberId, setSaleBarberId] = useState<string>("")
  const [saleClientName, setSaleClientName] = useState<string>("")
  const [saleQuantity, setSaleQuantity] = useState<number>(1)
  const [isCreatingSale, setIsCreatingSale] = useState(false)

  // Estado do modal de comanda (Serviços extras & Produtos adicionados)
  const [extraServiceToAdd, setExtraServiceToAdd] = useState<string>("")
  const [extraProductToAdd, setExtraProductToAdd] = useState<string>("")
  const [isUpdatingComanda, setIsUpdatingComanda] = useState(false)

  // Barbeiros visíveis
  const visibleBarbers = useMemo(() => {
    if (selectedBarberFilter === "ALL") return barbershop.barbers
    return barbershop.barbers.filter((b) => b.id === selectedBarberFilter)
  }, [barbershop.barbers, selectedBarberFilter])

  // Agendamentos do dia selecionado
  const dayBookings = useMemo(() => {
    return bookings.filter((b) => {
      const bDate = new Date(b.date)
      return isSameDay(bDate, selectedDate) && b.status !== "CANCELLED"
    })
  }, [bookings, selectedDate])

  const visibleDayBookings = useMemo(() => {
    if (statusFilter === "ALL") return dayBookings
    return dayBookings.filter((booking) => booking.status === statusFilter)
  }, [dayBookings, statusFilter])

  // Horários bloqueados do dia
  const dayBlockedTimes = useMemo(() => {
    if (!barbershop.blockedTimes) return []
    return barbershop.blockedTimes.filter((bt) => {
      const btDate = new Date(bt.date)
      return isSameDay(btDate, selectedDate)
    })
  }, [barbershop.blockedTimes, selectedDate])

  // Navegação de datas
  const handlePrevDay = () => setSelectedDate((prev) => subDays(prev, 1))
  const handleNextDay = () => setSelectedDate((prev) => addDays(prev, 1))
  const handleToday = () => setSelectedDate(new Date())

  // Handler: Criar Agendamento Manual
  const handleCreateBooking = async () => {
    try {
      if (!newBookingServiceId) {
        toast.error("Por favor, selecione um serviço.")
        return
      }
      if (!newBookingClientName.trim()) {
        toast.error("Informe o nome do cliente.")
        return
      }

      setIsCreatingBooking(true)

      const [hours, minutes] = newBookingTime.split(":").map(Number)
      const bookingDateTime = new Date(selectedDate)
      bookingDateTime.setHours(hours, minutes, 0, 0)

      await createAdminBookingAction({
        barbershopId: barbershop.id,
        barberId: newBookingBarberId || undefined,
        serviceId: newBookingServiceId,
        date: bookingDateTime,
        clientName: newBookingClientName.trim(),
        clientPhone: newBookingClientPhone.trim() || undefined,
        bookingType: newBookingType
      })

      toast.success("Agendamento criado com sucesso!")
      setIsNewBookingOpen(false)
      setNewBookingClientName("")
      setNewBookingClientPhone("")
    } catch (err: any) {
      toast.error(err.message || "Não foi possível criar o agendamento. Tente novamente.")
    } finally {
      setIsCreatingBooking(false)
    }
  }

  // Handler: Bloquear Horário
  const handleCreateBlockedTime = async () => {
    try {
      setIsCreatingBlock(true)
      const [hours, minutes] = blockTime.split(":").map(Number)
      const blockDateTime = new Date(selectedDate)
      blockDateTime.setHours(hours, minutes, 0, 0)

      await createBlockedTimeAction({
        barbershopId: barbershop.id,
        barberId: blockBarberId || null,
        date: blockDateTime,
        reason: blockReason.trim() || "Horário Bloqueado"
      })

      toast.success("Horário bloqueado com sucesso!")
      setIsBlockTimeOpen(false)
    } catch (err: any) {
      toast.error(err.message || "Não foi possível bloquear o horário. Tente novamente.")
    } finally {
      setIsCreatingBlock(false)
    }
  }

  // Handler: Desbloquear Horário
  const handleDeleteBlockedTime = async (blockedTimeId: string) => {
    try {
      await deleteBlockedTimeAction({
        barbershopId: barbershop.id,
        blockedTimeId
      })
      toast.success("Horário desbloqueado!")
    } catch (err: any) {
      toast.error(err.message || "Não foi possível liberar o horário. Tente novamente.")
    }
  }

  // Handler: Venda de Produto Avulso
  const handleCreateProductSale = async () => {
    try {
      if (!saleProductId) {
        toast.error("Selecione um produto.")
        return
      }

      const product = barbershop.products?.find((p) => p.id === saleProductId)
      if (!product) {
        toast.error("Produto inválido.")
        return
      }

      setIsCreatingSale(true)

      await createProductSaleAction({
        barbershopId: barbershop.id,
        productId: product.id,
        barberId: saleBarberId || null,
        clientName: saleClientName.trim() || "Cliente Balcão",
        quantity: saleQuantity,
        unitPrice: Number(product.price),
        date: selectedDate
      })

      toast.success("Venda de produto registrada com sucesso!")
      setIsNewProductSaleOpen(false)
      setSaleClientName("")
      setSaleQuantity(1)
    } catch (err: any) {
      toast.error(err.message || "Não foi possível registrar a venda. Tente novamente.")
    } finally {
      setIsCreatingSale(false)
    }
  }

  // Handler: Adicionar Serviço Extra na Comanda
  const handleAddExtraService = async () => {
    if (!selectedBookingForDetails || !extraServiceToAdd) return
    const service = barbershop.services.find((s) => s.id === extraServiceToAdd)
    if (!service) return

    try {
      setIsUpdatingComanda(true)
      const existingExtras = selectedBookingForDetails.extraServices
        ? JSON.parse(selectedBookingForDetails.extraServices)
        : []

      const updatedExtras = [
        ...existingExtras,
        { id: service.id, name: service.name, price: Number(service.price) }
      ]

      const mainPrice = Number(selectedBookingForDetails.service.price)
      const extrasTotal = updatedExtras.reduce((acc: number, item: any) => acc + Number(item.price), 0)
      const productsTotal = selectedBookingForDetails.extraProducts
        ? JSON.parse(selectedBookingForDetails.extraProducts).reduce((acc: number, item: any) => acc + (Number(item.price) * item.quantity), 0)
        : 0

      const newTotalPrice = mainPrice + extrasTotal + productsTotal
      const barberRate = selectedBookingForDetails.barber?.commissionRate ? Number(selectedBookingForDetails.barber.commissionRate) : 50
      const newCommission = (newTotalPrice * barberRate) / 100

      const updated = await updateBookingDetailsAction({
        barbershopId: barbershop.id,
        bookingId: selectedBookingForDetails.id,
        extraServices: updatedExtras,
        totalPrice: newTotalPrice,
        barberCommissionAmount: newCommission
      })

      setSelectedBookingForDetails({
        ...selectedBookingForDetails,
        extraServices: updated.extraServices,
        totalPrice: updated.totalPrice,
        barberCommissionAmount: updated.barberCommissionAmount
      })

      toast.success(`Serviço extra "${service.name}" adicionado à comanda!`)
      setExtraServiceToAdd("")
    } catch (err: any) {
      toast.error(err.message || "Não foi possível adicionar o serviço extra. Tente novamente.")
    } finally {
      setIsUpdatingComanda(false)
    }
  }

  // Handler: Adicionar Produto na Comanda
  const handleAddExtraProduct = async () => {
    if (!selectedBookingForDetails || !extraProductToAdd) return
    const product = barbershop.products?.find((p) => p.id === extraProductToAdd)
    if (!product) return

    try {
      setIsUpdatingComanda(true)
      const existingProducts = selectedBookingForDetails.extraProducts
        ? JSON.parse(selectedBookingForDetails.extraProducts)
        : []

      const updatedProducts = [
        ...existingProducts,
        { id: product.id, name: product.name, price: Number(product.price), quantity: 1 }
      ]

      const mainPrice = Number(selectedBookingForDetails.service.price)
      const extrasTotal = selectedBookingForDetails.extraServices
        ? JSON.parse(selectedBookingForDetails.extraServices).reduce((acc: number, item: any) => acc + Number(item.price), 0)
        : 0
      const productsTotal = updatedProducts.reduce((acc: number, item: any) => acc + (Number(item.price) * item.quantity), 0)

      const newTotalPrice = mainPrice + extrasTotal + productsTotal
      const barberRate = selectedBookingForDetails.barber?.commissionRate ? Number(selectedBookingForDetails.barber.commissionRate) : 50
      const newCommission = (newTotalPrice * barberRate) / 100

      const updated = await updateBookingDetailsAction({
        barbershopId: barbershop.id,
        bookingId: selectedBookingForDetails.id,
        extraProducts: updatedProducts,
        totalPrice: newTotalPrice,
        barberCommissionAmount: newCommission
      })

      // Também registra na tabela de vendas de produtos
      if (selectedBookingForDetails.barberId) {
        await createProductSaleAction({
          barbershopId: barbershop.id,
          productId: product.id,
          barberId: selectedBookingForDetails.barberId,
          clientName: selectedBookingForDetails.user.name || "Cliente",
          quantity: 1,
          unitPrice: Number(product.price),
          bookingId: selectedBookingForDetails.id
        })
      }

      setSelectedBookingForDetails({
        ...selectedBookingForDetails,
        extraProducts: updated.extraProducts,
        totalPrice: updated.totalPrice,
        barberCommissionAmount: updated.barberCommissionAmount
      })

      toast.success(`Produto "${product.name}" adicionado à comanda!`)
      setExtraProductToAdd("")
    } catch (err: any) {
      toast.error(err.message || "Não foi possível adicionar o produto à comanda. Tente novamente.")
    } finally {
      setIsUpdatingComanda(false)
    }
  }

  // Handler: Finalizar Atendimento
  const handleFinishBooking = async (bookingId: string) => {
    try {
      if (onUpdateStatus) {
        await onUpdateStatus(bookingId, "DONE", "PAID")
      } else {
        await updateBookingStatusAction({
          barbershopId: barbershop.id,
          bookingId,
          status: "DONE",
          paymentStatus: "PAID"
        })
      }
      toast.success("Atendimento concluído e comanda fechada com sucesso!")
      setSelectedBookingForDetails(null)
    } catch (err: any) {
      toast.error(err.message || "Não foi possível concluir o atendimento. Tente novamente.")
    }
  }

  const calendarGridStyle = {
    gridTemplateColumns: `3.25rem repeat(${Math.max(visibleBarbers.length, 1)}, minmax(12.5rem, 1fr))`,
  }

  const bookingTone = (booking: BookingWithDetails) => {
    if (booking.status === "DONE") return "border-success/30 bg-success/10 hover:bg-success/15"
    if (booking.status === "PENDING") return "border-warning/35 bg-warning/10 hover:bg-warning/15"
    if (booking.bookingType === "ENCAIXE") return "border-warning/45 bg-warning/10 hover:bg-warning/15"
    return "border-info/30 bg-info/10 hover:bg-info/15"
  }

  const statusFilters: { value: "ALL" | Booking["status"]; label: string; className: string }[] = [
    { value: "ALL", label: "Todos", className: "bg-secondary text-secondary-foreground" },
    { value: "PENDING", label: "Pendentes", className: "bg-warning/15 text-warning" },
    { value: "CONFIRMED", label: "Confirmados", className: "bg-info/15 text-info" },
    { value: "DONE", label: "Concluídos", className: "bg-success/15 text-success" },
  ]
  const selectedProductForSale = barbershop.products?.find((product) => product.id === saleProductId)

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={CalendarIcon}
        title="Agenda"
        description={format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        actions={<>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBlockTimeOpen(true)}
            className="gap-2 font-semibold text-destructive hover:bg-destructive/10"
          >
            <Ban className="w-3.5 h-3.5" />
            Bloquear horário
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsNewProductSaleOpen(true)}
            className="gap-2 font-semibold"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Venda de produto
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setNewBookingTime("10:00")
              setNewBookingBarberId(barbershop.barbers[0]?.id || "")
              setIsNewBookingOpen(true)
            }}
            className="gap-2 px-4 font-semibold"
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            Novo agendamento
          </Button>
        </>}
      />

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevDay}
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <button
            onClick={handleToday}
            className="flex h-10 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            title="Voltar para Hoje"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-warning" />
            <span>{format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Exibir horários bloqueados:</span>
            <select
              value={showBlockedTimes ? "sim" : "nao"}
              onChange={(e) => setShowBlockedTimes(e.target.value === "sim")}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Barbeiro:</span>
            <select
              value={selectedBarberFilter}
              onChange={(e) => setSelectedBarberFilter(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm font-semibold text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">Todos os visíveis</option>
              {barbershop.barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsRefreshing(true)
              setTimeout(() => {
                setIsRefreshing(false)
                toast.success("Agenda atualizada!")
              }, 400)
            }}
            className="h-10 gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Filtrar agendamentos por status">
        {statusFilters.map((filter) => {
          const count = filter.value === "ALL"
            ? dayBookings.length
            : dayBookings.filter((booking) => booking.status === filter.value).length

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              aria-pressed={statusFilter === filter.value}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                statusFilter === filter.value
                  ? filter.className
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {filter.label} ({count})
            </button>
          )
        })}
      </div>

      {/* 📅 GRID VISUAL DA AGENDA (Horários x Colaboradores) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <div className="min-w-[920px]">
            <div style={calendarGridStyle} className="grid border-b border-border bg-card">
              <div className="flex items-center justify-center border-r border-border p-4 text-center text-xs font-semibold text-muted-foreground">
                Horário
              </div>

              {visibleBarbers.length > 0 ? (
                visibleBarbers.map((barber) => {
                  const barberBookings = visibleDayBookings.filter((booking) => booking.barberId === barber.id)
                  const occupancy = Math.round((barberBookings.length / TIME_SLOTS.length) * 100)

                  return (
                  <div
                    key={barber.id}
                    className="border-r border-border p-4 last:border-r-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-foreground">
                        {barber.imageUrl ? (
                          <Image
                            src={barber.imageUrl}
                            alt={barber.name}
                            fill
                            sizes="40px"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <span className="block truncate text-sm font-semibold text-foreground">{barber.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {barberBookings.length} agendamento{barberBookings.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-info" style={{ width: `${occupancy}%` }} />
                      </span>
                      Ocupação {occupancy}%
                    </div>
                  </div>
                  )
                })
              ) : (
                <div className="p-3 text-xs text-muted-foreground italic col-span-3 text-center">
                  Nenhum barbeiro cadastrado. Cadastre barbeiros na aba &quot;Equipe&quot;.
                </div>
              )}
            </div>

            <div className="divide-y divide-border/70">
              {TIME_SLOTS.map((time) => {
                return (
                  <div
                    key={time}
                    style={calendarGridStyle}
                    className="grid min-h-[76px] transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-center border-r border-border bg-muted/35 px-3 text-xs font-medium tabular-nums text-muted-foreground">
                      {time}
                    </div>

                    {visibleBarbers.map((barber) => {
                      const booking = visibleDayBookings.find((b) => {
                        const bTime = format(new Date(b.date), "HH:mm")
                        const matchesBarber = b.barberId === barber.id || (!b.barberId && visibleBarbers[0]?.id === barber.id)
                        return bTime === time && matchesBarber
                      })

                      // Procura horário bloqueado
                      const blocked = dayBlockedTimes.find((bt) => {
                        const btTime = format(new Date(bt.date), "HH:mm")
                        const matchesBarber = !bt.barberId || bt.barberId === barber.id
                        return btTime === time && matchesBarber
                      })

                      const isBlocked = showBlockedTimes && !!blocked

                      return (
                        <div
                          key={barber.id}
                          className="relative flex items-center justify-center border-r border-border p-2 last:border-r-0"
                        >
                          {/* 🟢 CARD DE AGENDAMENTO (Idêntico ao da imagem 1) */}
                          {booking ? (
                            <div
                              onClick={() => setSelectedBookingForDetails(booking)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault()
                                  setSelectedBookingForDetails(booking)
                                }
                              }}
                              className={`flex h-full w-full cursor-pointer flex-col justify-between rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${bookingTone(booking)}`}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-foreground">
                                      {format(new Date(booking.date), "HH:mm")} ·{" "}
                                      {booking.user.name || "Cliente"}
                                    </span>
                                    {booking.bookingType === "ENCAIXE" && <Star className="h-3 w-3 shrink-0 text-warning" />}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {booking.service.name}
                                  </p>
                                </div>

                                {booking.bookingType === "ENCAIXE" && (
                                  <span className="text-[9px] bg-warning/20 text-warning font-bold px-1.5 py-0.5 rounded-md uppercase">
                                    Encaixe
                                  </span>
                                )}
                              </div>

                              {/* Extras ou Produtos */}
                              {booking.extraServices && JSON.parse(booking.extraServices).length > 0 && (
                                <p className="text-xs text-warning font-medium">
                                  + {JSON.parse(booking.extraServices).length} serviço(s) extra
                                </p>
                              )}

                              {booking.extraProducts && JSON.parse(booking.extraProducts).length > 0 && (
                                <p className="text-xs text-info font-medium">
                                  + {JSON.parse(booking.extraProducts).length} produto(s)
                                </p>
                              )}

                              <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground">
                                <span>{booking.user.phone || "(Sem tel)"}</span>
                                <span className="font-semibold tabular-nums text-foreground">
                                  R$ {Number(booking.totalPrice ?? booking.service.price).toFixed(2).replace(".", ",")}
                                </span>
                              </div>
                            </div>
                          ) : isBlocked ? (
                            /* 🔴 HORÁRIO BLOQUEADO */
                            <div className="w-full h-full p-2 rounded-lg bg-destructive/10 border border-destructive/40 text-destructive flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                                <Ban className="w-3.5 h-3.5 shrink-0" />
                                <span className="line-clamp-1">{blocked?.reason || "Bloqueado"}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteBlockedTime(blocked!.id)}
                                aria-label="Desbloquear horario"
                                className="min-h-11 min-w-11 p-2 md:min-h-0 md:min-w-0 md:p-1 hover:bg-destructive/20 rounded text-destructive transition-colors"
                                title="Desbloquear este horário"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            /* ⚪ HORÁRIO VAZIO: Clique para agendar rápido */
                            <button
                              onClick={() => {
                                setNewBookingTime(time)
                                setNewBookingBarberId(barber.id)
                                setIsNewBookingOpen(true)
                              }}
                              className="group flex h-full min-h-[66px] w-full items-center justify-center rounded-xl border border-dashed border-transparent transition-colors hover:border-info/35 hover:bg-info/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground/50 transition-colors group-hover:text-info">
                                <Plus className="w-3 h-3" /> Agendar
                              </span>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 🧾 MODAL: DETALHES DA COMANDA / ATENDIMENTO */}
      {selectedBookingForDetails && (
        <Dialog
          open={!!selectedBookingForDetails}
          onOpenChange={(open) => !open && setSelectedBookingForDetails(null)}
        >
          <DialogContent className="max-w-2xl bg-card border-border p-6 text-foreground max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-warning" />
                    Comanda Nº {selectedBookingForDetails.orderNumber || selectedBookingForDetails.id.substring(0, 7)}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Cliente: <strong>{selectedBookingForDetails.user.name || "Cliente"}</strong> •{" "}
                    {selectedBookingForDetails.user.phone || "Sem telefone"}
                  </DialogDescription>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                    selectedBookingForDetails.status === "DONE"
                      ? "bg-success/20 text-success"
                      : "bg-warning/20 text-warning"
                  }`}
                >
                  {selectedBookingForDetails.status === "DONE" ? "Concluído" : "Em Aberto"}
                </span>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Informações Básicas */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-secondary/20 border border-border/50 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Serviço Principal</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedBookingForDetails.service.name}</p>
                  <span className="text-success font-semibold">
                    R$ {Number(selectedBookingForDetails.service.price).toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Profissional / Barbeiro</span>
                  <p className="font-bold text-foreground mt-0.5">{selectedBookingForDetails.barber?.name || "Geral"}</p>
                  <span className="text-warning font-semibold">
                    Taxa: {selectedBookingForDetails.barber?.commissionRate ? Number(selectedBookingForDetails.barber.commissionRate) : 50}%
                  </span>
                </div>
              </div>

              {/* SERVIÇOS EXTRAS ADICIONADOS */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                    <Scissors className="w-3.5 h-3.5 text-warning" /> Serviços Extras Realizados
                  </h4>
                </div>

                {selectedBookingForDetails.extraServices &&
                JSON.parse(selectedBookingForDetails.extraServices).length > 0 ? (
                  <div className="space-y-1.5">
                    {JSON.parse(selectedBookingForDetails.extraServices).map((s: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-xs"
                      >
                        <span className="text-foreground font-medium">{s.name}</span>
                        <strong className="text-success">
                          R$ {Number(s.price).toFixed(2).replace(".", ",")}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum serviço extra adicionado.</p>
                )}

                {/* Adicionar Serviço Extra */}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={extraServiceToAdd}
                    onChange={(e) => setExtraServiceToAdd(e.target.value)}
                    className="flex-1 bg-secondary/40 text-xs text-foreground p-2 rounded-lg border border-border"
                  >
                    <option value="">Selecione um serviço extra...</option>
                    {barbershop.services
                      .filter((s) => s.id !== selectedBookingForDetails.serviceId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} - R$ {Number(s.price).toFixed(2).replace(".", ",")}
                        </option>
                      ))}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleAddExtraService}
                    disabled={!extraServiceToAdd || isUpdatingComanda}
                    className="bg-warning hover:bg-warning/85 text-warning-foreground font-bold text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>
              </div>

              {/* PRODUTOS VENDIDOS DURANTE O ATENDIMENTO */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
                    <ShoppingBag className="w-3.5 h-3.5 text-info" /> Produtos Vendidos no Atendimento
                  </h4>
                </div>

                {selectedBookingForDetails.extraProducts &&
                JSON.parse(selectedBookingForDetails.extraProducts).length > 0 ? (
                  <div className="space-y-1.5">
                    {JSON.parse(selectedBookingForDetails.extraProducts).map((p: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-xs"
                      >
                        <span className="text-foreground font-medium">
                          {p.name} {p.quantity > 1 ? `(${p.quantity}x)` : ""}
                        </span>
                        <strong className="text-success">
                          R$ {(Number(p.price) * (p.quantity || 1)).toFixed(2).replace(".", ",")}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Nenhum produto vendido neste atendimento.</p>
                )}

                {/* Adicionar Produto */}
                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={extraProductToAdd}
                    onChange={(e) => setExtraProductToAdd(e.target.value)}
                    className="flex-1 bg-secondary/40 text-xs text-foreground p-2 rounded-lg border border-border"
                  >
                    <option value="">Selecione um produto vendido...</option>
                    {barbershop.products && barbershop.products.length > 0 ? (
                      barbershop.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} - R$ {Number(p.price).toFixed(2).replace(".", ",")} (Estoque: {p.stock})
                        </option>
                      ))
                    ) : (
                      <option disabled>Nenhum produto cadastrado no estoque</option>
                    )}
                  </select>
                  <Button
                    size="sm"
                    onClick={handleAddExtraProduct}
                    disabled={!extraProductToAdd || isUpdatingComanda}
                    className="bg-info hover:bg-info/85 text-info-foreground font-bold text-xs gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </Button>
                </div>
              </div>

              {/* TOTAIS E COMISSÃO DO COLABORADOR */}
              {(() => {
                const mainPrice = Number(selectedBookingForDetails.service.price)
                const extrasTotal = selectedBookingForDetails.extraServices
                  ? JSON.parse(selectedBookingForDetails.extraServices).reduce((acc: number, item: any) => acc + Number(item.price), 0)
                  : 0
                const productsTotal = selectedBookingForDetails.extraProducts
                  ? JSON.parse(selectedBookingForDetails.extraProducts).reduce((acc: number, item: any) => acc + (Number(item.price) * (item.quantity || 1)), 0)
                  : 0
                const totalFinal = mainPrice + extrasTotal + productsTotal

                const barberRate = selectedBookingForDetails.barber?.commissionRate
                  ? Number(selectedBookingForDetails.barber.commissionRate)
                  : 50
                const comissaoFinal = selectedBookingForDetails.barberCommissionAmount
                  ? Number(selectedBookingForDetails.barberCommissionAmount)
                  : (totalFinal * barberRate) / 100

                return (
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">Total da Comanda</span>
                      <p className="text-2xl font-extrabold text-success">
                        R$ {totalFinal.toFixed(2).replace(".", ",")}
                      </p>
                    </div>

                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-border/40">
                      <span className="text-[10px] text-warning uppercase font-bold">
                        Comissão do Colaborador ({barberRate}%)
                      </span>
                      <p className="text-xl font-bold text-warning">
                        R$ {comissaoFinal.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50">
              {/* Botão WhatsApp */}
              {selectedBookingForDetails.user.phone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-success border-success/40 hover:bg-success/10 gap-1.5"
                  onClick={() => {
                    const phone = selectedBookingForDetails.user.phone!.replace(/\D/g, "")
                    const cleanPhone = phone.startsWith("55") ? phone : "55" + phone
                    const msg = `Olá ${selectedBookingForDetails.user.name || "Cliente"}! Tudo bem? Passando para confirmar seu atendimento na Barbearia às ${format(new Date(selectedBookingForDetails.date), "HH:mm")}. Aguardamos você!`
                    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank")
                  }}
                >
                  <Share2 className="w-3.5 h-3.5" /> Lembrar no WhatsApp
                </Button>
              )}

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBookingForDetails(null)}
                  className="text-xs"
                >
                  Fechar
                </Button>

                {selectedBookingForDetails.status !== "DONE" && (
                  <Button
                    size="sm"
                    onClick={() => handleFinishBooking(selectedBookingForDetails.id)}
                    className="bg-success/60 hover:bg-success/70 text-foreground font-bold text-xs gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Concluir Atendimento
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 🔴 MODAL: BLOQUEAR HORÁRIO */}
      <Dialog open={isBlockTimeOpen} onOpenChange={setIsBlockTimeOpen}>
        <DialogContent className="max-w-md bg-card border-border p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-destructive">
              <Ban className="w-5 h-5" /> Bloquear Horário na Agenda
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Bloqueie intervalos para almoço, folga ou ausência de barbeiro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Colaborador / Barbeiro</label>
              <select
                value={blockBarberId}
                onChange={(e) => setBlockBarberId(e.target.value)}
                className="w-full bg-secondary/40 text-foreground p-2 rounded-lg border border-border"
              >
                <option value="">Todos os barbeiros (Bloqueio geral)</option>
                {barbershop.barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Horário</label>
              <select
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                className="w-full bg-secondary/40 text-foreground p-2 rounded-lg border border-border"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Motivo do Bloqueio</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: Almoço, Reunião, Folga"
                className="bg-secondary/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="ghost" size="sm" onClick={() => setIsBlockTimeOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateBlockedTime}
              disabled={isCreatingBlock}
              className="bg-destructive hover:bg-destructive/85 text-destructive-foreground font-bold text-xs"
            >
              {isCreatingBlock ? "Bloqueando..." : "Confirmar Bloqueio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🟡 MODAL: NOVA VENDA DE PRODUTOS */}
      <Dialog open={isNewProductSaleOpen} onOpenChange={setIsNewProductSaleOpen}>
        <DialogContent className="max-w-xl bg-card p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-extrabold text-foreground">
              <ShoppingBag className="size-5 text-primary" /> Nova venda de produto
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Venda produtos diretamente no balcão com comissão para o barbeiro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Selecione o Produto</label>
              <select
                value={saleProductId}
                onChange={(e) => setSaleProductId(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Escolha o produto...</option>
                {barbershop.products && barbershop.products.length > 0 ? (
                  barbershop.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - R$ {Number(p.price).toFixed(2).replace(".", ",")} (Estoque: {p.stock})
                    </option>
                  ))
                ) : (
                  <option disabled>Nenhum produto cadastrado no estoque</option>
                )}
              </select>
            </div>

            {selectedProductForSale && (
              <div className="flex items-center justify-between rounded-xl bg-muted p-4">
                <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Produto selecionado</p><p className="mt-1 text-sm font-extrabold text-foreground">{selectedProductForSale.name}</p></div>
                <div className="text-right"><p className="text-sm font-extrabold text-success">R$ {Number(selectedProductForSale.price).toFixed(2).replace(".", ",")}</p><p className="mt-1 text-[10px] font-medium text-muted-foreground">{selectedProductForSale.stock} em estoque</p></div>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Barbeiro / Vendedor (gera comissão)</label>
              <select
                value={saleBarberId}
                onChange={(e) => setSaleBarberId(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Venda direta da Barbearia (Sem barbeiro)</option>
                {barbershop.barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Quantidade</label>
                <Input
                  type="number"
                  min="1"
                  value={saleQuantity}
                  onChange={(e) => setSaleQuantity(Math.max(1, Number(e.target.value)))}
                  className="bg-secondary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Nome do Cliente</label>
                <Input
                  value={saleClientName}
                  onChange={(e) => setSaleClientName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="bg-secondary/40"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="ghost" size="sm" onClick={() => setIsNewProductSaleOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateProductSale}
              disabled={isCreatingSale || !saleProductId}
              className="font-bold"
            >
              {isCreatingSale ? "Registrando..." : "Confirmar Venda"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🟡 MODAL: NOVO AGENDAMENTO (Colaborador, Serviço, Padrão ou Encaixe, Data e Horário) */}
      <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
        <DialogContent className="max-w-lg bg-card border-border p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-warning">
              <CalendarIcon className="w-5 h-5" /> Novo Agendamento
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Agende um atendimento selecionando o colaborador, serviço e horário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Colaborador / Barbeiro</label>
                <select
                  value={newBookingBarberId}
                  onChange={(e) => setNewBookingBarberId(e.target.value)}
                  className="w-full bg-secondary/40 text-foreground p-2 rounded-lg border border-border"
                >
                  <option value="">Qualquer Profissional</option>
                  {barbershop.barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Tipo de Agendamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewBookingType("PADRAO")}
                    className={`py-2 px-3 rounded-lg font-bold transition-all text-center ${
                      newBookingType === "PADRAO"
                        ? "bg-warning text-warning-foreground shadow-sm"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Padrão
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewBookingType("ENCAIXE")}
                    className={`py-2 px-3 rounded-lg font-bold transition-all text-center ${
                      newBookingType === "ENCAIXE"
                        ? "bg-warning text-warning-foreground shadow-sm"
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    Encaixe
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Serviço Principal</label>
              <select
                value={newBookingServiceId}
                onChange={(e) => setNewBookingServiceId(e.target.value)}
                className="w-full bg-secondary/40 text-foreground p-2 rounded-lg border border-border"
              >
                <option value="">Selecione o serviço...</option>
                {barbershop.services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - R$ {Number(s.price).toFixed(2).replace(".", ",")}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Data</label>
                <Input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split("-").map(Number)
                    setSelectedDate(new Date(y, m - 1, d))
                  }}
                  className="bg-secondary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Horário</label>
                <select
                  value={newBookingTime}
                  onChange={(e) => setNewBookingTime(e.target.value)}
                  className="w-full bg-secondary/40 text-foreground p-2 rounded-lg border border-border"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/40">
              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">Nome do Cliente</label>
                <Input
                  value={newBookingClientName}
                  onChange={(e) => setNewBookingClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="bg-secondary/40"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-muted-foreground">WhatsApp / Telefone</label>
                <Input
                  value={newBookingClientPhone}
                  onChange={(e) => setNewBookingClientPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="bg-secondary/40"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="ghost" size="sm" onClick={() => setIsNewBookingOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateBooking}
              disabled={isCreatingBooking || !newBookingServiceId || !newBookingClientName.trim()}
              className="bg-warning hover:bg-warning/90 text-warning-foreground font-bold text-xs"
            >
              {isCreatingBooking ? "Agendando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
