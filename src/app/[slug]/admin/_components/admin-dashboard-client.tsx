"use client"

import { useState, useMemo } from "react"
import { Barbershop, BarbershopService, Barber, Booking, User } from "@prisma/client"
import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { 
  CalendarIcon, 
  DollarSignIcon, 
  ScissorsIcon, 
  UsersIcon, 
  Share2Icon, 
  SettingsIcon,
  PlusIcon,
  Trash2Icon,
  CopyIcon,
  ExternalLinkIcon,
  CheckCircle2Icon
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { 
  addServiceAction, 
  deleteServiceAction, 
  addBarberAction, 
  deleteBarberAction, 
  updateBarbershopConfig 
} from "@/app/_actions/admin-actions"

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

  // --- Estados do Formulário de Serviço ---
  const [newServiceName, setNewServiceName] = useState("")
  const [newServicePrice, setNewServicePrice] = useState("")
  const [newServiceDescription, setNewServiceDescription] = useState("")
  const [newServiceImageUrl, setNewServiceImageUrl] = useState("")

  // --- Estados do Formulário de Barbeiro ---
  const [newBarberName, setNewBarberName] = useState("")
  const [newBarberImageUrl, setNewBarberImageUrl] = useState("")

  // --- Estados do Formulário de Configuração da Barbearia ---
  const [shopName, setShopName] = useState(barbershop.name)
  const [shopAddress, setShopAddress] = useState(barbershop.address)
  const [shopPhone, setShopPhone] = useState(barbershop.phones[0] || "")
  const [shopDescription, setShopDescription] = useState(barbershop.description)
  const [shopLogoUrl, setShopLogoUrl] = useState(barbershop.imageUrl)
  const [shopBannerUrl, setShopBannerUrl] = useState(barbershop.bannerUrl || "")
  const [shopWelcomeMessage, setShopWelcomeMessage] = useState(barbershop.welcomeMessage || "")
  const [shopInstagramUrl, setShopInstagramUrl] = useState(barbershop.instagramUrl || "")

  // --- LÓGICA DO FINANCEIRO ---
  const financeData = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    // Filtra agendamentos do mês atual que não estejam cancelados
    const monthlyBookings = bookings.filter((b) => {
      const date = new Date(b.date)
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        b.status !== "CANCELLED"
      );
    })

    const faturamentoEstimado = monthlyBookings.reduce((sum, b) => sum + Number(b.service.price), 0)
    
    const pagamentosOnline = monthlyBookings
      .filter((b) => b.paymentMethod === "ONLINE" && b.paymentStatus === "PAID")
      .reduce((sum, b) => sum + Number(b.service.price), 0)

    const pagamentosNoLocal = monthlyBookings
      .filter((b) => b.paymentMethod === "ON_SITE")
      .reduce((sum, b) => sum + Number(b.service.price), 0)

    return {
      faturamentoEstimado,
      totalAgendamentos: monthlyBookings.length,
      pagamentosOnline,
      pagamentosNoLocal,
    }
  }, [bookings])

  // --- DESEMPENHO DA EQUIPE (CORTES POR BARBEIRO) ---
  const barbersPerformance = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const contagem: Record<string, number> = {}

    bookings.forEach((b) => {
      const date = new Date(b.date)
      if (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        b.status !== "CANCELLED"
      ) {
        const barberName = b.barber?.name || "Qualquer Profissional"
        contagem[barberName] = (contagem[barberName] || 0) + 1
      }
    })

    return Object.entries(contagem).map(([name, qtd]) => ({ name, qtd }))
  }, [bookings])


  // --- MARKETING INFO ---
  const publicBookingUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/${barbershop.slug}` 
    : `/${barbershop.slug}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicBookingUrl)
    toast.success("Link de agendamento copiado!")
  }

  const handleShareWhatsapp = () => {
    const message = `Olá! Agende seu corte ou barba na barbearia *${barbershop.name}* com rapidez pelo nosso link: ${publicBookingUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
  }

  // --- SUBMIT SERVICES CRUD ---
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServiceName || !newServicePrice || !newServiceDescription || !newServiceImageUrl) {
      toast.error("Por favor, preencha todos os campos do serviço.")
      return
    }

    try {
      setIsLoading(true)
      await addServiceAction({
        barbershopId: barbershop.id,
        name: newServiceName,
        price: Number(newServicePrice),
        description: newServiceDescription,
        imageUrl: newServiceImageUrl
      })
      toast.success("Serviço cadastrado com sucesso!")
      setNewServiceName("")
      setNewServicePrice("")
      setNewServiceDescription("")
      setNewServiceImageUrl("")
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar serviço.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço? Todos os agendamentos dele serão deletados!")) return
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

  // --- SUBMIT BARBERS CRUD ---
  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBarberName || !newBarberImageUrl) {
      toast.error("Por favor, preencha todos os campos do profissional.")
      return
    }

    try {
      setIsLoading(true)
      await addBarberAction({
        barbershopId: barbershop.id,
        name: newBarberName,
        imageUrl: newBarberImageUrl
      })
      toast.success("Profissional contratado com sucesso!")
      setNewBarberName("")
      setNewBarberImageUrl("")
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar profissional.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteBarber = async (barberId: string) => {
    if (!confirm("Tem certeza que deseja remover este profissional da equipe?")) return
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

  // --- SUBMIT SETTINGS UPDATE ---
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopName || !shopAddress || !shopPhone || !shopDescription || !shopLogoUrl) {
      toast.error("Preencha todos os campos obrigatórios.")
      return
    }

    try {
      setIsLoading(true)
      await updateBarbershopConfig({
        barbershopId: barbershop.id,
        name: shopName,
        address: shopAddress,
        phones: [shopPhone],
        description: shopDescription,
        imageUrl: shopLogoUrl,
        bannerUrl: shopBannerUrl || null,
        welcomeMessage: shopWelcomeMessage || null,
        instagramUrl: shopInstagramUrl || null
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
      
      {/* Sidebar de Navegação */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-secondary p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-black text-sm">
              {barbershop.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-sm line-clamp-1">{barbershop.name}</h1>
              <p className="text-[10px] text-primary uppercase font-semibold tracking-wider">Painel do Admin</p>
            </div>
          </div>

          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            <Button
              variant={activeTab === "agenda" ? "secondary" : "ghost"}
              className="justify-start gap-2 rounded-lg text-xs md:text-sm"
              onClick={() => setActiveTab("agenda")}
            >
              <CalendarIcon className="w-4 h-4" />
              Agenda
            </Button>
            <Button
              variant={activeTab === "financeiro" ? "secondary" : "ghost"}
              className="justify-start gap-2 rounded-lg text-xs md:text-sm"
              onClick={() => setActiveTab("financeiro")}
            >
              <DollarSignIcon className="w-4 h-4" />
              Financeiro
            </Button>
            <Button
              variant={activeTab === "servicos" ? "secondary" : "ghost"}
              className="justify-start gap-2 rounded-lg text-xs md:text-sm"
              onClick={() => setActiveTab("servicos")}
            >
              <ScissorsIcon className="w-4 h-4" />
              Serviços
            </Button>
            <Button
              variant={activeTab === "equipe" ? "secondary" : "ghost"}
              className="justify-start gap-2 rounded-lg text-xs md:text-sm"
              onClick={() => setActiveTab("equipe")}
            >
              <UsersIcon className="w-4 h-4" />
              Equipe
            </Button>
            <Button
              variant={activeTab === "marketing" ? "secondary" : "ghost"}
              className="justify-start gap-2 rounded-lg text-xs md:text-sm"
              onClick={() => setActiveTab("marketing")}
            >
              <Share2Icon className="w-4 h-4" />
              Divulgação
            </Button>
            <Button
              variant={activeTab === "config" ? "secondary" : "ghost"}
              className="justify-start gap-2 rounded-lg text-xs md:text-sm"
              onClick={() => setActiveTab("config")}
            >
              <SettingsIcon className="w-4 h-4" />
              Configurar
            </Button>
          </nav>
        </div>

        {/* Informações da Licença/Trial */}
        <div className="mt-6 md:mt-0 pt-4 border-t border-secondary text-xs text-muted-foreground space-y-1.5 hidden md:block">
          <p>
            Plano: <strong className="text-primary font-semibold">
              {barbershop.subscriptionActive ? "Mensal Ativo" : "Período de Testes"}
            </strong>
          </p>
          {barbershop.trialEndsAt && !barbershop.subscriptionActive && (
            <p>
              Expira em: <strong>
                {format(new Date(barbershop.trialEndsAt), "dd/MM/yyyy")}
              </strong>
            </p>
          )}
        </div>
      </aside>

      {/* Área de Conteúdo */}
      <main className="flex-1 p-6 overflow-y-auto">
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 text-primary font-bold">
            Carregando alterações...
          </div>
        )}

        {/* ----------------- ABA 1: AGENDA ----------------- */}
        {activeTab === "agenda" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Agendamentos Realizados</h2>
              <p className="text-xs text-muted-foreground">Listagem histórica dos horários marcados pelos clientes.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {bookings.length > 0 ? (
                bookings.map((booking) => {
                  const isPastBooking = new Date(booking.date) < new Date()
                  return (
                    <Card key={booking.id} className="border-secondary hover:border-primary/40 transition-colors">
                      <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-200">
                              {booking.user.name || "Cliente sem Nome"}
                            </span>
                            {isPastBooking ? (
                              <span className="text-[10px] bg-secondary text-gray-400 px-2 py-0.5 rounded-full">Finalizado</span>
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

                        <div className="bg-secondary/40 p-3 rounded-lg border border-secondary text-right w-full sm:w-auto">
                          <p className="text-xs font-bold text-primary uppercase">
                            {format(new Date(booking.date), "dd 'de' MMMM", { locale: ptBR })}
                          </p>
                          <p className="text-sm font-semibold text-gray-300">
                            às {format(new Date(booking.date), "HH:mm")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-secondary rounded-lg">
                  Nenhum agendamento realizado até o momento.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ----------------- ABA 2: FINANCEIRO ----------------- */}
        {activeTab === "financeiro" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Painel de Valores</h2>
              <p className="text-xs text-muted-foreground">Métricas estimadas do faturamento obtido através dos agendamentos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-secondary bg-secondary/20">
                <CardContent className="p-5 space-y-2">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Faturamento Mensal Estimado</span>
                  <p className="text-3xl font-bold text-primary">
                    R$ {financeData.faturamentoEstimado.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500">Soma de todos os cortes agendados para este mês.</p>
                </CardContent>
              </Card>

              <Card className="border-secondary bg-secondary/20">
                <CardContent className="p-5 space-y-2">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Total de Agendamentos</span>
                  <p className="text-3xl font-bold text-gray-200">
                    {financeData.totalAgendamentos}
                  </p>
                  <p className="text-[10px] text-gray-500">Agendamentos marcados no mês atual (exclui cancelados).</p>
                </CardContent>
              </Card>

              <Card className="border-secondary bg-secondary/20">
                <CardContent className="p-5 space-y-2">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Agendamentos Pagos Online</span>
                  <p className="text-3xl font-bold text-green-500">
                    R$ {financeData.pagamentosOnline.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-500">Valor já compensado e aprovado via Stripe.</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-secondary/20 border border-secondary p-5 rounded-xl space-y-3">
              <h3 className="font-bold text-sm text-gray-200">Divisão Detalhada (Mês Corrente)</h3>
              <div className="flex justify-between text-xs py-1 border-b border-secondary/50">
                <span className="text-gray-400">Total a receber no local (Dinheiro/Máquina):</span>
                <span className="font-semibold text-gray-200">R$ {financeData.pagamentosNoLocal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-gray-400">Total recebido em cartões online (Stripe):</span>
                <span className="font-semibold text-gray-200">R$ {financeData.pagamentosOnline.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-secondary/20 border border-secondary p-5 rounded-xl space-y-3">
              <h3 className="font-bold text-sm text-gray-200">Desempenho da Equipe (Cortes por Profissional)</h3>
              {barbersPerformance.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {barbersPerformance.map((item) => (
                    <div key={item.name} className="flex justify-between text-xs py-1 border-b border-secondary/30 last:border-b-0">
                      <span className="text-gray-400">{item.name}:</span>
                      <span className="font-semibold text-primary">{item.qtd} corte(s) / serviço(s)</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum serviço realizado por profissionais este mês.</p>
              )}
            </div>

          </div>
        )}

        {/* ----------------- ABA 3: SERVIÇOS ----------------- */}
        {activeTab === "servicos" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Gerenciamento de Serviços</h2>
              <p className="text-xs text-muted-foreground">Cadastre novos tipos de serviço ou gerencie os preços atuais.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Formulário de Adicionar Serviço */}
              <Card className="border-secondary h-fit">
                <CardContent className="p-5">
                  <h3 className="font-bold text-sm text-primary mb-4 flex items-center gap-1">
                    <PlusIcon className="w-4 h-4" /> Novo Serviço
                  </h3>
                  <form onSubmit={handleAddService} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Nome do Serviço</label>
                      <Input placeholder="Ex: Luzes / Nevou" value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} required />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Preço (R$)</label>
                      <Input type="number" step="0.01" placeholder="Ex: 80.00" value={newServicePrice} onChange={(e) => setNewServicePrice(e.target.value)} required />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Descrição Curta</label>
                      <Input placeholder="Ex: Descoloração platinada completa" value={newServiceDescription} onChange={(e) => setNewServiceDescription(e.target.value)} required />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">URL da Imagem</label>
                      <Input placeholder="Cole o link da foto do corte" value={newServiceImageUrl} onChange={(e) => setNewServiceImageUrl(e.target.value)} required />
                    </div>

                    <Button type="submit" className="w-full mt-2">Cadastrar Serviço</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Listagem de Serviços Atuais */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-bold text-sm text-gray-200">Serviços Cadastrados ({barbershop.services.length})</h3>
                
                {barbershop.services.map((service) => (
                  <Card key={service.id} className="border-secondary bg-secondary/10">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-secondary shrink-0">
                          <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{service.name}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                          <span className="text-xs text-primary font-bold">R$ {Number(service.price).toFixed(2)}</span>
                        </div>
                      </div>

                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="w-8 h-8 rounded-lg"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- ABA 4: EQUIPE ----------------- */}
        {activeTab === "equipe" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Gerenciamento da Equipe</h2>
              <p className="text-xs text-muted-foreground">Cadastre novos barbeiros e profissionais para atender os clientes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Formulário de Adicionar Barbeiro */}
              <Card className="border-secondary h-fit">
                <CardContent className="p-5">
                  <h3 className="font-bold text-sm text-primary mb-4 flex items-center gap-1">
                    <PlusIcon className="w-4 h-4" /> Contratar Barbeiro
                  </h3>
                  <form onSubmit={handleAddBarber} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Nome do Barbeiro</label>
                      <Input placeholder="Ex: João da Silva" value={newBarberName} onChange={(e) => setNewBarberName(e.target.value)} required />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">URL da Imagem de Perfil</label>
                      <Input placeholder="Cole o link da foto do profissional" value={newBarberImageUrl} onChange={(e) => setNewBarberImageUrl(e.target.value)} required />
                    </div>

                    <Button type="submit" className="w-full mt-2">Cadastrar Profissional</Button>
                  </form>
                </CardContent>
              </Card>

              {/* Listagem de Equipe */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="font-bold text-sm text-gray-200">Equipe Atual ({barbershop.barbers.length})</h3>

                {barbershop.barbers.map((barber) => (
                  <Card key={barber.id} className="border-secondary bg-secondary/10">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-secondary shrink-0">
                          <img src={barber.imageUrl} alt={barber.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{barber.name}</h4>
                          <p className="text-xs text-muted-foreground">Profissional ativo para agendamento</p>
                        </div>
                      </div>

                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="w-8 h-8 rounded-lg"
                        onClick={() => handleDeleteBarber(barber.id)}
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- ABA 5: DIVULGAÇÃO / MARKETING ----------------- */}
        {activeTab === "marketing" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Ferramentas de Divulgação</h2>
              <p className="text-xs text-muted-foreground">Compartilhe seu link exclusivo nas redes sociais para receber agendamentos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-secondary">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-bold text-sm text-primary">Seu Link de Agendamento</h3>
                  <p className="text-xs text-muted-foreground">
                    Coloque esse link na bio do Instagram ou envie em grupos no WhatsApp para que os clientes agendem diretamente.
                  </p>

                  <div className="flex bg-black/30 p-3 rounded-lg border border-secondary items-center justify-between gap-2 text-sm font-mono break-all select-all">
                    {publicBookingUrl}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCopyLink} variant="outline" className="flex-1 gap-2 text-xs">
                      <CopyIcon className="w-4 h-4" /> Copiar Link
                    </Button>
                    <a href={publicBookingUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button variant="secondary" className="w-full gap-2 text-xs">
                        <ExternalLinkIcon className="w-4 h-4" /> Abrir Página
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-secondary">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-bold text-sm text-green-500 flex items-center gap-1">
                    <CheckCircle2Icon className="w-4 h-4" /> Divulgar no WhatsApp
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Abra uma mensagem pré-formatada para enviar aos seus contatos convidando-os a fazer agendamento online.
                  </p>

                  <div className="bg-secondary/40 p-3 rounded-lg border border-secondary text-xs text-gray-300 space-y-2">
                    <p className="font-semibold text-gray-400 uppercase tracking-wider text-[9px]">Mensagem que será enviada:</p>
                    <p className="italic">
                      "Olá! Agende seu corte ou barba na barbearia *{barbershop.name}* com rapidez pelo nosso link: {publicBookingUrl}"
                    </p>
                  </div>

                  <Button onClick={handleShareWhatsapp} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2">
                    <Share2Icon className="w-4 h-4" /> Enviar para Contatos
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ----------------- ABA 6: CONFIGURAÇÕES ----------------- */}
        {activeTab === "config" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Configurações do Perfil</h2>
              <p className="text-xs text-muted-foreground">Atualize a identidade visual e informações de contato da sua barbearia.</p>
            </div>

            <Card className="border-secondary">
              <CardContent className="p-5">
                <form onSubmit={handleUpdateConfig} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-semibold">Nome do Estabelecimento *</label>
                      <Input value={shopName} onChange={(e) => setShopName(e.target.value)} required />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-semibold">Telefone de Contato *</label>
                      <Input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-semibold">Endereço Físico *</label>
                    <Input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} required />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-semibold">Descrição / Slogan *</label>
                    <textarea 
                      className="w-full min-h-[70px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring dark:bg-input/30"
                      value={shopDescription}
                      onChange={(e) => setShopDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-semibold">URL do Logo (Logo Redonda) *</label>
                      <Input value={shopLogoUrl} onChange={(e) => setShopLogoUrl(e.target.value)} required />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-semibold">URL do Banner (Imagem Superior)</label>
                      <Input value={shopBannerUrl} onChange={(e) => setShopBannerUrl(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-semibold">Mensagem de Boas-Vindas</label>
                      <Input value={shopWelcomeMessage} onChange={(e) => setShopWelcomeMessage(e.target.value)} />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-semibold">Link do Instagram</label>
                      <Input value={shopInstagramUrl} onChange={(e) => setShopInstagramUrl(e.target.value)} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full py-5 font-bold mt-2">Salvar Configurações</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
