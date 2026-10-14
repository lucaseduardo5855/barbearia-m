import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/app/_lib/auth"
import { db } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (!userId) {
    return NextResponse.json({ destination: "/" }, { status: 401 })
  }

  const ownedShop = await db.barbershop.findFirst({
    where: { ownerId: userId },
    select: { slug: true },
  })

  if (ownedShop?.slug) {
    return NextResponse.json({ destination: `/${ownedShop.slug}/admin` })
  }

  const barberProfile = await db.barber.findFirst({
    where: { userId },
    select: { barbershop: { select: { slug: true } } },
  })

  return NextResponse.json({
    destination: barberProfile?.barbershop.slug ? `/${barberProfile.barbershop.slug}/admin` : "/bookings",
  })
}
