import type { Booking, BarbershopService, Barber, User } from "@prisma/client"
// Only client-facing customer fields are passed into the admin UI.
export type BookingWithDetails = Booking & {
  service: BarbershopService
  barber: Barber | null
  user: Pick<User, "id" | "name" | "phone" | "image">
}
