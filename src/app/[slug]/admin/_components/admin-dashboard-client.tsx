"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { Barbershop, BarbershopService, Barber, Booking, User, Product, BlockedTime, ProductSale, FinancialTransaction, SubscriptionPayment } from "@prisma/client"
import { Button } from "@/app/_components/ui/button"
import {
  Calendar as CalendarIcon,
  DollarSign,
  Scissors,
  Users,
  Share2,
  Settings,
  LayoutDashboard,
  TrendingUp,
  Menu,
  X,
  Store,
  History,
  Coins,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Bell,
  Moon,
  Sun
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

const TabLoading = () => (
  <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground" role="status">
    Carregando painel...
  </div>
)

// Carrega cada área apenas quando ela é aberta, mantendo a agenda como a primeira tela rápida.
const AgendaTab = dynamic(() => import("./agenda-tab"), { loading: TabLoading })
const OverviewTab = dynamic(() => import("./overview-tab"), { loading: TabLoading })
const HistoricoTab = dynamic(() => import("./historico-tab"), { loading: TabLoading })
const FinanceiroTab = dynamic(() => import("./financeiro-tab"), { loading: TabLoading })
const RelatoriosProdutosServicosTab = dynamic(() => import("./relatorios-produtos-servicos-tab"), { loading: TabLoading })
const RelatoriosComissoesTab = dynamic(() => import("./relatorios-comissoes-tab"), { loading: TabLoading })
const ServicosTab = dynamic(() => import("./servicos-tab"), { loading: TabLoading })
const ProdutosTab = dynamic(() => import("./produtos-tab"), { loading: TabLoading })
const EquipeTab = dynamic(() => import("./equipe-tab"), { loading: TabLoading })
const MarketingTab = dynamic(() => import("./marketing-tab"), { loading: TabLoading })
const ConfigTab = dynamic(() => import("./config-tab"), { loading: TabLoading })
const QuickSetupModal = dynamic(() => import("./quick-setup-modal"), { loading: () => null })

type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

type TabType =
  | "overview"
  | "agenda"
  | "historico"
  | "financeiro"
  | "comissoes"
  | "relatorio_produtos_servicos"
  | "servicos"
  | "produtos"
  | "equipe"
  | "marketing"
  | "config"

interface AdminDashboardClientProps {
  barbershop: Barbershop & {
    services: BarbershopService[]
    barbers: Barber[]
    products?: Product[]
    blockedTimes?: BlockedTime[]
    productSales?: ProductSale[]
    transactions?: FinancialTransaction[]
    subscriptionPayments?: SubscriptionPayment[]
  }
  bookings: BookingWithDetails[]
  userBarbershops?: {
    id: string
    name: string
    slug: string | null
    imageUrl: string
    subscriptionActive: boolean
  }[]
  userRole: "OWNER" | "ADMIN" | "EMPLOYEE"
}

export default function AdminDashboardClient({
  barbershop,
  bookings,
  userBarbershops = [],
  userRole
}: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>(userRole === "EMPLOYEE" ? "agenda" : "overview")
  const [isLoading, setIsLoading] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isQuickSetupOpen, setIsQuickSetupOpen] = useState(false)
  const [isUnitSelectorOpen, setIsUnitSelectorOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    setIsDarkMode(window.localStorage.getItem("barber-m-admin-theme") === "dark")
  }, [])

  const toggleTheme = () => {
    setIsDarkMode((current) => {
      const next = !current
      window.localStorage.setItem("barber-m-admin-theme", next ? "dark" : "light")
      return next
    })
  }

  const activeTabLabel: Record<TabType, string> = {
    overview: "Visão geral",
    agenda: "Agenda",
    historico: "Histórico",
    financeiro: "Financeiro",
    comissoes: "Comissões",
    relatorio_produtos_servicos: "Produtos e serviços",
    servicos: "Serviços",
    produtos: "Produtos",
    equipe: "Equipe",
    marketing: "Divulgação",
    config: "Configurações",
  }

  const navigationItemClass = (tab: TabType) =>
    `w-full flex items-center gap-2.5 px-3 py-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
      activeTab === tab
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
    }`

  // Handlers para ações herdadas
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
          : "Agendamento atualizado!"
      )
    } catch (err: any) {
      toast.error(err.message || "Não foi possível atualizar o agendamento. Tente novamente.")
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
      toast.error(err.message || "Não foi possível adicionar o serviço. Tente novamente.")
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
      toast.error(err.message || "Não foi possível remover o serviço. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddBarber = async (params: { name: string; imageUrl: string; email?: string; phone?: string }) => {
    try {
      setIsLoading(true)
      await addBarberAction({
        barbershopId: barbershop.id,
        ...params
      })
      toast.success("Profissional cadastrado com sucesso!")
    } catch (err: any) {
      toast.error(err.message || "Não foi possível adicionar o profissional. Tente novamente.")
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
      toast.error(err.message || "Não foi possível remover o profissional. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateConfig = async (params: any) => {
    try {
      setIsLoading(true)
      await updateBarbershopConfig({
        barbershopId: barbershop.id,
        ...params
      })
      toast.success("Configurações atualizadas!")
    } catch (err: any) {
      toast.error(err.message || "Não foi possível atualizar as configurações. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`${isDarkMode ? "admin-dark" : "admin-light"} admin-template flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground md:flex-row`}>
      {isLoading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 text-warning font-bold gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-warning border-t-transparent animate-spin" />
          <span>Processando alterações...</span>
        </div>
      )}

      {/* 📱 Mobile Top Header */}
      <header className="safe-area-top md:hidden flex items-center justify-between p-4 border-b border-border/80 bg-card sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border bg-primary text-sm font-bold text-primary-foreground">
            {barbershop.imageUrl ? (
              <Image src={barbershop.imageUrl} alt={barbershop.name} fill sizes="36px" className="object-cover" />
            ) : (
              barbershop.name.substring(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="font-bold text-sm line-clamp-1">{barbershop.name}</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-success font-semibold uppercase tracking-wider">Unidade Ativa</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label={isDarkMode ? "Usar tema claro" : "Usar tema escuro"} aria-pressed={isDarkMode} onClick={toggleTheme}>
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)} aria-label="Abrir menu">
            <Menu className="w-6 h-6 text-foreground" />
          </Button>
        </div>
      </header>

      {/* 🍔 Drawer Mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsMenuOpen(false)} />

          <aside className="relative flex w-[min(18rem,88vw)] max-w-none flex-col overflow-y-auto border-r border-border bg-card p-5 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
              <span className="font-bold text-sm text-warning uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4" /> Menu Principal
              </span>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </Button>
            </div>

            {/* SELETOR DE UNIDADE NO DRAWER */}
            <div className="mb-6 p-3 rounded-xl bg-secondary/30 border border-border/80">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Unidade Atual</span>
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-foreground line-clamp-1">{barbershop.name}</strong>
                <span className="text-[10px] bg-success/20 text-success font-bold px-2 py-0.5 rounded-full">
                  Ativa
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsQuickSetupOpen(true)
                }}
                className="mt-2 h-7 w-full rounded-lg border border-border bg-secondary text-[11px] font-bold text-foreground hover:bg-accent"
              >
                <Sparkles className="w-3 h-3 mr-1" /> Configurar Unidade
              </Button>
            </div>

            {/* ITENS DO MENU NO MOBILE */}
            <nav className="flex flex-col gap-4 text-xs font-medium">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-2 mb-1.5">
                  Gestão
                </span>
                <div className="space-y-1">
                  {userRole !== "EMPLOYEE" && (
                    <button
                      onClick={() => { setActiveTab("overview"); setIsMenuOpen(false) }}
                      className={navigationItemClass("overview")}
                      aria-current={activeTab === "overview" ? "page" : undefined}
                    >
                      <LayoutDashboard className="w-4 h-4" /> Visão geral
                    </button>
                  )}
                  <button
                    onClick={() => { setActiveTab("agenda"); setIsMenuOpen(false) }}
                    className={navigationItemClass("agenda")}
                    aria-current={activeTab === "agenda" ? "page" : undefined}
                  >
                    <CalendarIcon className="w-4 h-4" /> Agenda
                  </button>
                  <button
                    onClick={() => { setActiveTab("historico"); setIsMenuOpen(false) }}
                    className={navigationItemClass("historico")}
                    aria-current={activeTab === "historico" ? "page" : undefined}
                  >
                    <History className="w-4 h-4" /> Histórico
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-2 mb-1.5">
                  Financeiro
                </span>
                <div className="space-y-1">
                  <button
                    onClick={() => { setActiveTab("financeiro"); setIsMenuOpen(false) }}
                    className={navigationItemClass("financeiro")}
                    aria-current={activeTab === "financeiro" ? "page" : undefined}
                  >
                      <DollarSign className="w-4 h-4" /> Financeiro
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-2 mb-1.5">
                  Relatórios
                </span>
                <div className="space-y-1">
                  <button
                    onClick={() => { setActiveTab("comissoes"); setIsMenuOpen(false) }}
                    className={navigationItemClass("comissoes")}
                    aria-current={activeTab === "comissoes" ? "page" : undefined}
                  >
                    <Coins className="w-4 h-4" /> Comissões
                  </button>
                  <button
                    onClick={() => { setActiveTab("relatorio_produtos_servicos"); setIsMenuOpen(false) }}
                    className={navigationItemClass("relatorio_produtos_servicos")}
                    aria-current={activeTab === "relatorio_produtos_servicos" ? "page" : undefined}
                  >
                    <Scissors className="w-4 h-4" /> Produtos e Serviços
                  </button>
                </div>
              </div>

              {userRole !== "EMPLOYEE" && (
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-2 mb-1.5">
                    Cadastros
                  </span>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setActiveTab("servicos"); setIsMenuOpen(false) }}
                      className={navigationItemClass("servicos")}
                      aria-current={activeTab === "servicos" ? "page" : undefined}
                    >
                      <Scissors className="w-4 h-4" /> Serviços
                    </button>
                    <button
                      onClick={() => { setActiveTab("produtos"); setIsMenuOpen(false) }}
                      className={navigationItemClass("produtos")}
                      aria-current={activeTab === "produtos" ? "page" : undefined}
                    >
                      <ShoppingBag className="w-4 h-4" /> Produtos
                    </button>
                    <button
                      onClick={() => { setActiveTab("equipe"); setIsMenuOpen(false) }}
                      className={navigationItemClass("equipe")}
                      aria-current={activeTab === "equipe" ? "page" : undefined}
                    >
                      <Users className="w-4 h-4" /> Equipe
                    </button>
                    <button
                      onClick={() => { setActiveTab("config"); setIsMenuOpen(false) }}
                      className={navigationItemClass("config")}
                      aria-current={activeTab === "config" ? "page" : undefined}
                    >
                      <Settings className="w-4 h-4" /> Configurar
                    </button>
                  </div>
                </div>
              )}
            </nav>
          </aside>
        </div>
      )}

      {/* Navegação persistente: compacta, clara e orientada à operação. */}
      <aside className="hidden w-64 shrink-0 select-none flex-col justify-between border-r border-sidebar-border bg-sidebar px-3 py-4 md:flex">
        <div className="space-y-5">
          {/* Unidade atual */}
          <div className="relative">
            <button
              onClick={() => setIsUnitSelectorOpen(!isUnitSelectorOpen)}
              aria-expanded={isUnitSelectorOpen}
              aria-haspopup="menu"
              className="group flex w-full items-center justify-between rounded-md border border-transparent p-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-primary text-base font-bold text-primary-foreground">
                  {barbershop.imageUrl ? (
                    <Image src={barbershop.imageUrl} alt={barbershop.name} fill sizes="40px" className="object-cover" />
                  ) : (
                    <Store className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xs font-bold text-foreground">
                    {barbershop.name}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="text-[10px] font-semibold text-muted-foreground">Unidade ativa</span>
                  </div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Menu Dropdown do Seletor de Unidade */}
            {isUnitSelectorOpen && (
              <div role="menu" className="absolute left-0 right-0 top-full z-50 mt-2 space-y-1.5 rounded-xl border border-border bg-popover p-2 shadow-lg animate-in fade-in zoom-in-95">
                <span className="text-[10px] uppercase font-bold text-muted-foreground px-2">Suas Unidades</span>
                {userBarbershops.map((shop) => (
                  <a
                    key={shop.id}
                    href={`/${shop.slug}/admin`}
                    role="menuitem"
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors ${
                      shop.id === barbershop.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                    }`}
                  >
                    <span className="truncate">{shop.name}</span>
                    {shop.id === barbershop.id && <span className="text-[9px] font-bold uppercase">Atual</span>}
                  </a>
                ))}

                <div className="pt-1 border-t border-border/40">
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsUnitSelectorOpen(false)
                      setIsQuickSetupOpen(true)
                    }}
                    className="h-8 w-full gap-1.5 rounded-lg bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/85"
                  >
                      <Sparkles className="w-3.5 h-3.5" /> Configurar unidade
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Grupos de navegação */}
          <nav className="flex flex-col gap-5 text-xs font-medium">
            {/* Gestão */}
            <div>
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block px-2 mb-1.5">
                Gestão
              </span>
              <div className="space-y-1">
                {userRole !== "EMPLOYEE" && (
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={navigationItemClass("overview")}
                    aria-current={activeTab === "overview" ? "page" : undefined}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Visão geral
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("agenda")}
                  className={navigationItemClass("agenda")}
                  aria-current={activeTab === "agenda" ? "page" : undefined}
                >
                  <CalendarIcon className="w-4 h-4" /> Agenda
                </button>
                <button
                  onClick={() => setActiveTab("historico")}
                  className={navigationItemClass("historico")}
                  aria-current={activeTab === "historico" ? "page" : undefined}
                >
                  <History className="w-4 h-4" /> Histórico
                </button>
              </div>
            </div>

            {/* Financeiro */}
            <div>
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block px-2 mb-1.5">
                Financeiro
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("financeiro")}
                  className={navigationItemClass("financeiro")}
                  aria-current={activeTab === "financeiro" ? "page" : undefined}
                >
                  <DollarSign className="w-4 h-4" /> Financeiro
                </button>
              </div>
            </div>

            {/* Relatórios */}
            <div>
              <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block px-2 mb-1.5">
                Relatórios
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("comissoes")}
                  className={navigationItemClass("comissoes")}
                  aria-current={activeTab === "comissoes" ? "page" : undefined}
                >
                  <Coins className="w-4 h-4" /> Comissões
                </button>
                <button
                  onClick={() => setActiveTab("relatorio_produtos_servicos")}
                  className={navigationItemClass("relatorio_produtos_servicos")}
                  aria-current={activeTab === "relatorio_produtos_servicos" ? "page" : undefined}
                >
                  <Scissors className="w-4 h-4" /> Produtos e Serviços
                </button>
              </div>
            </div>

            {/* Cadastros */}
            {userRole !== "EMPLOYEE" && (
              <div>
                <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block px-2 mb-1.5">
                  Cadastros
                </span>
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTab("servicos")}
                    className={navigationItemClass("servicos")}
                    aria-current={activeTab === "servicos" ? "page" : undefined}
                  >
                    <Scissors className="w-4 h-4" /> Serviços
                  </button>
                  <button
                    onClick={() => setActiveTab("produtos")}
                    className={navigationItemClass("produtos")}
                    aria-current={activeTab === "produtos" ? "page" : undefined}
                  >
                    <ShoppingBag className="w-4 h-4" /> Produtos (Estoque)
                  </button>
                  <button
                    onClick={() => setActiveTab("equipe")}
                    className={navigationItemClass("equipe")}
                    aria-current={activeTab === "equipe" ? "page" : undefined}
                  >
                    <Users className="w-4 h-4" /> Equipe
                  </button>
                  <button
                    onClick={() => setActiveTab("config")}
                    className={navigationItemClass("config")}
                    aria-current={activeTab === "config" ? "page" : undefined}
                  >
                      <Settings className="w-4 h-4" /> Configurações
                  </button>
                  <button
                    onClick={() => setActiveTab("marketing")}
                    className={navigationItemClass("marketing")}
                    aria-current={activeTab === "marketing" ? "page" : undefined}
                  >
                    <Share2 className="w-4 h-4" /> Divulgação
                  </button>
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="pt-4 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>Barbearia SaaS v2.0</span>
          <span className="w-2 h-2 rounded-full bg-success" />
        </div>
      </aside>

      <div className="min-w-0 flex min-h-screen flex-1 flex-col bg-background">
        <header className="sticky top-0 z-30 hidden h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6 md:flex">
          <div className="flex items-center gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <nav aria-label="Navegação estrutural" className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Painel</span>
              <ChevronRight className="size-3.5 text-muted-foreground/70" aria-hidden="true" />
              <span className="font-medium text-foreground" aria-live="polite">{activeTabLabel[activeTab]}</span>
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label={isDarkMode ? "Usar tema claro" : "Usar tema escuro"}
              aria-pressed={isDarkMode}
              onClick={toggleTheme}
              title={isDarkMode ? "Usar tema claro" : "Usar tema escuro"}
            >
              {isDarkMode ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ver notificações"
              onClick={() => toast.info("Nenhuma notificação nova.")}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="default"
              onClick={() => setIsQuickSetupOpen(true)}
              className="ml-1 max-w-56 gap-2 rounded-md border-l border-border pl-3"
            >
              <span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-primary text-[10px] font-bold text-primary-foreground">
                {barbershop.imageUrl ? <Image src={barbershop.imageUrl} alt="" width={24} height={24} className="size-full object-cover" /> : <Store className="h-3.5 w-3.5" aria-hidden="true" />}
              </span>
              <span className="truncate">{barbershop.name}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[90rem] flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-7">
        {activeTab === "overview" && userRole !== "EMPLOYEE" && (
          <OverviewTab
            barbershop={barbershop}
            bookings={bookings}
            productSales={barbershop.productSales || []}
            transactions={barbershop.transactions || []}
            onOpenAgenda={() => setActiveTab("agenda")}
          />
        )}

        {/* Agenda */}
        {activeTab === "agenda" && (
          <AgendaTab
            barbershop={barbershop}
            bookings={bookings}
            onUpdateStatus={handleUpdateBookingStatus}
          />
        )}

        {/* 2. SUB-ABA HISTÓRICO */}
        {activeTab === "historico" && (
          <HistoricoTab bookings={bookings} />
        )}

        {/* 3. ABA FINANCEIRO -> DASHBOARD (Idêntica à Imagem 2) */}
        {activeTab === "financeiro" && userRole !== "EMPLOYEE" && (
          <FinanceiroTab
            barbershopId={barbershop.id}
            barbershopName={barbershop.name}
            bookings={bookings}
            productSales={barbershop.productSales}
            transactions={barbershop.transactions}
            subscriptionPayments={barbershop.subscriptionPayments}
            subscriptionActive={barbershop.subscriptionActive}
            trialEndsAt={barbershop.trialEndsAt}
          />
        )}

        {/* 4. ABA RELATÓRIOS -> COMISSÕES (Idêntica à Imagem 4) */}
        {activeTab === "comissoes" && (
          <RelatoriosComissoesTab
            barbershop={barbershop}
            bookings={bookings}
            productSales={barbershop.productSales}
            transactions={barbershop.transactions}
          />
        )}

        {/* 5. ABA RELATÓRIOS -> PRODUTOS E SERVIÇOS (Idêntica à Imagem 3) */}
        {activeTab === "relatorio_produtos_servicos" && (
          <RelatoriosProdutosServicosTab
            barbershop={barbershop}
            bookings={bookings}
            productSales={barbershop.productSales}
          />
        )}

        {/* 6. CADASTROS: SERVIÇOS */}
        {activeTab === "servicos" && (
          <ServicosTab
            barbershop={barbershop}
            isLoading={isLoading}
            onAddService={handleAddService}
            onDeleteService={handleDeleteService}
          />
        )}

        {/* 7. CADASTROS: PRODUTOS */}
        {activeTab === "produtos" && (
          <ProdutosTab
            barbershopId={barbershop.id}
            products={barbershop.products || []}
          />
        )}

        {/* 8. CADASTROS: EQUIPE */}
        {activeTab === "equipe" && (
          <EquipeTab
            barbershop={barbershop}
            isLoading={isLoading}
            onAddBarber={handleAddBarber}
            onDeleteBarber={handleDeleteBarber}
          />
        )}

        {/* 9. CADASTROS: DIVULGAÇÃO */}
        {activeTab === "marketing" && (
          <MarketingTab barbershop={barbershop} />
        )}

        {/* 10. CADASTROS: CONFIGURAR */}
        {activeTab === "config" && (
          <ConfigTab
            barbershop={barbershop}
            isLoading={isLoading}
            onUpdateConfig={handleUpdateConfig}
          />
        )}
        </main>
      </div>

      {/* 🌟 MODAL DE QUICK SETUP / CONFIGURAÇÃO DE UNIDADE */}
      <QuickSetupModal
        open={isQuickSetupOpen}
        onOpenChange={setIsQuickSetupOpen}
        barbershop={barbershop}
      />
    </div>
  )
}
