"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog"
import { Calendar } from "./calendar"
import { Button } from "./button"

export function DatePicker({
  value,
  onChange,
  label = "Escolher data",
}: {
  value: Date
  onChange: (date: Date) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={label}
        className="gap-2"
      >
        <CalendarDays className="size-4" />
        {format(value, "dd/MM/yyyy", { locale: ptBR })}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-fit max-w-[calc(100%-2rem)] gap-3">
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription className="sr-only">
            Selecione uma data no calendário.
          </DialogDescription>
          <Calendar
            mode="single"
            locale={ptBR}
            selected={value}
            defaultMonth={value}
            onSelect={(date) => {
              if (date) {
                onChange(date)
                setOpen(false)
              }
            }}
          />
          <Button
            variant="outline"
            onClick={() => {
              onChange(new Date())
              setOpen(false)
            }}
          >
            Hoje
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
