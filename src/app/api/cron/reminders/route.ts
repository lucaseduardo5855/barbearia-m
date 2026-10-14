import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { db } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { planNotifications } from "@/lib/notification-plan"
import {
  canSendNotification,
  sendNotification,
} from "@/lib/notification-provider"

export const dynamic = "force-dynamic"
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET)
    return NextResponse.json(
      { error: "Agendamento automático não configurado." },
      { status: 503 },
    )
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`)
  const supplied = Buffer.from(request.headers.get("authorization") || "")
  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  )
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  const dryRun = request.nextUrl.searchParams.get("dryRun") === "true"
  const now = new Date()
  const totals = { planned: 0, accepted: 0, skipped: 0, failed: 0, dryRun }
  try {
    const settings = await db.communicationSettings.findMany({
      where: {
        OR: [
          { emailReminderEnabled: true },
          { whatsappReminderEnabled: true },
          { reviewWhatsappEnabled: true },
          { returnWhatsappEnabled: true },
        ],
      },
    })
    for (const options of settings) {
      const bookings = await db.booking.findMany({
        where: {
          service: { barbershopId: options.barbershopId },
          OR: [
            { status: { in: ["CONFIRMED", "PENDING"] }, date: { gt: now } },
            {
              status: "DONE",
              completedAt: {
                gte: new Date(
                  now.getTime() - (options.returnAfterDays + 2) * 86_400_000,
                ),
              },
            },
          ],
        },
        include: { user: true, service: { include: { barbershop: true } } },
      })
      const jobs = planNotifications(bookings, options, now)
      totals.planned += jobs.length
      for (const job of jobs) {
        if (!canSendNotification(job)) {
          totals.skipped++
          continue
        }
        if (dryRun) continue
        // Unique claim before provider call: concurrent cron calls cannot send twice.
        let delivery
        try {
          delivery = await db.notificationDelivery.create({
            data: {
              dedupeKey: job.key,
              bookingId: job.booking.id,
              barbershopId: options.barbershopId,
              kind: job.kind,
              channel: job.channel,
            },
          })
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            totals.skipped++
            continue
          }
          throw error
        }
        try {
          const current = await db.booking.findUnique({
            where: { id: job.booking.id },
            include: { user: true, service: { include: { barbershop: true } } },
          })
          const eligible =
            current &&
            planNotifications(
              [current, ...bookings.filter((b) => b.id !== current.id)],
              options,
              now,
            ).find((candidate) => candidate.key === job.key)
          if (!eligible) {
            await db.notificationDelivery.update({
              where: { id: delivery.id },
              data: { status: "SKIPPED" },
            })
            totals.skipped++
            continue
          }
          const providerId = await sendNotification(eligible)
          await db.notificationDelivery.update({
            where: { id: delivery.id },
            data: { status: "ACCEPTED", providerId, acceptedAt: new Date() },
          })
          totals.accepted++
        } catch (error) {
          // No automatic retry: a timed-out request may already have been accepted.
          await db.notificationDelivery.update({
            where: { id: delivery.id },
            data: {
              status: "FAILED",
              error:
                error instanceof Error
                  ? error.message.slice(0, 200)
                  : "Falha de envio.",
            },
          })
          totals.failed++
        }
      }
    }
    return NextResponse.json(totals)
  } catch {
    return NextResponse.json(
      { error: "Não foi possível processar os lembretes." },
      { status: 500 },
    )
  }
}
