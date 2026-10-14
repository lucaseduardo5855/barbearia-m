import { z } from "zod"
import { moneySchema } from "./money"
export const productSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do produto.").max(150),
  price: moneySchema.refine(
    (value) => value > 0,
    "O preço de venda deve ser maior que zero.",
  ),
  costPrice: moneySchema.optional(),
  stock: z
    .number()
    .int("Estoque deve ser um número inteiro.")
    .min(0)
    .max(1_000_000),
  minStock: z.number().int().min(0).max(1_000_000).default(3),
  brand: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  imageUrl: z.string().optional(),
  description: z.string().trim().max(2000).optional(),
})
export function productData(input: unknown) {
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) throw new Error(parsed.error.issues[0].message)
  const data = parsed.data
  return {
    ...data,
    costPrice: data.costPrice ?? null,
    brand: data.brand || null,
    category: data.category || "Geral",
    imageUrl: data.imageUrl || null,
    description: data.description || null,
  }
}
