"use client"
import { MoneyInput } from "@/components/ui/money-input"

import { useState, useMemo } from "react"
import type {
  Booking,
  BarbershopService,
  Barber,
  User,
  ProductSale,
  FinancialTransaction,
  SubscriptionPayment,
} from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/app/_components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  addMonths,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import {
  DollarSign,
  TrendingUp,
  PlusCircle,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Users,
  Receipt,
} from "lucide-react"
import { createFinancialTransactionAction } from "@/app/_actions/admin-actions"
import { summarizeFinance } from "@/lib/financial-summary"
import { formatBRL } from "@/lib/formatters"
import { AdminPageHeader } from "./admin-page-header"
import { AdminMetricCard } from "./admin-metric-card"

import type { BookingWithDetails } from "@/lib/booking-types"
interface FinanceiroTabProps {
  barbershopId: string
  barbershopName?: string
  bookings: BookingWithDetails[]
  productSales?: ProductSale[]
  transactions?: FinancialTransaction[]
  subscriptionPayments?: SubscriptionPayment[]
  subscriptionActive?: boolean
  trialEndsAt?: Date | string | null
}

export default function FinanceiroTab({
  barbershopId,
  barbershopName,
  bookings,
  productSales = [],
  transactions = [],
  subscriptionPayments = [],
  subscriptionActive = true,
  trialEndsAt,
}: FinanceiroTabProps) {
  const [subTab, setSubTab] = useState<"dashboard" | "assinaturas">("dashboard")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isNewTxOpen, setIsNewTxOpen] = useState(false)
  const [txType, setTxType] = useState<"RECEITA" | "DESPESA">("DESPESA")
  const [txCategory, setTxCategory] = useState("Lançamento Manual")
  const [txDescription, setTxDescription] = useState("")
  const [txAmount, setTxAmount] = useState(0)
  const [txDate, setTxDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [isSubmittingTx, setIsSubmittingTx] = useState(false)
  const [entryPage, setEntryPage] = useState(1)
  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate])
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate])
  const summary = useMemo(
    () =>
      summarizeFinance(
        bookings,
        productSales,
        transactions,
        monthStart,
        monthEnd,
      ),
    [bookings, productSales, transactions, monthStart, monthEnd],
  )
  const days = useMemo(
    () =>
      eachDayOfInterval({ start: monthStart, end: monthEnd }).map((day) => ({
        day,
        value: summarizeFinance(
          bookings,
          productSales,
          transactions,
          startOfDay(day),
          endOfDay(day),
        ).revenue,
      })),
    [bookings, productSales, transactions, monthStart, monthEnd],
  )
  const maxRevenue = Math.max(...days.map((day) => day.value), 1)
  const entries = useMemo(
    () =>
      [
        ...summary.completed.map((b) => ({
          id: b.id,
          date: b.date,
          name: b.user.name || "Cliente",
          category: "Atendimento concluído",
          amount: Number(b.totalPrice ?? b.service.price),
          income: true,
        })),
        ...summary.standalone.map((s) => ({
          id: s.id,
          date: s.date,
          name: s.productName,
          category: "Venda avulsa de produto",
          amount: Number(s.totalAmount),
          income: true,
        })),
        ...summary.entries.map((t) => ({
          id: t.id,
          date: t.date,
          name: t.description,
          category: t.category,
          amount: Number(t.amount),
          income: t.type === "RECEITA",
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [summary],
  )
  const pageCount = Math.max(1, Math.ceil(entries.length / 10))
  const currentPage = Math.min(entryPage, pageCount)
  const pageEntries = entries.slice((currentPage - 1) * 10, currentPage * 10)
  const changeMonth = (offset: number) => {
    setCurrentDate((date) => addMonths(date, offset))
    setEntryPage(1)
  }

  const handleCreateTransaction = async () => {
    if (
      !txDescription.trim() ||
      !Number.isFinite(txAmount) ||
      txAmount <= 0 ||
      !txDate
    ) {
      toast.error("Informe a descrição, uma data e um valor maior que zero.")
      return
    }
    setIsSubmittingTx(true)
    try {
      await createFinancialTransactionAction({
        barbershopId,
        type: txType,
        category: txCategory,
        description: txDescription.trim(),
        amount: txAmount,
        date: new Date(txDate + "T12:00:00"),
      })
      setCurrentDate(new Date(txDate + "T12:00:00"))
      setEntryPage(1)
      setIsNewTxOpen(false)
      setTxDescription("")
      setTxAmount(0)
      toast.success("Lançamento registrado.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o lançamento.",
      )
    } finally {
      setIsSubmittingTx(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Wallet}
        title="Financeiro"
        description={`Entradas, saídas e atendimentos ${barbershopName ? "da " + barbershopName : "da sua barbearia"}.`}
        actions={
          <>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mês anterior"
                onClick={() => changeMonth(-1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-28 text-center text-sm capitalize">
                {format(currentDate, "MMM yyyy", { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Próximo mês"
                onClick={() => changeMonth(1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button
              variant={subTab === "dashboard" ? "secondary" : "ghost"}
              onClick={() => setSubTab("dashboard")}
            >
              Financeiro
            </Button>
            <Button
              variant={subTab === "assinaturas" ? "secondary" : "ghost"}
              onClick={() => setSubTab("assinaturas")}
            >
              Meu plano
            </Button>
            <Button onClick={() => setIsNewTxOpen(true)} className="gap-2">
              <PlusCircle className="size-4" /> Novo lançamento
            </Button>
          </>
        }
      />
      {subTab === "dashboard" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
              icon={ArrowUpRight}
              label="Entradas realizadas"
              value={formatBRL(summary.revenue)}
              description="Atendimentos concluídos, produtos e receitas manuais."
            />
            <AdminMetricCard
              icon={ArrowDownRight}
              label="Saídas registradas"
              value={formatBRL(summary.outflows)}
              description="Despesas, comissões pagas e vales."
            />
            <AdminMetricCard
              icon={Wallet}
              label="Saldo do período"
              value={formatBRL(summary.balance)}
              description="Entradas menos saídas registradas. Não representa lucro."
            />
            <AdminMetricCard
              icon={TrendingUp}
              label="Comandas em aberto"
              value={formatBRL(summary.openRevenue)}
              description={`${summary.open.length} atendimento(s) aguardando conclusão.`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard
              icon={CheckCircle2}
              label="Atendimentos concluídos"
              value={String(summary.completed.length)}
              description={`Ticket médio: ${formatBRL(summary.completed.length ? summary.completed.reduce((sum, booking) => sum + Number(booking.totalPrice ?? booking.service.price), 0) / summary.completed.length : 0)}.`}
            />
            <AdminMetricCard
              icon={Users}
              label="Clientes atendidos"
              value={String(
                new Set(summary.completed.map((booking) => booking.userId))
                  .size,
              )}
              description="Clientes distintos com atendimento concluído no período."
            />
            <AdminMetricCard
              icon={Receipt}
              label="Comissões pagas"
              value={formatBRL(summary.paidCommissions)}
              description={`Adiantamentos e vales: ${formatBRL(summary.advances)}.`}
            />
            <AdminMetricCard
              icon={TrendingUp}
              label="Receita prevista"
              value={formatBRL(summary.projectedRevenue)}
              description="Entradas realizadas mais comandas abertas. Não é dinheiro recebido."
            />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
            <section className="min-w-0 rounded-xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg">Entradas por dia</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Movimento realizado no mês selecionado.
                  </p>
                </div>
                <span className="text-sm capitalize text-muted-foreground">
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="mt-6 flex gap-3">
                <div className="flex h-60 shrink-0 flex-col justify-between pb-6 text-xs tabular-nums text-muted-foreground">
                  <span>{formatBRL(maxRevenue === 1 ? 0 : maxRevenue)}</span>
                  <span>
                    {formatBRL(maxRevenue === 1 ? 0 : maxRevenue / 2)}
                  </span>
                  <span>R$ 0</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className="relative flex h-60 items-end gap-1 border-b border-border pb-6"
                    role="img"
                    aria-label="Gráfico de entradas diárias"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border" />
                    <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
                    {days.map(({ day, value }) => (
                      <div
                        key={day.toISOString()}
                        className="group relative flex h-full min-w-0 flex-1 items-end"
                        title={format(day, "dd/MM") + ": " + formatBRL(value)}
                      >
                        <div
                          className="w-full rounded-t-sm bg-primary/70 transition-colors group-hover:bg-primary"
                          style={{
                            height: value
                              ? Math.max(2, (value / maxRevenue) * 100) + "%"
                              : "0",
                          }}
                        />
                        {[1, 8, 15, 22, monthEnd.getDate()].includes(
                          day.getDate(),
                        ) && (
                          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
                            {format(day, "dd")}
                          </span>
                        )}
                      </div>
                    ))}
                    {summary.revenue === 0 && (
                      <p className="absolute inset-0 flex items-center justify-center pb-6 text-sm text-muted-foreground">
                        Sem entradas neste mês
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-2 rounded-sm bg-primary" /> Atendimentos,
                produtos e receitas manuais
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-lg">De onde vem o movimento</h2>
              <dl className="mt-5 divide-y divide-border text-sm">
                {[
                  ["Serviços concluídos", summary.serviceRevenue],
                  ["Produtos vendidos", summary.productRevenue],
                  ["Receitas manuais", summary.manualRevenue],
                  ["Despesas", -summary.expenses],
                  ["Comissões pagas", -summary.paidCommissions],
                  ["Vales", -summary.advances],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="tabular-nums text-foreground">
                      {formatBRL(value)}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex justify-between gap-3 text-sm">
                  <span>Comissões a repassar</span>
                  <span className="tabular-nums">
                    {formatBRL(summary.pendingCommissions)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Já desconta os repasses e vales registrados. Ainda não é uma
                  saída do caixa.
                </p>
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <h2 className="text-lg">Movimentações do período</h2>
              <span className="text-sm text-muted-foreground">
                {entries.length} registro(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Descrição</th>
                    <th className="px-5 py-3">Categoria</th>
                    <th className="px-5 py-3">Data</th>
                    <th className="px-5 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/30">
                      <td className="px-5 py-4">{entry.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {entry.category}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {format(new Date(entry.date), "dd/MM/yyyy")}
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        {entry.income ? "+" : "−"} {formatBRL(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!entries.length && (
              <p className="p-10 text-center text-sm text-muted-foreground">
                Nenhuma movimentação neste mês.
              </p>
            )}
            {entries.length > 10 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {pageCount}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setEntryPage(currentPage - 1)}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    disabled={currentPage === pageCount}
                    onClick={() => setEntryPage(currentPage + 1)}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </section>
          <p className="text-sm leading-6 text-muted-foreground">
            Os valores seguem a data do atendimento e dos lançamentos. Comandas
            abertas não entram no saldo. Este resumo não desconta taxas de
            pagamento nem custos que não tenham sido registrados.
          </p>
        </>
      )}
      {subTab === "assinaturas" && (
        <div className="animate-in fade-in space-y-5 duration-200">
          <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-6 shadow-md">
            <div className="flex flex-col justify-between gap-4 border-b border-border/40 pb-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">
                    Status do Plano SaaS
                  </h3>
                  {subscriptionActive ? (
                    <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/20 px-2.5 py-1 text-xs font-bold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Assinatura Ativa
                    </span>
                  ) : trialEndsAt && new Date() < new Date(trialEndsAt) ? (
                    <span className="flex items-center gap-1 rounded-full border border-info/30 bg-info/20 px-2.5 py-1 text-xs font-bold text-info">
                      <Sparkles className="h-3.5 w-3.5" /> Período de Testes
                      (Trial)
                    </span>
                  ) : (
                    <span className="rounded-full bg-destructive/20 px-2.5 py-1 text-xs font-bold text-destructive">
                      Pendente de Pagamento
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Comprovantes e registros de renovação da mensalidade da
                  barbearia processados via Pix Mercado Pago.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-secondary/30 p-2.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span>Checkout Transparente Seguro</span>
              </div>
            </div>

            {/* Listagem de Comprovantes */}
            {subscriptionPayments.length > 0 ? (
              <div className="space-y-3">
                {subscriptionPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col justify-between gap-4 rounded-xl border border-border/60 bg-secondary/15 p-4 transition-colors hover:border-success/40 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-success/10 p-2.5 text-success">
                        <QrCode className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-bold text-foreground">
                            Mensalidade SaaS
                          </strong>
                          <span className="rounded-md bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                            {p.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(
                            new Date(p.paidAt),
                            "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                            { locale: ptBR },
                          )}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          ID Transação: #{p.mercadopagoPaymentId} • Método:{" "}
                          {p.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border/40 pt-2 text-left sm:border-t-0 sm:pt-0 sm:text-right">
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                        Valor
                      </span>
                      <strong className="text-lg font-extrabold text-success">
                        {formatBRL(p.amount)}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border py-10 text-center">
                <QrCode className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                <p className="text-sm font-semibold text-muted-foreground">
                  Nenhum pagamento registrado ainda
                </p>
                <p className="text-xs text-muted-foreground">
                  Se você está no período de testes gratuitos, os comprovantes
                  de mensalidade paga aparecerão aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={isNewTxOpen} onOpenChange={setIsNewTxOpen}>
        <DialogContent className="max-w-md border-border bg-card p-6 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-success">
              <PlusCircle className="h-5 w-5" /> Novo Lançamento Financeiro
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre despesas operacionais ou receitas avulsas para manter o
              fluxo de caixa atualizado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTxType("DESPESA")}
                className={`rounded-lg px-3 py-2 text-center font-bold transition-all ${
                  txType === "DESPESA"
                    ? "bg-destructive text-destructive-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                Despesa (Saída)
              </button>
              <button
                type="button"
                onClick={() => setTxType("RECEITA")}
                className={`rounded-lg px-3 py-2 text-center font-bold transition-all ${
                  txType === "RECEITA"
                    ? "bg-success/60 text-foreground shadow-sm"
                    : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                }`}
              >
                Receita (Entrada)
              </button>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Categoria
              </label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/40 p-2 text-foreground"
              >
                <option value="Lançamento Manual">Lançamento Manual</option>
                <option value="Aluguel & Contas">Aluguel & Contas</option>
                <option value="Produtos & Estoque">Produtos & Estoque</option>
                <option value="Manutenção & Equipamentos">
                  Manutenção & Equipamentos
                </option>
                <option value="Marketing & Anúncios">
                  Marketing & Anúncios
                </option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Descrição
              </label>
              <Input
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="Ex: Compra de café, lâminas ou conta de luz"
                className="bg-secondary/40"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="transaction-date">Data do lançamento</label>
              <Input
                id="transaction-date"
                type="date"
                value={txDate}
                onChange={(event) => setTxDate(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">
                Valor (R$)
              </label>
              <MoneyInput
                value={txAmount}
                onValueChange={setTxAmount}
                placeholder="0,00"
                className="bg-secondary/40 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border/50 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsNewTxOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateTransaction}
              disabled={
                isSubmittingTx || !txDescription.trim() || txAmount <= 0
              }
              className="text-sm font-medium"
            >
              {isSubmittingTx ? "Salvando..." : "Registrar Lançamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
