import { bookingAmounts, type FinancialBooking } from "./financial-summary"

type ReportBooking = FinancialBooking & {
  serviceId: string
  user: { id: string }
}
type ReportSale = {
  productId: string | null
  productName: string
  bookingId: string | null
  clientName: string | null
  quantity: number
  totalAmount: { toString(): string } | number | string
}
export function salesBreakdown(bookings: ReportBooking[], sales: ReportSale[]) {
  const items = new Map<
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
  >()
  const add = (
    id: string,
    name: string,
    type: "Serviço" | "Produto",
    quantity: number,
    price: number,
    done: boolean,
    client: string,
  ) => {
    const key = type + id
    const item = items.get(key) ?? {
      id,
      name,
      type,
      category: type,
      volume: 0,
      clientesDistintos: new Set<string>(),
      finalizados: 0,
      pendentes: 0,
      totalVendas: 0,
    }
    item.volume += quantity
    item.clientesDistintos.add(client)
    if (done) {
      item.finalizados += quantity
      item.totalVendas += price
    } else item.pendentes += quantity
    items.set(key, item)
  }
  bookings
    .filter((b) => b.status !== "CANCELLED")
    .forEach((b) => {
      const amounts = bookingAmounts(b)
      const done = b.status === "DONE"
      const extras = amounts.extraServices.reduce(
        (sum, item) => sum + item.price,
        0,
      )
      add(
        b.serviceId,
        b.service.name || "Serviço",
        "Serviço",
        1,
        Math.max(0, amounts.services - extras),
        done,
        b.user.id,
      )
      amounts.extraServices.forEach((item) =>
        add(item.id, item.name, "Serviço", 1, item.price, done, b.user.id),
      )
      amounts.extraProducts.forEach((item) =>
        add(
          item.id,
          item.name,
          "Produto",
          item.quantity ?? 1,
          item.price * (item.quantity ?? 1),
          done,
          b.user.id,
        ),
      )
    })
  sales
    .filter((s) => !s.bookingId)
    .forEach((s) =>
      add(
        s.productId || s.productName,
        s.productName,
        "Produto",
        s.quantity,
        Number(s.totalAmount),
        true,
        s.clientName || "Cliente",
      ),
    )
  return Array.from(items.values())
}
