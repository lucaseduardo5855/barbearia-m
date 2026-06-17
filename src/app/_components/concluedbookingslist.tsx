"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "./ui/button"
import BookingItem from "./booking-item"
import { Prisma } from "@prisma/client"

interface ConcluedBookingsListProps {
  bookings: Prisma.BookingGetPayload<{
    include: {
      service: {
        include: {
          barbershop: true
        }
      }
      barber: true
    }
  }>[]
  hideBarberShopInfo?: boolean  
}

export default function ConcluedBookingsList({
  bookings,
  hideBarberShopInfo,
}: ConcluedBookingsListProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (bookings.length === 0) return null

  return (
    <div className="mt-6">
      {/* Botão interativo que funciona como cabeçalho colapsável */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between border-2 border-dashed px-4 py-6 transition-all duration-300 hover:bg-accent/50"
      >
        <span className="text-sm font-semibold text-gray-200">
          Finalizados ({bookings.length})
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400 transition-transform duration-300" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-300" />
        )}
      </Button>
      {/* Lista de agendamentos que só aparece se isOpen for true */}
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 mt-4 space-y-3 duration-300">
          {bookings.map((booking) => (
            <BookingItem key={booking.id} booking={booking} hideBarberShopInfo={hideBarberShopInfo} />
          ))}
        </div>
      )}
    </div>
  )
}
