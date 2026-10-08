"use server"

import { db } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { revalidatePath } from "next/cache"

// Função auxiliar para verificar permissões de dono
async function verifyOwnership(barbershopId: string) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user) {
    throw new Error("Usuário não autenticado!")
  }

  const userId = (session.user as any).id
  const barbershop = await db.barbershop.findUnique({
    where: { id: barbershopId },
    select: { ownerId: true, slug: true }
  })

  if (!barbershop || barbershop.ownerId !== userId) {
    throw new Error("Acesso negado! Você não é o proprietário desta barbearia.")
  }

  return barbershop
}

// 1. Cadastrar um Novo Serviço
export async function addServiceAction(params: {
  barbershopId: string
  name: string
  price: number
  description: string
  imageUrl: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const service = await db.barbershopService.create({
    data: {
      name: params.name,
      price: params.price,
      description: params.description,
      imageUrl: params.imageUrl,
      barbershopId: params.barbershopId
    }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return service
}

// 2. Excluir um Serviço
export async function deleteServiceAction(params: {
  barbershopId: string
  serviceId: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  // Validação Multi-tenant: Confirma se o serviço pertence a esta barbearia
  const existingService = await db.barbershopService.findFirst({
    where: { id: params.serviceId, barbershopId: params.barbershopId }
  })
  if (!existingService) {
    throw new Error("Serviço não encontrado nesta barbearia.")
  }

  // Primeiro removemos agendamentos atrelados para evitar erros de chave estrangeira (boas práticas SQL)
  await db.booking.deleteMany({
    where: { serviceId: params.serviceId }
  })

  await db.barbershopService.delete({
    where: { id: params.serviceId }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
}

// 3. Cadastrar um Novo Barbeiro (Equipe)
export async function addBarberAction(params: {
  barbershopId: string
  name: string
  imageUrl: string
  email?: string
  phone?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  // Tenta encontrar o usuário correspondente ao e-mail para vincular na hora
  let linkedUserId: string | null = null
  if (params.email) {
    const existingUser = await db.user.findUnique({
      where: { email: params.email }
    })
    if (existingUser) {
      linkedUserId = existingUser.id
    }
  }

  const DEFAULT_AVATAR = "/avatar2.png"

  const barber = await db.barber.create({
    data: {
      name: params.name,
      imageUrl: params.imageUrl || DEFAULT_AVATAR,
      email: params.email || null,
      phone: params.phone || null,
      barbershopId: params.barbershopId,
      userId: linkedUserId
    }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return barber
}

// 4. Remover um Barbeiro
export async function deleteBarberAction(params: {
  barbershopId: string
  barberId: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  // Validação Multi-tenant: Confirma se o profissional pertence a esta barbearia
  const existingBarber = await db.barber.findFirst({
    where: { id: params.barberId, barbershopId: params.barbershopId }
  })
  if (!existingBarber) {
    throw new Error("Profissional não encontrado nesta barbearia.")
  }

  // Remove agendamentos vinculados a esse barbeiro antes
  await db.booking.deleteMany({
    where: { barberId: params.barberId }
  })

  await db.barber.delete({
    where: { id: params.barberId }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
}

// 5. Atualizar Configurações do Estabelecimento
export async function updateBarbershopConfig(params: {
  barbershopId: string
  name: string
  address: string
  city?: string | null
  state?: string | null
  phones: string[]
  description: string
  imageUrl: string
  bannerUrl?: string | null
  welcomeMessage?: string | null
  instagramUrl?: string | null
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const updated = await db.barbershop.update({
    where: { id: params.barbershopId },
    data: {
      name: params.name,
      address: params.address,
      city: params.city || null,
      state: params.state || null,
      phones: params.phones,
      description: params.description,
      imageUrl: params.imageUrl,
      bannerUrl: params.bannerUrl,
      welcomeMessage: params.welcomeMessage,
      instagramUrl: params.instagramUrl
    }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return updated
}

// 6. Atualizar Status e Pagamento de um Agendamento
export async function updateBookingStatusAction(params: {
  barbershopId: string
  bookingId: string
  status: "CONFIRMED" | "CANCELLED" | "DONE"
  paymentStatus?: "PENDING" | "PAID"
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const existingBooking = await db.booking.findFirst({
    where: {
      id: params.bookingId,
      service: { barbershopId: params.barbershopId }
    }
  })
  if (!existingBooking) {
    throw new Error("Agendamento não encontrado nesta barbearia.")
  }

  const updatedBooking = await db.booking.update({
    where: { id: params.bookingId },
    data: {
      status: params.status,
      ...(params.paymentStatus ? { paymentStatus: params.paymentStatus } : {})
    }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)

  return updatedBooking
}

// 7. Criar Agendamento Manual no Admin (Agenda)
export async function createAdminBookingAction(params: {
  barbershopId: string
  barberId?: string
  serviceId: string
  date: Date | string
  clientName: string
  clientPhone?: string
  bookingType?: "PADRAO" | "ENCAIXE"
  notes?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const service = await db.barbershopService.findFirst({
    where: { id: params.serviceId, barbershopId: params.barbershopId }
  })
  if (!service) {
    throw new Error("Serviço selecionado não existe.")
  }

  // Tenta encontrar ou criar o usuário cliente pelo telefone/nome
  let targetUser = null
  const cleanPhone = params.clientPhone ? params.clientPhone.replace(/\D/g, "") : null

  if (cleanPhone) {
    targetUser = await db.user.findFirst({
      where: { phone: cleanPhone }
    })
  }

  if (!targetUser) {
    targetUser = await db.user.create({
      data: {
        name: params.clientName || "Cliente Balcão",
        phone: cleanPhone || `manual_${Date.now()}`,
        role: "CLIENT"
      }
    })
  }

  // Gera número da comanda de 7 dígitos aleatórios
  const orderNumber = String(Math.floor(1000000 + Math.random() * 9000000))

  const newBooking = await db.booking.create({
    data: {
      serviceId: params.serviceId,
      barberId: params.barberId || null,
      userId: targetUser.id,
      date: new Date(params.date),
      bookingType: params.bookingType || "PADRAO",
      orderNumber,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      paymentMethod: "ON_SITE",
      totalPrice: service.price
    }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return newBooking
}

// 8. Atualizar Detalhes da Comanda (Serviços Extras, Produtos e Comissão)
export async function updateBookingDetailsAction(params: {
  barbershopId: string
  bookingId: string
  status?: "CONFIRMED" | "CANCELLED" | "DONE"
  extraServices?: { id: string; name: string; price: number }[]
  extraProducts?: { id: string; name: string; price: number; quantity: number }[]
  barberCommissionAmount?: number
  totalPrice?: number
  paymentStatus?: "PENDING" | "PAID"
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const existingBooking = await db.booking.findFirst({
    where: {
      id: params.bookingId,
      service: { barbershopId: params.barbershopId }
    },
    include: { service: true, barber: true }
  })
  if (!existingBooking) {
    throw new Error("Agendamento não encontrado.")
  }

  const updatedBooking = await db.booking.update({
    where: { id: params.bookingId },
    data: {
      ...(params.status ? { status: params.status } : {}),
      ...(params.paymentStatus ? { paymentStatus: params.paymentStatus } : {}),
      ...(params.extraServices !== undefined ? { extraServices: JSON.stringify(params.extraServices) } : {}),
      ...(params.extraProducts !== undefined ? { extraProducts: JSON.stringify(params.extraProducts) } : {}),
      ...(params.barberCommissionAmount !== undefined ? { barberCommissionAmount: params.barberCommissionAmount } : {}),
      ...(params.totalPrice !== undefined ? { totalPrice: params.totalPrice } : {})
    }
  })

  revalidatePath(`/${barbershop.slug}`)
  revalidatePath(`/${barbershop.slug}/admin`)
  return updatedBooking
}

// 9. Bloquear Horário na Agenda
export async function createBlockedTimeAction(params: {
  barbershopId: string
  barberId?: string | null
  date: Date | string
  reason?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const blocked = await db.blockedTime.create({
    data: {
      barbershopId: params.barbershopId,
      barberId: params.barberId || null,
      date: new Date(params.date),
      reason: params.reason || "Horário Bloqueado"
    }
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return blocked
}

// 10. Desbloquear Horário
export async function deleteBlockedTimeAction(params: {
  barbershopId: string
  blockedTimeId: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  await db.blockedTime.delete({
    where: { id: params.blockedTimeId, barbershopId: params.barbershopId }
  })

  revalidatePath(`/${barbershop.slug}/admin`)
}

// 11. Cadastrar / Editar / Excluir Produto
export async function addProductAction(params: {
  barbershopId: string
  name: string
  price: number
  costPrice?: number
  stock: number
  category?: string
  imageUrl?: string
  description?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const product = await db.product.create({
    data: {
      barbershopId: params.barbershopId,
      name: params.name,
      price: params.price,
      costPrice: params.costPrice || null,
      stock: params.stock || 0,
      category: params.category || "Geral",
      imageUrl: params.imageUrl || null,
      description: params.description || null
    }
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return product
}

export async function updateProductAction(params: {
  barbershopId: string
  productId: string
  name: string
  price: number
  costPrice?: number
  stock: number
  category?: string
  imageUrl?: string
  description?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const updated = await db.product.update({
    where: { id: params.productId, barbershopId: params.barbershopId },
    data: {
      name: params.name,
      price: params.price,
      costPrice: params.costPrice || null,
      stock: params.stock,
      category: params.category || "Geral",
      imageUrl: params.imageUrl || null,
      description: params.description || null
    }
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return updated
}

export async function deleteProductAction(params: {
  barbershopId: string
  productId: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  await db.product.delete({
    where: { id: params.productId, barbershopId: params.barbershopId }
  })

  revalidatePath(`/${barbershop.slug}/admin`)
}

// 12. Venda de Produto Avulsa (ou associada a um agendamento)
export async function createProductSaleAction(params: {
  barbershopId: string
  productId: string
  barberId?: string | null
  clientName?: string
  quantity: number
  unitPrice: number
  date?: Date | string
  bookingId?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const product = await db.product.findFirst({
    where: { id: params.productId, barbershopId: params.barbershopId }
  })
  if (!product) {
    throw new Error("Produto não encontrado.")
  }

  const quantity = Math.max(1, params.quantity || 1)
  const totalAmount = Number(params.unitPrice) * quantity

  // Calcula comissão para o barbeiro se houver (ex: taxa padrão de comissão sobre produtos ou metade da taxa padrão)
  let commissionAmount = 0
  if (params.barberId) {
    const barber = await db.barber.findFirst({
      where: { id: params.barberId, barbershopId: params.barbershopId }
    })
    const rate = barber?.commissionRate ? Number(barber.commissionRate) : 20 // 20% para produtos por padrão ou rate
    commissionAmount = (totalAmount * rate) / 100
  }

  // Cria a venda
  const sale = await db.productSale.create({
    data: {
      barbershopId: params.barbershopId,
      productId: product.id,
      productName: product.name,
      barberId: params.barberId || null,
      clientName: params.clientName || "Cliente",
      quantity,
      unitPrice: params.unitPrice,
      totalAmount,
      commissionAmount,
      date: params.date ? new Date(params.date) : new Date(),
      bookingId: params.bookingId || null
    }
  })

  // Decrementa o estoque do produto
  if (product.stock >= quantity) {
    await db.product.update({
      where: { id: product.id },
      data: { stock: product.stock - quantity }
    })
  }

  revalidatePath(`/${barbershop.slug}/admin`)
  return sale
}

// 13. Transações Financeiras Manuais (Despesas, Receitas manuais, Vales)
export async function createFinancialTransactionAction(params: {
  barbershopId: string
  barberId?: string | null
  type: "RECEITA" | "DESPESA" | "COMISSAO_PAGA" | "VALE"
  category: string
  description: string
  amount: number
  date?: Date | string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const transaction = await db.financialTransaction.create({
    data: {
      barbershopId: params.barbershopId,
      barberId: params.barberId || null,
      type: params.type,
      category: params.category,
      description: params.description,
      amount: params.amount,
      date: params.date ? new Date(params.date) : new Date()
    }
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return transaction
}

// 14. Dar Baixa nas Comissões dos Colaboradores
export async function payBarberCommissionsAction(params: {
  barbershopId: string
  barberId: string
  amount: number
  description?: string
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const barber = await db.barber.findFirst({
    where: { id: params.barberId, barbershopId: params.barbershopId }
  })
  if (!barber) {
    throw new Error("Colaborador não encontrado.")
  }

  const transaction = await db.financialTransaction.create({
    data: {
      barbershopId: params.barbershopId,
      barberId: params.barberId,
      type: "COMISSAO_PAGA",
      category: "Comissões",
      description: params.description || `Pagamento de comissão para ${barber.name}`,
      amount: params.amount,
      date: new Date()
    }
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return transaction
}

// 15. Atualizar Taxa de Comissão do Barbeiro
export async function updateBarberCommissionRateAction(params: {
  barbershopId: string
  barberId: string
  commissionRate: number
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  const updated = await db.barber.update({
    where: { id: params.barberId, barbershopId: params.barbershopId },
    data: { commissionRate: params.commissionRate }
  })

  revalidatePath(`/${barbershop.slug}/admin`)
  return updated
}

// 16. Configuração Rápida da Unidade (Logo em botões, Horários de Trabalho, Serviços Rápidos)
export async function quickSetupBarbershopAction(params: {
  barbershopId: string
  name: string
  address: string
  city?: string
  state?: string
  phones: string[]
  openingHours?: string
  imageUrl?: string
  selectedServices?: {
    name: string
    description: string
    price: number
    imageUrl: string
  }[]
}) {
  const barbershop = await verifyOwnership(params.barbershopId)

  // Atualiza dados da barbearia, logo e horários de trabalho
  const updatedBarbershop = await db.barbershop.update({
    where: { id: params.barbershopId },
    data: {
      name: params.name,
      address: params.address,
      city: params.city || null,
      state: params.state || null,
      phones: params.phones,
      openingHours: params.openingHours || null,
      ...(params.imageUrl ? { imageUrl: params.imageUrl } : {})
    }
  })

  // Se selecionou serviços pré-definidos do catálogo rápido de Beleza, cria os serviços que ainda não existem
  if (params.selectedServices && params.selectedServices.length > 0) {
    for (const s of params.selectedServices) {
      const exists = await db.barbershopService.findFirst({
        where: {
          barbershopId: params.barbershopId,
          name: s.name
        }
      })
      if (!exists) {
        await db.barbershopService.create({
          data: {
            barbershopId: params.barbershopId,
            name: s.name,
            description: s.description,
            price: s.price,
            imageUrl: s.imageUrl
          }
        })
      }
    }
  }

  revalidatePath(`/${updatedBarbershop.slug}`)
  revalidatePath(`/${updatedBarbershop.slug}/admin`)
  return updatedBarbershop
}

