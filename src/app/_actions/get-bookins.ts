"use server"
import { db } from "@/lib/prisma"
import { addDays, endOfDay, startOfDay } from "date-fns"

interface GetBookingsProps {
  serviceId: string
  date: Date
  barberId?: string | null
  days?: number
}
export const getBookings = async ({
  serviceId,
  date,
  barberId,
  days = 1,
}: GetBookingsProps) => {
  const service = await db.barbershopService.findUnique({
    where: { id: serviceId },
    select: { barbershopId: true },
  })
  if (!service || Number.isNaN(new Date(date).getTime())) return []
  const period = {
    gte: startOfDay(date),
    lte: endOfDay(addDays(date, Math.min(4, Math.max(1, days)) - 1)),
  }
  const [bookings, blocks, barbers] = await Promise.all([
    db.booking.findMany({
      where: {
        service: { barbershopId: service.barbershopId },
        date: period,
        status: { not: "CANCELLED" },
      },
      select: { id: true, date: true, barberId: true },
    }),
    db.blockedTime.findMany({
      where: { barbershopId: service.barbershopId, date: period },
      select: { id: true, date: true, barberId: true },
    }),
    db.barber.findMany({
      where: { barbershopId: service.barbershopId },
      select: { id: true },
    }),
  ])
  const occupied = [...bookings, ...blocks]
  if (barberId)
    return occupied.filter(
      (entry) => !entry.barberId || entry.barberId === barberId,
    )
  const byDate = new Map<string, typeof occupied>()
  occupied.forEach((entry) => {
    const key = entry.date.toISOString()
    byDate.set(key, [...(byDate.get(key) || []), entry])
  })
  return Array.from(byDate.values())
    .filter(
      (entries) =>
        entries.some((entry) => !entry.barberId) ||
        barbers.every((barber) =>
          entries.some((entry) => entry.barberId === barber.id),
        ),
    )
    .map((entries) => entries[0])
}
