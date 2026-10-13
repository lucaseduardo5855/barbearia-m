"use server"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { authOptions } from "../_lib/auth"
import { db } from "@/lib/prisma"
import { defaultCommunicationOptions } from "@/lib/notification-plan"
import { notificationReadiness } from "@/lib/notification-provider"

async function ownedShop(barbershopId: string) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) throw new Error("Entre na sua conta.")
  const shop = await db.barbershop.findFirst({
    where: { id: barbershopId, ownerId: userId },
    select: { id: true, slug: true },
  })
  if (!shop)
    throw new Error("Somente o proprietário pode configurar mensagens.")
  return shop
}
export async function getNotificationSettings(barbershopId: string) {
  await ownedShop(barbershopId)
  const [settings, deliveries] = await Promise.all([
    db.communicationSettings.findUnique({ where: { barbershopId } }),
    db.notificationDelivery.findMany({
      where: { barbershopId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        kind: true,
        channel: true,
        status: true,
        createdAt: true,
        error: true,
      },
    }),
  ])
  return {
    settings: settings || defaultCommunicationOptions,
    readiness: notificationReadiness(),
    deliveries,
  }
}
const schema = z.object({
  emailReminderEnabled: z.boolean(),
  whatsappReminderEnabled: z.boolean(),
  reviewWhatsappEnabled: z.boolean(),
  returnWhatsappEnabled: z.boolean(),
  returnAfterDays: z.number().int().min(7).max(180),
})
export async function saveNotificationSettings(
  barbershopId: string,
  input: z.infer<typeof schema>,
) {
  const shop = await ownedShop(barbershopId)
  const data = schema.parse(input)
  const ready = notificationReadiness()
  if (
    Object.entries(data).some(
      ([key, value]) => key.endsWith("Enabled") && value,
    ) &&
    !ready.scheduler
  )
    throw new Error(
      "Configure CRON_SECRET e o agendador antes de ativar mensagens.",
    )
  if (data.emailReminderEnabled && !ready.email)
    throw new Error("Configure o remetente verificado e a chave do Resend.")
  if (
    (data.whatsappReminderEnabled && !ready.whatsappReminder) ||
    (data.reviewWhatsappEnabled && !ready.whatsappReview) ||
    (data.returnWhatsappEnabled && !ready.whatsappReturn)
  )
    throw new Error(
      "Configure a API oficial do WhatsApp e os templates aprovados.",
    )
  await db.communicationSettings.upsert({
    where: { barbershopId },
    create: { barbershopId, ...data },
    update: data,
  })
  revalidatePath(`/${shop.slug}/admin`)
}
export async function disableMyNotifications() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId)
    throw new Error("Entre na sua conta para alterar suas preferências.")
  await db.booking.updateMany({
    where: { userId },
    data: {
      emailReminderConsent: false,
      whatsappReminderConsent: false,
      marketingConsent: false,
    },
  })
  revalidatePath("/notifications")
}
