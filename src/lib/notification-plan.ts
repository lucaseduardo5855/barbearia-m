export type NotificationKind = "REMINDER" | "REVIEW" | "RETURN"
export type NotificationChannel = "EMAIL" | "WHATSAPP"
export interface CommunicationOptions {
  emailReminderEnabled: boolean
  whatsappReminderEnabled: boolean
  reviewWhatsappEnabled: boolean
  returnWhatsappEnabled: boolean
  returnAfterDays: number
}
export const defaultCommunicationOptions: CommunicationOptions = {
  emailReminderEnabled: false,
  whatsappReminderEnabled: false,
  reviewWhatsappEnabled: false,
  returnWhatsappEnabled: false,
  returnAfterDays: 30,
}
export interface NotificationBooking {
  id: string
  date: Date
  status: string
  completedAt: Date | null
  emailReminderConsent: boolean
  whatsappReminderConsent: boolean
  marketingConsent: boolean
  user: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
  }
  service: {
    name: string
    barbershop: { id: string; name: string; slug: string | null }
  }
}
export interface NotificationJob {
  key: string
  kind: NotificationKind
  channel: NotificationChannel
  destination: string
  booking: NotificationBooking
}
const day = 86_400_000
export function whatsappNumber(value: string | null) {
  const digits = value?.replace(/\D/g, "") || ""
  return /^(55)?\d{10,11}$/.test(digits)
    ? digits.length <= 11
      ? `55${digits}`
      : digits
    : null
}
export function planNotifications(
  bookings: NotificationBooking[],
  options: CommunicationOptions,
  now = new Date(),
) {
  const jobs: NotificationJob[] = []
  const add = (
    booking: NotificationBooking,
    kind: NotificationKind,
    channel: NotificationChannel,
    destination: string,
  ) => {
    jobs.push({
      key: `${booking.id}:${booking.date.toISOString()}:${kind}:${channel}`,
      kind,
      channel,
      destination,
      booking,
    })
  }
  for (const booking of bookings) {
    const phone = whatsappNumber(booking.user.phone)
    const untilAppointment = booking.date.getTime() - now.getTime()
    if (
      booking.status === "CONFIRMED" &&
      untilAppointment > 0 &&
      untilAppointment <= day
    ) {
      if (
        options.emailReminderEnabled &&
        booking.emailReminderConsent &&
        booking.user.email
      )
        add(booking, "REMINDER", "EMAIL", booking.user.email)
      if (
        options.whatsappReminderEnabled &&
        booking.whatsappReminderConsent &&
        phone
      )
        add(booking, "REMINDER", "WHATSAPP", phone)
    }
    if (
      booking.status !== "DONE" ||
      !booking.completedAt ||
      !booking.marketingConsent ||
      !phone
    )
      continue
    const elapsed = now.getTime() - booking.completedAt.getTime()
    if (options.reviewWhatsappEnabled && elapsed >= day && elapsed < 2 * day)
      add(booking, "REVIEW", "WHATSAPP", phone)
    const returnDue = options.returnAfterDays * day
    if (
      options.returnWhatsappEnabled &&
      elapsed >= returnDue &&
      elapsed < returnDue + day
    ) {
      const hasMoreRecentVisit = bookings.some(
        (other) =>
          other.user.id === booking.user.id &&
          other.id !== booking.id &&
          ((other.status === "DONE" &&
            other.completedAt &&
            other.completedAt > booking.completedAt!) ||
            (["CONFIRMED", "PENDING"].includes(other.status) &&
              other.date > now)),
      )
      if (!hasMoreRecentVisit) add(booking, "RETURN", "WHATSAPP", phone)
    }
  }
  return jobs
}
export function notificationText(job: NotificationJob) {
  const { booking } = job
  const name = booking.user.name || "Cliente"
  const shop = booking.service.barbershop.name
  const date = booking.date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  })
  if (job.kind === "REMINDER")
    return `Olá, ${name}! Lembrete do seu atendimento na ${shop}: ${booking.service.name}, em ${date}. Se precisar alterar, acesse suas reservas.`
  if (job.kind === "REVIEW")
    return `Olá, ${name}! Como foi seu atendimento na ${shop}? Conte para nós o que achou. Sua opinião ajuda a melhorar nosso trabalho.`
  return `Olá, ${name}! Já faz um tempo desde seu último atendimento na ${shop}. Quando quiser renovar o corte, confira os horários disponíveis. Se não quiser receber novos convites, desative as mensagens nas suas preferências.`
}
