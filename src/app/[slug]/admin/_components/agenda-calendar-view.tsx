"use client"

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import type { BookingWithDetails } from "@/lib/booking-types"
import { formatBRL } from "@/lib/formatters"

type Appointment = BookingWithDetails
export function AgendaCalendarView({
  date,
  view,
  bookings,
  onOpen,
  onSelectDay,
}: {
  date: Date
  view: "week" | "month"
  bookings: Appointment[]
  onOpen: (booking: Appointment) => void
  onSelectDay: (date: Date) => void
}) {
  const start = startOfWeek(view === "month" ? startOfMonth(date) : date, {
    weekStartsOn: 1,
  })
  const end = endOfWeek(view === "month" ? endOfMonth(date) : date, {
    weekStartsOn: 1,
  })
  const days = eachDayOfInterval({ start, end })
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {days.slice(0, 7).map((day) => (
            <div
              key={day.toISOString()}
              className="px-3 py-3 text-sm capitalize text-muted-foreground"
            >
              {format(day, "EEEE", { locale: ptBR })}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const events = bookings
              .filter((b) => isSameDay(new Date(b.date), day))
              .sort(
                (a, b) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime(),
              )
            return (
              <section
                key={day.toISOString()}
                className={`min-h-40 border-b border-r border-border p-2.5 last:border-r-0 ${isSameMonth(day, date) ? "" : "bg-muted/20"} ${view === "week" ? "min-h-[25rem]" : ""}`}
              >
                <button
                  onClick={() => onSelectDay(day)}
                  className={`mb-2 flex size-9 items-center justify-center rounded-lg text-sm hover:bg-secondary ${isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  aria-label={format(day, "dd 'de' MMMM", { locale: ptBR })}
                >
                  {format(day, "d")}
                </button>
                <div className="space-y-1.5">
                  {events.slice(0, view === "month" ? 3 : 30).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onOpen(event)}
                      className="w-full rounded-md border border-border bg-secondary/60 px-2 py-2 text-left transition-colors hover:border-primary/50 hover:bg-secondary"
                    >
                      <p className="truncate text-sm">
                        <span className="tabular-nums text-primary">
                          {format(new Date(event.date), "HH:mm")}
                        </span>{" "}
                        · {event.user.name || "Cliente"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {event.service.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {event.barber?.name || "Não atribuído"} ·{" "}
                        {formatBRL(event.totalPrice ?? event.service.price)}
                      </p>
                    </button>
                  ))}
                  {view === "month" && events.length > 3 && (
                    <button
                      onClick={() => onSelectDay(day)}
                      className="px-2 py-1 text-sm text-primary"
                    >
                      +{events.length - 3} atendimentos
                    </button>
                  )}
                  {view === "week" && !events.length && (
                    <p className="pt-4 text-sm text-muted-foreground">
                      Sem atendimentos
                    </p>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
