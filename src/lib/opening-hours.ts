export type OpeningDay = {
  label: string
  key: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom"
  active: boolean
  start: string
  end: string
}
export const defaultOpeningDays: OpeningDay[] = [
  { label: "Segunda", key: "seg", active: true, start: "09:00", end: "19:00" },
  { label: "Terça", key: "ter", active: true, start: "09:00", end: "19:00" },
  { label: "Quarta", key: "qua", active: true, start: "09:00", end: "19:00" },
  { label: "Quinta", key: "qui", active: true, start: "09:00", end: "19:00" },
  { label: "Sexta", key: "sex", active: true, start: "09:00", end: "20:00" },
  { label: "Sábado", key: "sab", active: true, start: "09:00", end: "17:00" },
  { label: "Domingo", key: "dom", active: false, start: "09:00", end: "14:00" },
]

export function readOpeningHours(
  value: string | null | undefined,
): OpeningDay[] {
  if (!value) return defaultOpeningDays
  try {
    const saved = JSON.parse(value)
    return defaultOpeningDays.map((day) => ({
      ...day,
      ...(saved[day.key] || {}),
    }))
  } catch {
    return defaultOpeningDays
  }
}

export function openingTimeSlots(
  date: Date,
  openingHours: string | null | undefined,
): string[] {
  const keys = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"]
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  }).format(date)
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekday,
  )
  const day = readOpeningHours(openingHours).find(
    (entry) => entry.key === keys[index],
  )
  if (!day?.active) return []
  const minutes = (time: string) =>
    Number(time.split(":")[0]) * 60 + Number(time.split(":")[1])
  const start = minutes(day.start),
    end = minutes(day.end)
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end)
    return []
  return Array.from({ length: Math.ceil((end - start) / 30) }, (_, i) => {
    const value = start + i * 30
    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`
  })
}
