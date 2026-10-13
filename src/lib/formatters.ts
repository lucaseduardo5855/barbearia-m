const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export function formatBRL(value: number | string | bigint | null | undefined) {
  return brlFormatter.format(Number(value ?? 0))
}

