import { z } from "zod"

const price = z
  .union([z.string().trim().min(1, "Informe o preço do serviço."), z.number()])
  .transform((value) =>
    typeof value === "string" ? Number(value.trim().replace(",", ".")) : value,
  )
  .pipe(
    z.number().finite().min(0, "O preço não pode ser negativo.").max(999999.99),
  )
export const registrationServiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres."),
  price,
  description: z.string().trim().optional(),
})
export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da barbearia."),
  address: z.string().trim().min(3, "Informe o endereço completo."),
  phones: z
    .array(
      z
        .string()
        .trim()
        .refine(
          (value) => value.replace(/\D/g, "").length >= 10,
          "Informe um telefone com DDD.",
        ),
    )
    .min(1),
  description: z
    .string()
    .trim()
    .min(3, "Descreva a barbearia em pelo menos 3 caracteres."),
  imageUrl: z.string().trim().min(1, "Envie a logo da barbearia."),
  welcomeMessage: z.string().trim().optional(),
  instagramUrl: z
    .union([
      z.literal(""),
      z.url({ message: "Informe um link válido do Instagram." }),
    ])
    .optional(),
  services: z
    .array(registrationServiceSchema)
    .min(1, "Adicione pelo menos um serviço."),
  openingHours: z
    .array(
      z
        .object({
          key: z.enum(["seg", "ter", "qua", "qui", "sex", "sab", "dom"]),
          active: z.boolean(),
          start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
          end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        })
        .refine(
          (day) => !day.active || day.end > day.start,
          "O fechamento deve ser depois da abertura.",
        ),
    )
    .length(7)
    .refine(
      (days) => days.some((day) => day.active),
      "Selecione pelo menos um dia de atendimento.",
    ),
  barberName: z.string().trim().optional(),
  barberEmail: z
    .union([
      z.literal(""),
      z.email({ message: "Informe um e-mail válido para o profissional." }),
    ])
    .optional(),
})
export type RegistrationInput = z.input<typeof registrationSchema>
