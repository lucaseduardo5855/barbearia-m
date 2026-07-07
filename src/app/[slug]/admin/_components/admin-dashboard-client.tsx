"use client"

import { useState } from "react"
import { Barbershop, BarbershopService, Barber, Booking, User } from "@prisma/client"
import { Button } from "@/app/_components/ui/button"
import {
  MenuIcon,
  XIcon,
  CalendarIcon,
  DollarSignIcon,
  ScissorsIcon,
  UsersIcon,
  Share2Icon,
  SettingsIcon,
  Menu,
  X
} from "lucide-react"
import { toast } from "sonner"
import {
  addServiceAction,
  deleteServiceAction,
  addBarberAction,
  deleteBarberAction,
  updateBarbershopConfig,
  updateBookingStatusAction
} from "@/app/_actions/admin-actions"

// Import dos nossos 6 subcomponentes refatorados (Clean Architecture!)
import AgendaTab from "./agenda-tab"
import FinanceiroTab from "./financeiro-tab"
import ServicosTab from "./servicos-tab"
import EquipeTab from "./equipe-tab"
import MarketingTab from "./marketing-tab"
import ConfigTab from "./config-tab"

// Define a tipagem estendida dos agendamentos
type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

interface AdminDashboardClientProps {
  barbershop: Barbershop & {
    services: BarbershopService[]
    barbers: Barber[]
  }
  bookings: BookingWithDetails[]
}

