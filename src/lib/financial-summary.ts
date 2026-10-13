import { isWithinInterval } from "date-fns"

type Money = number | string | { toString(): string } | null | undefined
export type StoredItem = {
  id: string
  name: string
  price: number
  quantity?: number
}
export type FinancialBooking = {
  id: string
  date: Date | string
  status: string
  totalPrice: Money
  extraServices: string | null
  extraProducts: string | null
  barberCommissionAmount: Money
  barberId: string | null
  service: { id?: string; name?: string; price: Money }
  barber?: { commissionRate: Money } | null
}
type Sale = {
  bookingId: string | null
  date: Date | string
  totalAmount: Money
  commissionAmount: Money
}
type Transaction = { date: Date | string; amount: Money; type: string }

export function parseStoredItems(value: string | null): StoredItem[] {
  if (!value) return []
  try {
    const items: unknown = JSON.parse(value)
    if (!Array.isArray(items)) return []
    return items
      .filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          Number.isFinite(Number(item.price)),
      )
      .map((item) => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity ?? 1),
      }))
  } catch {
    return []
  }
}

export function bookingAmounts(booking: FinancialBooking) {
  const extraServices = parseStoredItems(booking.extraServices)
  const extraProducts = parseStoredItems(booking.extraProducts)
  const products = extraProducts.reduce(
    (sum, item) => sum + item.price * (item.quantity ?? 1),
    0,
  )
  const serviceItems =
    Number(booking.service.price) +
    extraServices.reduce((sum, item) => sum + item.price, 0)
  const total = Number(booking.totalPrice ?? serviceItems + products)
  // Stored total is authoritative; products are split out of it, never counted twice.
  return {
    total,
    services: Math.max(0, total - products),
    products,
    extraServices,
    extraProducts,
  }
}

export function summarizeFinance<
  B extends FinancialBooking,
  S extends Sale,
  T extends Transaction,
>(bookings: B[], sales: S[], transactions: T[], start: Date, end: Date) {
  const inPeriod = (date: Date | string) =>
    isWithinInterval(new Date(date), { start, end })
  const completed = bookings.filter(
    (b) => b.status === "DONE" && inPeriod(b.date),
  )
  const open = bookings.filter(
    (b) => ["PENDING", "CONFIRMED"].includes(b.status) && inPeriod(b.date),
  )
  // A linked sale is already included in its booking's total.
  const standalone = sales.filter(
    (sale) => !sale.bookingId && inPeriod(sale.date),
  )
  const entries = transactions.filter((tx) => inPeriod(tx.date))
  const sumTx = (type: string) =>
    entries
      .filter((tx) => tx.type === type)
      .reduce((sum, tx) => sum + Number(tx.amount), 0)
  const serviceRevenue = completed.reduce(
    (sum, b) => sum + bookingAmounts(b).services,
    0,
  )
  const productRevenue =
    completed.reduce((sum, b) => sum + bookingAmounts(b).products, 0) +
    standalone.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
  const manualRevenue = sumTx("RECEITA")
  const paidCommissions = sumTx("COMISSAO_PAGA")
  const advances = sumTx("VALE")
  const expenses = sumTx("DESPESA")
  const revenue = serviceRevenue + productRevenue + manualRevenue
  const outflows = expenses + paidCommissions + advances
  const earnedCommissions =
    completed.reduce(
      (sum, b) =>
        sum +
        (b.barberId
          ? Number(
              b.barberCommissionAmount ??
                (b.barberId
                  ? (bookingAmounts(b).total *
                      Number(b.barber?.commissionRate ?? 0)) /
                    100
                  : 0),
            )
          : 0),
      0,
    ) + standalone.reduce((sum, sale) => sum + Number(sale.commissionAmount), 0)
  const pendingCommissions = Math.max(
    0,
    earnedCommissions - paidCommissions - advances,
  )
  const openRevenue = open.reduce((sum, b) => sum + bookingAmounts(b).total, 0)
  return {
    completed,
    open,
    entries,
    standalone,
    serviceRevenue,
    productRevenue,
    manualRevenue,
    paidCommissions,
    advances,
    expenses,
    revenue,
    outflows,
    balance: revenue - outflows,
    pendingCommissions,
    openRevenue,
    projectedRevenue: revenue + openRevenue,
    salesRevenue: serviceRevenue + productRevenue,
  }
}
