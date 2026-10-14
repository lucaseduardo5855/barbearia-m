import { Resend } from "resend"
import { NotificationJob, notificationText } from "./notification-plan"
export function notificationReadiness() {
  const cloud = !!(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_API_VERSION &&
    process.env.NEXTAUTH_URL
  )
  return {
    email: !!(
      process.env.RESEND_API_KEY &&
      process.env.EMAIL_FROM &&
      process.env.NEXTAUTH_URL
    ),
    scheduler: !!process.env.CRON_SECRET,
    whatsappReminder: cloud && !!process.env.WHATSAPP_REMINDER_TEMPLATE,
    whatsappReview: cloud && !!process.env.WHATSAPP_REVIEW_TEMPLATE,
    whatsappReturn: cloud && !!process.env.WHATSAPP_RETURN_TEMPLATE,
  }
}
export function canSendNotification(job: NotificationJob) {
  const ready = notificationReadiness()
  return job.channel === "EMAIL"
    ? ready.email
    : job.kind === "REMINDER"
      ? ready.whatsappReminder
      : job.kind === "REVIEW"
        ? ready.whatsappReview
        : ready.whatsappReturn
}
const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  )
export async function sendNotification(job: NotificationJob) {
  if (!canSendNotification(job)) throw new Error("Canal não configurado.")
  const base = process.env.NEXTAUTH_URL
  if (!base)
    throw new Error(
      "Configure NEXTAUTH_URL para incluir o link de preferências.",
    )
  const preferences = `${base.replace(/\/$/, "")}/notifications`
  const shopUrl = `${base.replace(/\/$/, "")}/${encodeURIComponent(job.booking.service.barbershop.slug || "")}`
  if (job.channel === "EMAIL") {
    const { data, error } = await new Resend(
      process.env.RESEND_API_KEY,
    ).emails.send(
      {
        from: process.env.EMAIL_FROM!,
        to: job.destination,
        subject: `Lembrete de atendimento — ${job.booking.service.barbershop.name}`,
        text: `${notificationText(job)}\nPreferências de mensagens: ${preferences}`,
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#243044;max-width:560px;margin:auto;padding:24px"><h2 style="font-weight:500">Seu próximo atendimento</h2><p>${escapeHtml(notificationText(job))}</p><p><a href="${escapeHtml(preferences)}" style="color:#2563eb">Gerenciar mensagens</a></p></div>`,
      },
      { idempotencyKey: job.key },
    )
    if (error || !data?.id) throw new Error("O provedor não aceitou o e-mail.")
    return data.id
  }
  const templates = {
    REMINDER: process.env.WHATSAPP_REMINDER_TEMPLATE,
    REVIEW: process.env.WHATSAPP_REVIEW_TEMPLATE,
    RETURN: process.env.WHATSAPP_RETURN_TEMPLATE,
  }
  // Approved templates require four body variables: client, shop, detail, preferences URL.
  const detail =
    job.kind === "REMINDER"
      ? `${job.booking.service.name}, ${job.booking.date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}`
      : shopUrl
  const response = await fetch(
    `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: job.destination,
        type: "template",
        template: {
          name: templates[job.kind],
          language: { code: "pt_BR" },
          components: [
            {
              type: "body",
              parameters: [
                job.booking.user.name || "Cliente",
                job.booking.service.barbershop.name,
                detail,
                preferences,
              ].map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  )
  const result = await response.json()
  if (!response.ok || !result.messages?.[0]?.id)
    throw new Error(
      `WhatsApp recusou a mensagem (HTTP ${response.status}). Revise o template e as permissões.`,
    )
  return result.messages[0].id as string
}
