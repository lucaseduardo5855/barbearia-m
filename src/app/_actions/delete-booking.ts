"use server"

import { db } from "@/lib/prisma"

export const deleteBooking = async (bookingId: string) => {
  await db.booking.delete({
    where: {
      id: bookingId,
    },
  })
}
