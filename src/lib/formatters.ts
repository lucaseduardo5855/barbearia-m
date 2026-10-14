const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export function formatBRL(
  value: number | string | bigint | { toString(): string } | null | undefined,
) {
  const amount = Number(value ?? 0)
  return brlFormatter.format(Object.is(amount, -0) ? 0 : amount)
}
