"use client"
import { forwardRef, type ComponentProps } from "react"
import { Input } from "@/app/_components/ui/input"
import { formatBRL } from "@/lib/formatters"
import { moneyFromDigits } from "@/lib/money"
type MoneyInputProps = Omit<
  ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: number
  onValueChange: (value: number) => void
}
// Cent-based BRL mask. The parent receives a number, never a localized string.
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  function MoneyInput({ value, onValueChange, ...props }, ref) {
    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="decimal"
        value={formatBRL(value)}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onValueChange(moneyFromDigits(event.target.value))}
      />
    )
  },
)