export default function AdminDashboardClient({ barbershop, bookings }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"agenda" | "financeiro" | "servicos" | "equipe" | "marketing" | "config">("agenda")
  const [isLoading, setIsLoading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // --- HANDLERS QUE DISPARAM AS ACTIONS E ATUALIZAM A TELA ---

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: "CONFIRMED" | "CANCELLED" | "DONE",
    paymentStatus?: "PENDING" | "PAID"
  ) => {
    try {
      setIsLoading(true)
      await updateBookingStatusAction({
        barbershopId: barbershop.id,
        bookingId,
        status,
        paymentStatus
      })
      toast.success(
        status === "DONE"
          ? "Atendimento concluído com sucesso!"
          : "Agendamento cancelado!"
      )
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar status.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddService = async (params: {
    name: string
    price: number
    description: string
    imageUrl: string
  }) => {
    try {
      setIsLoading(true)
      await addServiceAction({
        barbershopId: barbershop.id,
        ...params
      })
      toast.success("Serviço cadastrado com sucesso!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar serviço.")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    try {
      setIsLoading(true)
      await deleteServiceAction({
        barbershopId: barbershop.id,
        serviceId
      })
      toast.success("Serviço removido!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover serviço.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBarber = async (params: { name: string; imageUrl: string }) => {
    try {
      setIsLoading(true)
      await addBarberAction({
        barbershopId: barbershop.id,
        ...params
      })
      toast.success("Profissional contratado com sucesso!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar profissional.")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBarber = async (barberId: string) => {
    try {
      setIsLoading(true)
      await deleteBarberAction({
        barbershopId: barbershop.id,
        barberId
      })
      toast.success("Profissional removido!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover profissional.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateConfig = async (params: {
    name: string
    address: string
    phones: string[]
    description: string
    imageUrl: string
    bannerUrl?: string | null
    welcomeMessage?: string | null
    instagramUrl?: string | null
  }) => {
    try {
      setIsLoading(true)
      await updateBarbershopConfig({
        barbershopId: barbershop.id,
        ...params
      })
      toast.success("Configurações atualizadas!")
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar dados.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col md:flex-row">
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 text-primary font-bold">
          Carregando alterações...
        </div>
      )}

      {/* 📱 Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-secondary bg-background sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-black text-sm">
            {barbershop.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="font-bold text-sm line-clamp-1">{barbershop.name}</h1>
            <p className="text-[10px] text-primary uppercase font-semibold tracking-wider">Painel Admin</p>
          </div>
        </div>
        
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </Button>
      </header>

      {/* 🍔 Menu Drawer Mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsMenuOpen(false)} />
          
          <aside className="relative flex w-64 max-w-xs flex-col bg-background p-5 border-r border-secondary animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-8">
              <span className="font-bold text-sm text-primary uppercase tracking-wider">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="flex flex-col gap-2">
              <Button
                variant={activeTab === "agenda" ? "secondary" : "ghost"}
                className="justify-start gap-2 rounded-lg text-sm"
                onClick={() => { setActiveTab("agenda"); setIsMenuOpen(false) }}
              >
                <CalendarIcon className="w-4 h-4" />
                Agenda
              </Button>
              <Button
                variant={activeTab === "financeiro" ? "secondary" : "ghost"}
                className="justify-start gap-2 rounded-lg text-sm"
                onClick={() => { setActiveTab("financeiro"); setIsMenuOpen(false) }}
              >
                <DollarSignIcon className="w-4 h-4" />
                Financeiro
              </Button>
              <Button
                variant={activeTab === "servicos" ? "secondary" : "ghost"}
                className="justify-start gap-2 rounded-lg text-sm"
                onClick={() => { setActiveTab("servicos"); setIsMenuOpen(false) }}
              >
                <ScissorsIcon className="w-4 h-4" />
                Serviços
              </Button>
              <Button
                variant={activeTab === "equipe" ? "secondary" : "ghost"}
                className="justify-start gap-2 rounded-lg text-sm"
                onClick={() => { setActiveTab("equipe"); setIsMenuOpen(false) }}
              >
                <UsersIcon className="w-4 h-4" />
                Equipe
              </Button>
              <Button
                variant={activeTab === "marketing" ? "secondary" : "ghost"}
                className="justify-start gap-2 rounded-lg text-sm"
                onClick={() => { setActiveTab("marketing"); setIsMenuOpen(false) }}
              >
                <Share2Icon className="w-4 h-4" />
                Divulgação
              </Button>
              <Button
                variant={activeTab === "config" ? "secondary" : "ghost"}
                className="justify-start gap-2 rounded-lg text-sm"
                onClick={() => { setActiveTab("config"); setIsMenuOpen(false) }}
              >
                <SettingsIcon className="w-4 h-4" />
                Configurar
              </Button>
            </nav>
          </aside>
        </div>
      )}

      {/* 💻 Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-background p-6 border-r border-secondary shrink-0">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-secondary/50">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-black">
            {barbershop.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-sm line-clamp-1">{barbershop.name}</h2>
            <p className="text-[10px] text-primary uppercase font-bold tracking-wider">Painel Admin</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <Button
            variant={activeTab === "agenda" ? "secondary" : "ghost"}
            className="justify-start gap-3 rounded-lg text-sm"
            onClick={() => setActiveTab("agenda")}
          >
            <CalendarIcon className="w-4 h-4" />
            Agenda
          </Button>
          <Button
            variant={activeTab === "financeiro" ? "secondary" : "ghost"}
            className="justify-start gap-3 rounded-lg text-sm"
            onClick={() => setActiveTab("financeiro")}
          >
            <DollarSignIcon className="w-4 h-4" />
            Financeiro
          </Button>
          <Button
            variant={activeTab === "servicos" ? "secondary" : "ghost"}
            className="justify-start gap-3 rounded-lg text-sm"
            onClick={() => setActiveTab("servicos")}
          >
            <ScissorsIcon className="w-4 h-4" />
            Serviços
          </Button>
          <Button
            variant={activeTab === "equipe" ? "secondary" : "ghost"}
            className="justify-start gap-3 rounded-lg text-sm"
            onClick={() => setActiveTab("equipe")}
          >
            <UsersIcon className="w-4 h-4" />
            Equipe
          </Button>
          <Button
            variant={activeTab === "marketing" ? "secondary" : "ghost"}
            className="justify-start gap-3 rounded-lg text-sm"
            onClick={() => setActiveTab("marketing")}
          >
            <Share2Icon className="w-4 h-4" />
            Divulgação
          </Button>
          <Button
            variant={activeTab === "config" ? "secondary" : "ghost"}
            className="justify-start gap-3 rounded-lg text-sm"
            onClick={() => setActiveTab("config")}
          >
            <SettingsIcon className="w-4 h-4" />
            Configurar
          </Button>
        </nav>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === "agenda" && (
          <AgendaTab bookings={bookings} onUpdateStatus={handleUpdateBookingStatus} />
        )}
        {activeTab === "financeiro" && (
          <FinanceiroTab bookings={bookings} />
        )}
        {activeTab === "servicos" && (
          <ServicosTab 
            barbershop={barbershop} 
            isLoading={isLoading} 
            onAddService={handleAddService} 
            onDeleteService={handleDeleteService} 
          />
        )}
        {activeTab === "equipe" && (
          <EquipeTab 
            barbershop={barbershop} 
            isLoading={isLoading} 
            onAddBarber={handleAddBarber} 
            onDeleteBarber={handleDeleteBarber} 
          />
        )}
        {activeTab === "marketing" && (
          <MarketingTab barbershop={barbershop} />
        )}
        {activeTab === "config" && (
          <ConfigTab 
            barbershop={barbershop} 
            isLoading={isLoading} 
            onUpdateConfig={handleUpdateConfig} 
          />
        )}
      </main>
    </div>
  )
}