"use server"

import { db } from "@/lib/prisma"
import { endOfDay, startOfDay } from "date-fns"

interface getBookingsProps {
  serviceId: string
  date: Date
}

export const getBookings = async ({ date }: getBookingsProps) => {
  const bookings = await db.booking.findMany({
    where: {
      date: {
        lte: endOfDay(date),
        gte: startOfDay(date),
      },
    },
  })
  return bookings
}
