import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "../_lib/auth"
import { db } from "@/lib/prisma"
import { disableMyNotifications } from "../_actions/notification-actions"
import { Button } from "@/components/ui/button"
import Header from "../_components/header"
export default async function NotificationPreferences() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  const count = userId
    ? await db.booking.count({
        where: {
          userId,
          OR: [
            { emailReminderConsent: true },
            { whatsappReminderConsent: true },
            { marketingConsent: true },
          ],
        },
      })
    : 0
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-xl space-y-5 px-5 py-10">
        <Button asChild variant="outline">
          <Link href="/bookings">Voltar aos agendamentos</Link>
        </Button>
        <h1 className="text-2xl">Preferências de mensagens</h1>
        <p className="text-sm text-muted-foreground">
          Você escolhe quais mensagens receber ao confirmar cada reserva. Pode
          cancelar todas as autorizações anteriores aqui, sem cancelar seus
          agendamentos.
        </p>
        {!userId ? (
          <p>Entre na sua conta pelo menu para gerenciar suas mensagens.</p>
        ) : count ? (
          <form action={disableMyNotifications}>
            <Button type="submit">Desativar todas as mensagens</Button>
          </form>
        ) : (
          <p role="status">Você não tem autorizações de envio ativas.</p>
        )}
      </main>
    </>
  )
}
