"use client"

import { formatBRL } from "@/lib/formatters"

import { useState, useMemo } from "react"
import {
  Booking,
  BarbershopService,
  Barber,
  User,
  Product,
  ProductSale,
} from "@prisma/client"
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
  Info,
} from "lucide-react"
import { AdminPageHeader } from "./admin-page-header"
import { bookingAmounts } from "@/lib/financial-summary"
import { salesBreakdown } from "@/lib/sales-breakdown"

import type { BookingWithDetails } from "@/lib/booking-types"

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
  productSales = [],
}: RelatoriosProdutosServicosTabProps) {
  const [startDate, setStartDate] = useState(
    format(startOfMonth(new Date()), "yyyy-MM-dd"),
  )
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd"),
  )

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
      const matchesBarber =
        selectedBarber === "ALL" || b.barberId === selectedBarber
      return matchesPeriod && matchesBarber
    })

    const filteredSales = productSales.filter((ps) => {
      const psDate = new Date(ps.date)
      const matchesPeriod = psDate >= sDate && psDate <= eDate
      const matchesBarber =
        selectedBarber === "ALL" || ps.barberId === selectedBarber
      return matchesPeriod && matchesBarber
    })

    return { filteredBookings, filteredSales }
  }, [bookings, productSales, startDate, endDate, selectedBarber])

  // Métricas do Topo
  const metrics = useMemo(() => {
    const { filteredBookings, filteredSales } = periodData

    const finalizadas = filteredBookings.filter((b) => b.status === "DONE")
    const aguardando = filteredBookings.filter(
      (b) => b.status === "CONFIRMED" || b.status === "PENDING",
    )
    const faltantes = filteredBookings.filter((b) => b.status === "CANCELLED")

    const totalVendasServicos = finalizadas.reduce(
      (acc, b) => acc + bookingAmounts(b).services,
      0,
    )

    const totalVendasProdutos =
      finalizadas.reduce((acc, b) => acc + bookingAmounts(b).products, 0) +
      filteredSales
        .filter((sale) => !sale.bookingId)
        .reduce((acc, ps) => acc + Number(ps.totalAmount), 0)

    const totalVendasGeral = totalVendasServicos + totalVendasProdutos

    const valorComandasAbertas = aguardando.reduce(
      (acc, b) => acc + Number(b.totalPrice || b.service.price),
      0,
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
      totalVendasProdutosCount:
        finalizadas.reduce(
          (sum, b) =>
            sum +
            bookingAmounts(b).extraProducts.reduce(
              (count, item) => count + (item.quantity ?? 1),
              0,
            ),
          0,
        ) +
        filteredSales
          .filter((sale) => !sale.bookingId)
          .reduce((sum, sale) => sum + sale.quantity, 0),
      ticketMedio: finalizadas.length
        ? finalizadas.reduce((sum, b) => sum + bookingAmounts(b).total, 0) /
          finalizadas.length
        : 0,
    }
  }, [periodData])

  // Agrupamento por Item (Serviços e Produtos) para a Tabela e Gráfico
  const itemsBreakdown = useMemo(() => {
    const { filteredBookings, filteredSales } = periodData
    const rows = salesBreakdown(filteredBookings, filteredSales).filter(
      (item) =>
        selectedType === "ALL" ||
        item.type === (selectedType === "SERVICO" ? "Serviço" : "Produto"),
    )
    const list = rows.map((item) => ({
      ...item,
      clientesCount: Math.max(1, item.clientesDistintos.size),
      mediaUtilizacao: Number(
        (item.volume / Math.max(1, item.clientesDistintos.size)).toFixed(1),
      ),
      percentualFaturamento:
        metrics.totalVendasGeral > 0
          ? Number(
              ((item.totalVendas / metrics.totalVendasGeral) * 100).toFixed(2),
            )
          : 0,
    }))

    // Ordenação
    if (sortBy === "VENDAS") {
      return list.sort((a, b) => b.totalVendas - a.totalVendas)
    } else {
      return list.sort((a, b) => b.volume - a.volume)
    }
  }, [periodData, selectedType, sortBy, metrics.totalVendasGeral])

  // Cores para o gráfico Donut
  const DONUT_COLORS = [
    "hsl(var(--success))",
    "hsl(var(--info))",
    "hsl(var(--warning))",
    "hsl(var(--primary))",
    "hsl(var(--primary) / 0.75)",
    "hsl(var(--info) / 0.75)",
    "hsl(var(--destructive) / 0.85)",
    "hsl(var(--success) / 0.75)",
  ]

  // Exportar Excel (CSV)
  const handleExportExcel = () => {
    let csv =
      "Descrição,Tipo,Volume Total,Clientes Distintos,Média por Cliente,Finalizados,Pendentes,Total em Vendas,Percentual Faturamento\n"
    itemsBreakdown.forEach((item) => {
      csv += `"${item.name}","${item.type}",${item.volume},${item.clientesCount},${item.mediaUtilizacao},${item.finalizados},${item.pendentes},"R$ ${item.totalVendas.toFixed(2)}","${item.percentualFaturamento}%"\n`
    })

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute(
      "download",
      `detalhamento_vendas_${startDate}_a_${endDate}.csv`,
    )
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
        actions={
          <>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Início</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 w-36 bg-secondary/40 text-xs font-semibold"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Fim</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 w-36 bg-secondary/40 text-xs font-semibold"
              />
            </div>

            <Button
              onClick={handleExportExcel}
              className="h-9 gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <FileSpreadsheet className="h-4 w-4 stroke-[1.75]" />
              Exportar CSV
            </Button>
          </>
        }
      />

      {/* 📊 CARDS DE MÉTRICAS SUPERIORES + GRÁFICO DONUT (Idêntico à Imagem 3) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Grade de 6 Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
          {/* Card 1: Total de vendas */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="block text-xs font-bold text-foreground">
              Total de vendas
            </span>
            <p className="my-1 text-2xl font-medium text-foreground">
              {formatBRL(metrics.totalVendasGeral)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Valor total de vendas - descontos oferecidos
            </p>
          </div>

          {/* Card 2: Serviços */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="block text-xs font-bold text-foreground">
              Vendas Serviços
            </span>
            <p className="my-1 text-2xl font-medium text-foreground">
              {formatBRL(metrics.totalVendasServicos)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {metrics.finalizadasCount} serviços concluídos
            </p>
          </div>

          {/* Card 3: Comandas no total */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="block text-xs font-bold text-muted-foreground">
              Comandas no total
            </span>
            <p className="my-1 text-2xl font-medium text-foreground">
              {metrics.totalComandas}
            </p>
            <div className="space-y-0.5 text-[9px] text-muted-foreground">
              <p className="font-semibold text-warning">
                • {metrics.aguardandoCount} comandas Aguardando
              </p>
              <p className="font-semibold text-foreground">
                • {metrics.finalizadasCount} comandas Finalizadas
              </p>
              <p className="font-semibold text-destructive">
                • {metrics.faltantesCount} canceladas / faltantes
              </p>
            </div>
          </div>

          {/* Card 4: Valor das Comandas abertas */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="block text-xs font-bold text-warning">
              Comandas abertas
            </span>
            <p className="my-1 text-2xl font-medium text-warning">
              {formatBRL(metrics.valorComandasAbertas)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Aguardando atendimento
            </p>
          </div>

          {/* Card 5: Ticket médio */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="block text-xs font-bold text-foreground">
              Ticket médio
            </span>
            <p className="my-1 text-2xl font-medium text-foreground">
              {formatBRL(metrics.ticketMedio)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Vendas realizadas por atendimento concluído
            </p>
          </div>

          {/* Card 6: Vendas de produtos */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4">
            <span className="block text-xs font-bold text-foreground">
              Vendas de produtos
            </span>
            <p className="my-1 text-2xl font-medium text-foreground">
              {formatBRL(metrics.totalVendasProdutos)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {metrics.totalVendasProdutosCount} produtos vendidos
            </p>
          </div>
        </div>

        {/* Gráfico Donut/Pizza: Detalhamento de Vendas */}
        <div className="flex flex-col items-center justify-between rounded-xl border border-border bg-card p-5 text-center">
          <div className="mb-2 w-full text-left">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <PieChartIcon className="h-4 w-4 text-warning" /> Detalhamento de
              vendas
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Distribuição percentual da receita
            </p>
          </div>

          {/* SVG Pie / Donut */}
          <div className="relative my-2 h-44 w-44">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              {(() => {
                let accumulatedPercent = 0
                return itemsBreakdown.slice(0, 6).map((item, idx) => {
                  const percent = item.percentualFaturamento
                  const strokeDasharray = `${percent} ${100 - percent}`
                  const strokeDashoffset = -accumulatedPercent
                  accumulatedPercent += percent
                  return (
                    <circle
                      key={item.id}
                      cx="50"
                      cy="50"
                      r="38"
                      pathLength="100"
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
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-medium text-foreground">
                {metrics.totalVendasGeral > 0 ? "Vendas" : "Sem vendas"}
              </span>
              <span className="text-[9px] text-muted-foreground">Vendas</span>
            </div>
          </div>

          {/* Legenda rápida */}
          <div className="flex flex-wrap justify-center gap-2 pt-2 text-[10px] text-muted-foreground">
            {itemsBreakdown.slice(0, 4).map((item, idx) => (
              <span key={item.id} className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length],
                  }}
                />
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ℹ️ Banner informativo (como na Imagem 3) */}
      <div className="flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
        <Info className="h-4 w-4 shrink-0" />
        <span>
          O faturamento considera apenas vendas concluídas. Os volumes também
          mostram atendimentos ainda em aberto, conforme os filtros
          selecionados.
        </span>
      </div>

      {/* 🔍 FILTROS DA TABELA: Barbeiro, Tipo, Status, Ordenar */}
      <div className="shadow-xs flex flex-wrap items-center gap-3 rounded-xl border border-border/80 bg-card p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Barbeiro:</span>
          <select
            value={selectedBarber}
            onChange={(e) => setSelectedBarber(e.target.value)}
            className="rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-semibold text-foreground"
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
            className="rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-semibold text-foreground"
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
            className="rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-semibold text-foreground"
          >
            <option value="VENDAS">Total em vendas</option>
            <option value="VOLUME">Volume vendido</option>
          </select>
        </div>
      </div>

      {/* 📋 TABELA COMPLETA (Idêntica à Imagem 3) */}
      <div className="shadow-xs overflow-hidden rounded-xl border border-border/80 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/80 bg-secondary/40 text-[10px] font-bold uppercase text-muted-foreground">
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
                  <tr
                    key={idx}
                    className="transition-colors hover:bg-secondary/20"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              DONUT_COLORS[idx % DONUT_COLORS.length],
                          }}
                        />
                        <div>
                          <strong className="block font-bold text-foreground">
                            {item.name}
                          </strong>
                          <span className="text-[10px] text-muted-foreground">
                            Categoria: {item.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-foreground">
                        Volume total: {item.volume}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Clientes distintos: {item.clientesCount}
                      </p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-semibold text-foreground">
                        {item.mediaUtilizacao} utilizações
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        por cliente no período
                      </p>
                    </td>

                    <td className="p-3.5">
                      <p className="font-medium text-foreground">
                        Finalizados: {item.finalizados}
                      </p>
                      <p className="text-[10px] text-warning">
                        Pendentes: {item.pendentes}
                      </p>
                    </td>

                    <td className="p-3.5 text-right">
                      <strong className="block text-sm font-bold text-foreground">
                        {formatBRL(item.totalVendas)}
                      </strong>
                      <span className="text-[10px] font-medium text-foreground">
                        {item.percentualFaturamento}% do faturamento
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center italic text-muted-foreground"
                  >
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
