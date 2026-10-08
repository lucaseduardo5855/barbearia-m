"use client"

import { useState, useMemo } from "react"
import { Booking, BarbershopService, Barber, User, Product, ProductSale } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import {
  FileSpreadsheet,
  PieChart as PieChartIcon,
  Scissors,
  ShoppingBag,
  Filter,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  Info
} from "lucide-react"
import { AdminPageHeader } from "./admin-page-header"

type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: User
}

interface RelatoriosProdutosServicosTabProps {
  barbershop: {
    id: string
    name: string
    services: BarbershopService[]
    barbers: Barber[]
    products?: Product[]
  }
  bookings: BookingWithDetails[]
  productSales?: ProductSale[]
}

export default function RelatoriosProdutosServicosTab({
  barbershop,
  bookings,
  productSales = []
}: RelatoriosProdutosServicosTabProps) {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"))

  // Filtros
  const [selectedBarber, setSelectedBarber] = useState("ALL")
  const [selectedType, setSelectedType] = useState("ALL") // "ALL" | "SERVICO" | "PRODUTO"
  const [selectedStatus, setSelectedStatus] = useState("ALL")
  const [sortBy, setSortBy] = useState<"VENDAS" | "VOLUME">("VENDAS")

  // Filtra dados dentro do período
  const periodData = useMemo(() => {
    const sDate = new Date(`${startDate}T00:00:00`)
    const eDate = new Date(`${endDate}T23:59:59`)

    const filteredBookings = bookings.filter((b) => {
      const bDate = new Date(b.date)
      const matchesPeriod = bDate >= sDate && bDate <= eDate
      const matchesBarber = selectedBarber === "ALL" || b.barberId === selectedBarber
      return matchesPeriod && matchesBarber
    })

    const filteredSales = productSales.filter((ps) => {
      const psDate = new Date(ps.date)
      const matchesPeriod = psDate >= sDate && psDate <= eDate
      const matchesBarber = selectedBarber === "ALL" || ps.barberId === selectedBarber
      return matchesPeriod && matchesBarber
    })

    return { filteredBookings, filteredSales }
  }, [bookings, productSales, startDate, endDate, selectedBarber])

  // Métricas do Topo
  const metrics = useMemo(() => {
    const { filteredBookings, filteredSales } = periodData

    const finalizadas = filteredBookings.filter((b) => b.status === "DONE")
    const aguardando = filteredBookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING")
    const faltantes = filteredBookings.filter((b) => b.status === "CANCELLED")

    const totalVendasServicos = finalizadas.reduce(
      (acc, b) => acc + Number(b.totalPrice || b.service.price),
      0
    )

    const totalVendasProdutos = filteredSales.reduce(
      (acc, ps) => acc + Number(ps.totalAmount),
      0
    )

    const totalVendasGeral = totalVendasServicos + totalVendasProdutos

    const valorComandasAbertas = aguardando.reduce(
      (acc, b) => acc + Number(b.totalPrice || b.service.price),
      0
    )

    return {
      totalVendasGeral,
      totalVendasServicos,
      totalVendasProdutos,
      valorComandasAbertas,
      totalComandas: filteredBookings.length,
      finalizadasCount: finalizadas.length,
      aguardandoCount: aguardando.length,
      faltantesCount: faltantes.length,
      totalVendasProdutosCount: filteredSales.length,
      descontosOferecidos: 0
    }
  }, [periodData])

  // Agrupamento por Item (Serviços e Produtos) para a Tabela e Gráfico
  const itemsBreakdown = useMemo(() => {
    const { filteredBookings, filteredSales } = periodData
    const itemsMap: Record<
      string,
      {
        id: string
        name: string
        category: string
        type: "Serviço" | "Produto"
        volume: number
        clientesDistintos: Set<string>
        finalizados: number
        pendentes: number
        totalVendas: number
      }
    > = {}

    // Processa Serviços
    if (selectedType === "ALL" || selectedType === "SERVICO") {
      filteredBookings.forEach((b) => {
        const itemKey = `serv_${b.serviceId}`
        if (!itemsMap[itemKey]) {
          itemsMap[itemKey] = {
            id: b.serviceId,
            name: b.service.name,
            category: "Serviço",
            type: "Serviço",
            volume: 0,
            clientesDistintos: new Set(),
            finalizados: 0,
            pendentes: 0,
            totalVendas: 0
          }
        }
        itemsMap[itemKey].volume += 1
        if (b.user?.id) itemsMap[itemKey].clientesDistintos.add(b.user.id)
        if (b.status === "DONE") {
          itemsMap[itemKey].finalizados += 1
          itemsMap[itemKey].totalVendas += Number(b.totalPrice || b.service.price)
        } else if (b.status === "CONFIRMED" || b.status === "PENDING") {
          itemsMap[itemKey].pendentes += 1
        }
      })
    }

    // Processa Produtos
    if (selectedType === "ALL" || selectedType === "PRODUTO") {
      filteredSales.forEach((ps) => {
        const itemKey = `prod_${ps.productId || ps.productName}`
        if (!itemsMap[itemKey]) {
          itemsMap[itemKey] = {
            id: ps.productId || ps.productName,
            name: ps.productName,
            category: "Produto",
            type: "Produto",
            volume: 0,
            clientesDistintos: new Set(),
            finalizados: 0,
            pendentes: 0,
            totalVendas: 0
          }
        }
        itemsMap[itemKey].volume += ps.quantity
        if (ps.clientName) itemsMap[itemKey].clientesDistintos.add(ps.clientName)
        itemsMap[itemKey].finalizados += ps.quantity
        itemsMap[itemKey].totalVendas += Number(ps.totalAmount)
      })
    }

    const list = Object.values(itemsMap).map((item) => ({
      ...item,
      clientesCount: Math.max(1, item.clientesDistintos.size),
      mediaUtilizacao: Number((item.volume / Math.max(1, item.clientesDistintos.size)).toFixed(1)),
      percentualFaturamento:
        metrics.totalVendasGeral > 0
          ? Number(((item.totalVendas / metrics.totalVendasGeral) * 100).toFixed(2))
          : 0
    }))

    // Ordenação
    if (sortBy === "VENDAS") {
      return list.sort((a, b) => b.totalVendas - a.totalVendas)
    } else {
      return list.sort((a, b) => b.volume - a.volume)
    }
  }, [periodData, selectedType, sortBy, metrics.totalVendasGeral])

  // Cores para o gráfico Donut
  const DONUT_COLORS = ["hsl(var(--success))", "hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--primary))", "hsl(var(--primary) / 0.75)", "hsl(var(--info) / 0.75)", "hsl(var(--destructive) / 0.85)", "hsl(var(--success) / 0.75)"]

  // Exportar Excel (CSV)
  const handleExportExcel = () => {
    let csv = "Descrição,Tipo,Volume Total,Clientes Distintos,Média por Cliente,Finalizados,Pendentes,Total em Vendas,Percentual Faturamento\n"
    itemsBreakdown.forEach((item) => {
      csv += `"${item.name}","${item.type}",${item.volume},${item.clientesCount},${item.mediaUtilizacao},${item.finalizados},${item.pendentes},"R$ ${item.totalVendas.toFixed(2)}","${item.percentualFaturamento}%"\n`
    })

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `detalhamento_vendas_${startDate}_a_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Relatório exportado em Excel/CSV com sucesso!")
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Scissors}
        title="Detalhamento de vendas"
        description="Acompanhe a saída e o faturamento consolidado de cada corte, procedimento e produto."
        actions={<>
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

          <Button
            onClick={handleExportExcel}
            className="bg-warning hover:bg-warning/85 text-warning-foreground font-bold gap-2 text-xs h-9 px-4 rounded-lg shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            Exportar em excel
          </Button>
        </>}
      />

      {/* 📊 CARDS DE MÉTRICAS SUPERIORES + GRÁFICO DONUT (Idêntico à Imagem 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Grade de 6 Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Total de vendas */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-bold text-success block">Total de vendas</span>
            <p className="text-2xl font-black text-foreground my-1">
              R$ {metrics.totalVendasGeral.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[10px] text-muted-foreground">Valor total de vendas - descontos oferecidos</p>
          </div>

          {/* Card 2: Serviços */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-bold text-success block">Vendas Serviços</span>
            <p className="text-2xl font-black text-foreground my-1">
              R$ {metrics.totalVendasServicos.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[10px] text-muted-foreground">{metrics.finalizadasCount} serviços concluídos</p>
          </div>

          {/* Card 3: Comandas no total */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-bold text-muted-foreground block">Comandas no total</span>
            <p className="text-2xl font-black text-foreground my-1">{metrics.totalComandas}</p>
            <div className="space-y-0.5 text-[9px] text-muted-foreground">
              <p className="text-warning font-semibold">• {metrics.aguardandoCount} comandas Aguardando</p>
              <p className="text-success font-semibold">• {metrics.finalizadasCount} comandas Finalizadas</p>
              <p className="text-destructive font-semibold">• {metrics.faltantesCount} canceladas / faltantes</p>
            </div>
          </div>

          {/* Card 4: Valor das Comandas abertas */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-bold text-warning block">Comandas abertas</span>
            <p className="text-2xl font-black text-warning my-1">
              R$ {metrics.valorComandasAbertas.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[10px] text-muted-foreground">Aguardando atendimento</p>
          </div>

          {/* Card 5: Descontos oferecidos */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-bold text-success block">Descontos oferecidos</span>
            <p className="text-2xl font-black text-foreground my-1">
              R$ {metrics.descontosOferecidos.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[10px] text-muted-foreground">Como cortesias ou bonificações</p>
          </div>

          {/* Card 6: Vendas de produtos */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="text-xs font-bold text-success block">Vendas de produtos</span>
            <p className="text-2xl font-black text-success my-1">
              R$ {metrics.totalVendasProdutos.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-[10px] text-muted-foreground">{metrics.totalVendasProdutosCount} produtos vendidos</p>
          </div>
        </div>

        {/* Gráfico Donut/Pizza: Detalhamento de Vendas */}
        <div className="flex flex-col items-center justify-between rounded-xl border border-border bg-card p-5 text-center">
          <div className="w-full text-left mb-2">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <PieChartIcon className="w-4 h-4 text-warning" /> Detalhamento de vendas
            </h3>
            <p className="text-[10px] text-muted-foreground">Distribuição percentual da receita</p>
          </div>

          {/* SVG Pie / Donut */}
          <div className="relative w-44 h-44 my-2">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                let accumulatedPercent = 0
                return itemsBreakdown.slice(0, 6).map((item, idx) => {
                  const percent = item.percentualFaturamento || 10
                  const strokeDasharray = `${percent} ${100 - percent}`
                  const strokeDashoffset = -accumulatedPercent
                  accumulatedPercent += percent
                  return (
                    <circle
                      key={item.id}
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
              <span className="text-xs font-extrabold text-success">100%</span>
              <span className="text-[9px] text-muted-foreground">Vendas</span>
            </div>
          </div>

          {/* Legenda rápida */}
          <div className="flex flex-wrap justify-center gap-2 pt-2 text-[10px] text-muted-foreground">
            {itemsBreakdown.slice(0, 4).map((item, idx) => (
              <span key={item.id} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                />
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ℹ️ Banner informativo (como na Imagem 3) */}
      <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-xs text-warning flex items-center gap-2">
        <Info className="w-4 h-4 shrink-0" />
        <span>
          Este relatório está exibindo o resultado de serviços e produtos de todos os barbeiros e todas as vendas independente do status (finalizadas ou não).
        </span>
      </div>

      {/* 🔍 FILTROS DA TABELA: Barbeiro, Tipo, Status, Ordenar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-card border border-border/80 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Barbeiro:</span>
          <select
            value={selectedBarber}
            onChange={(e) => setSelectedBarber(e.target.value)}
            className="bg-secondary/40 text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border"
          >
            <option value="ALL">Todos</option>
            {barbershop.barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Tipo:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-secondary/40 text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border"
          >
            <option value="ALL">Todos</option>
            <option value="SERVICO">Serviços</option>
            <option value="PRODUTO">Produtos</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-secondary/40 text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border"
          >
            <option value="VENDAS">Total em vendas</option>
            <option value="VOLUME">Volume vendido</option>
          </select>
        </div>
      </div>

      {/* 📋 TABELA COMPLETA (Idêntica à Imagem 3) */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 border-b border-border/80 text-muted-foreground uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Descrição</th>
                <th className="p-3.5">Volume</th>
                <th className="p-3.5">Média</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Total em Vendas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {itemsBreakdown.length > 0 ? (
                itemsBreakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                        />
                        <div>
                          <strong className="text-foreground font-bold block">{item.name}</strong>
                          <span className="text-[10px] text-muted-foreground">Categoria: {item.category}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-foreground">Volume total: {item.volume}</p>
                      <p className="text-[10px] text-muted-foreground">Clientes distintos: {item.clientesCount}</p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-foreground">{item.mediaUtilizacao} utilizações</p>
                      <p className="text-[10px] text-muted-foreground">por cliente no período</p>
                    </td>

                    <td className="p-3.5">
                      <p className="text-success font-medium">Finalizados: {item.finalizados}</p>
                      <p className="text-warning text-[10px]">Pendentes: {item.pendentes}</p>
                    </td>

                    <td className="p-3.5 text-right">
                      <strong className="text-sm font-bold text-foreground block">
                        R$ {item.totalVendas.toFixed(2).replace(".", ",")}
                      </strong>
                      <span className="text-[10px] text-success font-medium">
                        {item.percentualFaturamento}% do faturamento
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground italic">
                    Nenhum item com vendas no período selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
