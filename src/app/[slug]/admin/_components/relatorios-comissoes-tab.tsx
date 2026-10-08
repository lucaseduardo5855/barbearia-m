"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Booking, BarbershopService, Barber, User, ProductSale, FinancialTransaction } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import {
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
  UserCheck,
  PlusCircle,
  Search,
  PieChart as PieChartIcon,
  Award,
  Wallet,
  Coins
} from "lucide-react"
import { payBarberCommissionsAction, createFinancialTransactionAction, updateBarberCommissionRateAction } from "@/app/_actions/admin-actions"
import { AdminPageHeader } from "./admin-page-header"

type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

interface RelatoriosComissoesTabProps {
  barbershop: {
    id: string
    name: string
    barbers: Barber[]
    services: BarbershopService[]
  }
  bookings: BookingWithDetails[]
  productSales?: ProductSale[]
  transactions?: FinancialTransaction[]
}

export default function RelatoriosComissoesTab({
  barbershop,
  bookings,
  productSales = [],
  transactions = []
}: RelatoriosComissoesTabProps) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))
  const [searchTerm, setSearchTerm] = useState("")

  // Modais
  const [isPayCommissionOpen, setIsPayCommissionOpen] = useState(false)
  const [selectedBarberToPay, setSelectedBarberToPay] = useState<string>("")
  const [payAmount, setPayAmount] = useState<number>(0)
  const [isSubmittingPay, setIsSubmittingPay] = useState(false)

  const [isAddBonusOpen, setIsAddBonusOpen] = useState(false)
  const [bonusBarberId, setBonusBarberId] = useState<string>("")
  const [bonusType, setBonusType] = useState<"COMISSAO_PAGA" | "VALE">("VALE")
  const [bonusAmount, setBonusAmount] = useState<number>(0)
  const [bonusDesc, setBonusDesc] = useState("")
  const [isSubmittingBonus, setIsSubmittingBonus] = useState(false)

  // Filtra dados no período
  const periodData = useMemo(() => {
    const sDate = new Date(`${startDate}T00:00:00`)
    const eDate = new Date(`${endDate}T23:59:59`)

    const filteredBookings = bookings.filter((b) => {
      const bDate = new Date(b.date)
      return bDate >= sDate && bDate <= eDate
    })

    const filteredSales = productSales.filter((ps) => {
      const psDate = new Date(ps.date)
      return psDate >= sDate && psDate <= eDate
    })

    const filteredTxs = transactions.filter((t) => {
      const tDate = new Date(t.date)
      return tDate >= sDate && tDate <= eDate
    })

    return { filteredBookings, filteredSales, filteredTxs }
  }, [bookings, productSales, transactions, startDate, endDate])

  // Processamento por Colaborador
  const barbersData = useMemo(() => {
    const { filteredBookings, filteredSales, filteredTxs } = periodData

    return barbershop.barbers.map((barber) => {
      const rate = barber.commissionRate ? Number(barber.commissionRate) : 50

      // Agendamentos deste barbeiro
      const barberBookings = filteredBookings.filter((b) => b.barberId === barber.id)
      const finishedBookings = barberBookings.filter((b) => b.status === "DONE")

      // Vendas de serviços (total e comissão)
      const vendasServicos = finishedBookings.reduce(
        (acc, b) => acc + Number(b.totalPrice || b.service.price),
        0
      )
      const comissaoServicos = finishedBookings.reduce((acc, b) => {
        if (b.barberCommissionAmount) return acc + Number(b.barberCommissionAmount)
        return acc + (Number(b.totalPrice || b.service.price) * rate) / 100
      }, 0)

      // Vendas de produtos deste barbeiro
      const barberSales = filteredSales.filter((ps) => ps.barberId === barber.id)
      const vendasProdutos = barberSales.reduce((acc, ps) => acc + Number(ps.totalAmount), 0)
      const comissaoProdutos = barberSales.reduce((acc, ps) => acc + Number(ps.commissionAmount), 0)

      // Total de Vendas
      const vendasTotal = vendasServicos + vendasProdutos

      // Comissões pagas e Vales deste barbeiro
      const comissoesPagas = filteredTxs
        .filter((t) => t.barberId === barber.id && t.type === "COMISSAO_PAGA")
        .reduce((acc, t) => acc + Number(t.amount), 0)

      const vales = filteredTxs
        .filter((t) => t.barberId === barber.id && t.type === "VALE")
        .reduce((acc, t) => acc + Number(t.amount), 0)

      // Comissão Total Bruta
      const comissaoTotalBruta = comissaoServicos + comissaoProdutos

      // Comissão Líquida Pendente a Pagar
      const comissaoPendente = Math.max(0, comissaoTotalBruta - comissoesPagas - vales)

      return {
        barber,
        agendamentosCount: barberBookings.length,
        finalizadosCount: finishedBookings.length,
        vendasTotal,
        vendasServicos,
        vendasProdutos,
        comissaoServicos,
        comissaoProdutos,
        comissaoAssinatura: 0,
        totalExtras: 0,
        comprasProdutosVales: vales,
        comissoesPagas,
        comissaoTotalBruta,
        comissaoPendente,
        rate
      }
    })
  }, [barbershop.barbers, periodData])

  // Métricas Consolidadas (Cards do Topo - Idêntico à Imagem 4)
  const consolidatedMetrics = useMemo(() => {
    const vendasTotal = barbersData.reduce((acc, b) => acc + b.vendasTotal, 0)
    const vendasServicos = barbersData.reduce((acc, b) => acc + b.vendasServicos, 0)
    const vendasProdutos = barbersData.reduce((acc, b) => acc + b.vendasProdutos, 0)
    const comissoesNormais = barbersData.reduce((acc, b) => acc + b.comissaoServicos, 0)
    const comissoesTotal = barbersData.reduce((acc, b) => acc + b.comissaoTotalBruta, 0)
    const comissoesPagas = barbersData.reduce((acc, b) => acc + b.comissoesPagas, 0)
    const comissoesPendentes = barbersData.reduce((acc, b) => acc + b.comissaoPendente, 0)
    const valesPagos = barbersData.reduce((acc, b) => acc + b.comprasProdutosVales, 0)

    const totalBookingsCount = periodData.filteredBookings.length
    const finishedBookingsCount = periodData.filteredBookings.filter((b) => b.status === "DONE").length

    return {
      vendasTotal,
      vendasServicos,
      vendasProdutos,
      comissoesNormais,
      comissoesTotal,
      comissoesPagas,
      comissoesPendentes,
      valesPagos,
      totalBookingsCount,
      finishedBookingsCount,
      comissoesAssinaturas: 0
    }
  }, [barbersData, periodData])

  // Cores do gráfico Donut
  const DONUT_COLORS = ["hsl(var(--info))", "hsl(var(--success))", "hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--primary) / 0.75)", "hsl(var(--info) / 0.75)", "hsl(var(--destructive) / 0.85)"]

  // Exportar Excel/CSV
  const handleExportExcel = () => {
    let csv = "Colaborador,Taxa Comissão,Agendamentos,Vendas Serviços,Vendas Produtos,Vendas Total,Comissão Serviços,Comissão Produtos,Comissão Bruta,Vales/Descontos,Comissão Paga,Comissão Pendente\n"
    barbersData.forEach((b) => {
      csv += `"${b.barber.name}","${b.rate}%",${b.agendamentosCount},"R$ ${b.vendasServicos.toFixed(2)}","R$ ${b.vendasProdutos.toFixed(2)}","R$ ${b.vendasTotal.toFixed(2)}","R$ ${b.comissaoServicos.toFixed(2)}","R$ ${b.comissaoProdutos.toFixed(2)}","R$ ${b.comissaoTotalBruta.toFixed(2)}","R$ ${b.comprasProdutosVales.toFixed(2)}","R$ ${b.comissoesPagas.toFixed(2)}","R$ ${b.comissaoPendente.toFixed(2)}"\n`
    })

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `relatorio_colaboradores_comissoes_${startDate}_a_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Relatório de comissões exportado com sucesso!")
  }

  // Handler: Dar Baixa nas Comissões
  const handlePayCommission = async () => {
    try {
      if (!selectedBarberToPay) {
        toast.error("Selecione um colaborador.")
        return
      }
      if (payAmount <= 0) {
        toast.error("Informe um valor válido.")
        return
      }

      setIsSubmittingPay(true)
      await payBarberCommissionsAction({
        barbershopId: barbershop.id,
        barberId: selectedBarberToPay,
        amount: payAmount,
        description: `Baixa de comissão paga em ${format(new Date(), "dd/MM/yyyy")}`
      })

      toast.success("Baixa na comissão realizada com sucesso!")
      setIsPayCommissionOpen(false)
      setPayAmount(0)
    } catch (err: any) {
    toast.error(err.message || "Não foi possível registrar a baixa da comissão. Tente novamente.")
    } finally {
      setIsSubmittingPay(false)
    }
  }

  // Handler: Adicionar Lançamento / Vale / Bônus para o Barbeiro
  const handleAddBonus = async () => {
    try {
      if (!bonusBarberId) {
        toast.error("Selecione o barbeiro.")
        return
      }
      if (bonusAmount <= 0) {
        toast.error("Informe um valor válido.")
        return
      }

      setIsSubmittingBonus(true)
      await createFinancialTransactionAction({
        barbershopId: barbershop.id,
        barberId: bonusBarberId,
        type: bonusType,
        category: "Comissões",
        description: bonusDesc.trim() || (bonusType === "VALE" ? "Adiantamento / Vale" : "Comissão Extra"),
        amount: bonusAmount,
        date: new Date()
      })

      toast.success("Lançamento adicionado ao colaborador!")
      setIsAddBonusOpen(false)
      setBonusAmount(0)
      setBonusDesc("")
    } catch (err: any) {
    toast.error(err.message || "Não foi possível adicionar o lançamento. Tente novamente.")
    } finally {
      setIsSubmittingBonus(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Coins}
        title="Relatório de colaboradores"
        description="Acompanhe o faturamento por barbeiro, comissões normais, vales e repasses pendentes."
        actions={<>
          <Button
            onClick={() => {
              if (barbershop.barbers.length > 0) {
                setSelectedBarberToPay(barbershop.barbers[0].id)
                const bData = barbersData.find((b) => b.barber.id === barbershop.barbers[0].id)
                setPayAmount(bData?.comissaoPendente || 0)
              }
              setIsPayCommissionOpen(true)
            }}
            className="bg-warning hover:bg-warning/90 text-warning-foreground font-bold gap-2 text-xs h-9 px-4 rounded-lg shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            Dar baixa nas comissões
          </Button>

          <Button
            onClick={handleExportExcel}
            className="bg-warning hover:bg-warning/85 text-warning-foreground font-bold gap-2 text-xs h-9 px-4 rounded-lg shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            Exportar em excel
          </Button>
        </>}
      />

      {/* 📊 GRID DE 10 CARDS DE MÉTRICAS + GRÁFICO DONUT (Idêntico à Imagem 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bloco de 10 Cards */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-2 sm:grid-cols-5">
          {/* Linha 1 */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-black text-success">
              R$ {consolidatedMetrics.vendasTotal.toFixed(2).replace(".", ",")}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">Vendas Total</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-black text-success">
              R$ {consolidatedMetrics.vendasServicos.toFixed(2).replace(".", ",")}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">Total Vendas serviços</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-black text-success">
              R$ {consolidatedMetrics.comissoesAssinaturas.toFixed(2).replace(".", ",")}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">Comissões Assinaturas</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-black text-success">
              R$ {consolidatedMetrics.comissoesPagas.toFixed(2).replace(".", ",")}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">Comissões Pagas</span>
          </div>

          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-lg font-black text-destructive">
              R$ {consolidatedMetrics.comissoesPendentes.toFixed(2).replace(".", ",")}
            </p>
            <span className="mt-1 block text-xs font-semibold text-destructive">Comissões Pendentes</span>
          </div>

          {/* Linha 2 */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-black text-foreground">{consolidatedMetrics.totalBookingsCount}</p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">Vendas Total (Qtd)</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-black text-foreground">{consolidatedMetrics.finishedBookingsCount}</p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">Vendas Finalizados</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-black text-success">
              R$ {consolidatedMetrics.vendasProdutos.toFixed(2).replace(".", ",")}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">Total Vendas produto</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-black text-success">
              R$ {consolidatedMetrics.comissoesNormais.toFixed(2).replace(".", ",")}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">Comissões Normais</span>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-lg font-black text-warning">
              R$ {consolidatedMetrics.comissoesTotal.toFixed(2).replace(".", ",")}
            </p>
            <span className="mt-1 block text-xs font-semibold text-muted-foreground">Comissões Total</span>
          </div>
        </div>

        {/* Gráfico Donut: Detalhamento de Comissões */}
        <div className="flex flex-col items-center justify-between rounded-xl border border-border bg-card p-5 text-center">
          <div className="w-full text-left mb-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-warning" /> Detalhamento de comissões
            </h3>
            <p className="text-[10px] text-muted-foreground">Distribuição entre profissionais</p>
          </div>

          <div className="relative w-44 h-44 my-2">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                let accumulatedPercent = 0
                return barbersData.map((b, idx) => {
                  const percent =
                    consolidatedMetrics.comissoesTotal > 0
                      ? (b.comissaoTotalBruta / consolidatedMetrics.comissoesTotal) * 100
                      : 100 / Math.max(1, barbersData.length)
                  const strokeDasharray = `${percent} ${100 - percent}`
                  const strokeDashoffset = -accumulatedPercent
                  accumulatedPercent += percent

                  return (
                    <circle
                      key={b.barber.id}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
                      strokeWidth="24"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all hover:opacity-80"
                    />
                  )
                })
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-extrabold text-warning">Comissões</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2 text-[10px] text-muted-foreground">
            {barbersData.map((b, idx) => (
              <span key={b.barber.id} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                />
                {b.barber.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 🧭 FILTROS: Início, Fim, Pesquisar, Botão "Adicionar lançamento para o barbeiro" (Idêntico à Imagem 4) */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Início</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-secondary/40 h-8 text-xs font-semibold w-36"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Fim</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-secondary/40 h-8 text-xs font-semibold w-36"
            />
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar barbeiro..."
              className="bg-secondary/40 h-8 text-xs pl-8 w-44"
            />
          </div>
        </div>

        {/* Botão Amarelo: Adicionar lançamento para o barbeiro */}
        <Button
          onClick={() => {
            if (barbershop.barbers.length > 0) {
              setBonusBarberId(barbershop.barbers[0].id)
            }
            setIsAddBonusOpen(true)
          }}
          className="bg-warning hover:bg-warning/90 text-warning-foreground font-bold gap-2 text-xs h-8 px-3 rounded-lg shadow-sm"
        >
          <Coins className="w-3.5 h-3.5 stroke-[2.5]" />
          Adicionar lançamento para o barbeiro
        </Button>
      </div>

      {/* 📋 TABELA POR COLABORADOR (Idêntica à Imagem 4) */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 border-b border-border/80 text-muted-foreground uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Colaborador</th>
                <th className="p-3.5">Total em Vendas</th>
                <th className="p-3.5">Comissão Serviços</th>
                <th className="p-3.5">Comissão Produtos</th>
                <th className="p-3.5">Comissão Assinatura</th>
                <th className="p-3.5">Total em Extras</th>
                <th className="p-3.5">Compras / Vales</th>
                <th className="p-3.5 text-right">Comissão Pendente</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {barbersData
                .filter((b) => b.barber.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((item) => (
                  <tr key={item.barber.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-8 h-8 rounded-full bg-warning/10 border border-warning/40 flex items-center justify-center overflow-hidden shrink-0">
                          {item.barber.imageUrl ? (
                            <Image src={item.barber.imageUrl} alt={item.barber.name} fill sizes="32px" className="object-cover" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-warning" />
                          )}
                        </div>
                        <div>
                          <strong className="text-foreground font-bold block">{item.barber.name}</strong>
                          <span className="text-[10px] text-muted-foreground">
                            {item.agendamentosCount} agendamentos • {item.rate}%
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-bold text-foreground">
                      R$ {item.vendasTotal.toFixed(2).replace(".", ",")}
                    </td>

                    <td className="p-3.5 font-bold text-foreground">
                      R$ {item.comissaoServicos.toFixed(2).replace(".", ",")}
                    </td>

                    <td className="p-3.5 font-bold text-foreground">
                      R$ {item.comissaoProdutos.toFixed(2).replace(".", ",")}
                    </td>

                    <td className="p-3.5 text-muted-foreground">
                      R$ {item.comissaoAssinatura.toFixed(2).replace(".", ",")}
                    </td>

                    <td className="p-3.5 text-muted-foreground">
                      R$ {item.totalExtras.toFixed(2).replace(".", ",")}
                    </td>

                    <td className="p-3.5 font-semibold text-destructive">
                      -R$ {item.comprasProdutosVales.toFixed(2).replace(".", ",")}
                    </td>

                    <td className="p-3.5 text-right font-extrabold text-sm text-success">
                      R$ {item.comissaoPendente.toFixed(2).replace(".", ",")}
                    </td>

                    <td className="p-3.5 text-center">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedBarberToPay(item.barber.id)
                          setPayAmount(item.comissaoPendente)
                          setIsPayCommissionOpen(true)
                        }}
                        className="bg-success/60 hover:bg-success/70 text-foreground font-bold text-[11px] h-11 md:h-7 px-3 rounded-md"
                      >
                        Pagar
                      </Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 💳 MODAL: DAR BAIXA NAS COMISSÕES */}
      <Dialog open={isPayCommissionOpen} onOpenChange={setIsPayCommissionOpen}>
        <DialogContent className="max-w-md bg-card border-border p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-success">
              <CheckCircle2 className="w-5 h-5" /> Registrar Pagamento de Comissão
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Dê baixa no saldo de comissão pendente do colaborador selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Colaborador</label>
              <select
                value={selectedBarberToPay}
                onChange={(e) => {
                  setSelectedBarberToPay(e.target.value)
                  const b = barbersData.find((item) => item.barber.id === e.target.value)
                  if (b) setPayAmount(b.comissaoPendente)
                }}
                className="w-full bg-secondary/40 text-foreground p-2 rounded-lg border border-border"
              >
                {barbershop.barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Valor a Pagar (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={payAmount || ""}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="bg-secondary/40 font-bold text-success text-base"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="ghost" size="sm" onClick={() => setIsPayCommissionOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handlePayCommission}
              disabled={isSubmittingPay || payAmount <= 0}
              className="bg-success/60 hover:bg-success/70 text-foreground font-bold text-xs"
            >
              {isSubmittingPay ? "Processando..." : "Confirmar Baixa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ➕ MODAL: ADICIONAR LANÇAMENTO / VALE / BÔNUS */}
      <Dialog open={isAddBonusOpen} onOpenChange={setIsAddBonusOpen}>
        <DialogContent className="max-w-md bg-card border-border p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-warning">
              <Coins className="w-5 h-5" /> Adicionar Lançamento para o Barbeiro
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre um adiantamento (vale) ou bonificação/comissão extra.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Colaborador</label>
              <select
                value={bonusBarberId}
                onChange={(e) => setBonusBarberId(e.target.value)}
                className="w-full bg-secondary/40 text-foreground p-2 rounded-lg border border-border"
              >
                {barbershop.barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBonusType("VALE")}
                className={`py-2 px-3 rounded-lg font-bold transition-all text-center ${
                  bonusType === "VALE"
                    ? "bg-destructive text-destructive-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                Vale / Adiantamento (-)
              </button>
              <button
                type="button"
                onClick={() => setBonusType("COMISSAO_PAGA")}
                className={`py-2 px-3 rounded-lg font-bold transition-all text-center ${
                  bonusType === "COMISSAO_PAGA"
                    ? "bg-warning text-warning-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                Bônus / Extra (+)
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={bonusAmount || ""}
                onChange={(e) => setBonusAmount(Number(e.target.value))}
                placeholder="0,00"
                className="bg-secondary/40 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Descrição / Motivo</label>
              <Input
                value={bonusDesc}
                onChange={(e) => setBonusDesc(e.target.value)}
                placeholder="Ex: Adiantamento semanal, meta batida, etc."
                className="bg-secondary/40"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button variant="ghost" size="sm" onClick={() => setIsAddBonusOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleAddBonus}
              disabled={isSubmittingBonus || bonusAmount <= 0}
              className="bg-warning hover:bg-warning/90 text-warning-foreground font-bold text-xs"
            >
              {isSubmittingBonus ? "Salvando..." : "Confirmar Lançamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
