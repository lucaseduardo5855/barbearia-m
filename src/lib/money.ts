import { z } from "zod"
// PostgreSQL Decimal(10,2), shared by prices, sales and financial entries.
export const MAX_MONEY = 99_999_999.99
export const moneySchema = z
  .number()
  .finite()
  .min(0, "O valor não pode ser negativo.")
  .max(MAX_MONEY, "Valor acima do limite de R$ 99.999.999,99.")
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001,
    "Use no máximo duas casas decimais.",
  )
export function moneyFromDigits(text: string) {
  const digits = text
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 10)
  return Number(digits || "0") / 100
}
export function validateMoney(
  value: number,
  label = "Valor",
  allowZero = true,
) {
  const result = moneySchema.safeParse(value)
  if (!result.success)
    throw new Error(`${label}: ${result.error.issues[0].message}`)
  if (!allowZero && value <= 0)
    throw new Error(`${label} deve ser maior que zero.`)
  return Math.round(value * 100) / 100
}
