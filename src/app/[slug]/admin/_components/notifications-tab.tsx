"use client"
import { useEffect, useState } from "react"
import { Bell, Mail, MessageCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { toast } from "sonner"
import { AdminPageHeader } from "./admin-page-header"
import {
  getNotificationSettings,
  saveNotificationSettings,
} from "@/app/_actions/notification-actions"

type SettingsResult = Awaited<ReturnType<typeof getNotificationSettings>>
export default function NotificationsTab({
  barbershopId,
}: {
  barbershopId: string
}) {
  const [data, setData] = useState<SettingsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [saving, setSaving] = useState(false)
  const load = () => {
    setLoading(true)
    setError(false)
    getNotificationSettings(barbershopId)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }
  useEffect(load, [barbershopId]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-5">
      <AdminPageHeader
        icon={Bell}
        title="Mensagens e lembretes"
        description="Configure os canais e acompanhe as solicitações de envio."
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="size-4" />
            Atualizar
          </Button>
        }
      />
      {loading ? (
        <p role="status" className="text-sm text-muted-foreground">
          Carregando configurações...
        </p>
      ) : error ? (
        <div role="alert" className="space-y-3">
          <p>
            Não foi possível carregar. Entre como proprietário e tente
            novamente.
          </p>
          <Button variant="outline" onClick={load}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        data && (
          <>
            <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-border bg-card p-4 text-sm">
              <span className="flex items-center gap-2">
                <Mail className="size-4 text-primary" />
                E-mail:{" "}
                {data.readiness.email
                  ? "configurado"
                  : "falta remetente verificado"}
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle className="size-4 text-primary" />
                WhatsApp:{" "}
                {data.readiness.whatsappReminder
                  ? "template de lembrete configurado"
                  : "API oficial não configurada"}
              </span>
              <span>
                Agendador:{" "}
                {data.readiness.scheduler
                  ? "chave configurada"
                  : "não configurado"}
              </span>
            </div>
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-base">Automações</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Desativadas por padrão. Apenas clientes que autorizaram recebem
                mensagens. Convites de retorno não são enviados a quem já tem
                uma próxima reserva.
              </p>
              <div className="mt-4 divide-y divide-border">
                {(
                  [
                    [
                      "emailReminderEnabled",
                      "Lembrete por e-mail",
                      "Nas 24 horas antes do atendimento.",
                      data.readiness.email,
                    ],
                    [
                      "whatsappReminderEnabled",
                      "Lembrete no WhatsApp",
                      "Nas 24 horas antes do atendimento.",
                      data.readiness.whatsappReminder,
                    ],
                    [
                      "reviewWhatsappEnabled",
                      "Pedir avaliação",
                      "No dia seguinte à conclusão do atendimento.",
                      data.readiness.whatsappReview,
                    ],
                    [
                      "returnWhatsappEnabled",
                      "Convidar para retornar",
                      "Após o intervalo configurado desde o último atendimento.",
                      data.readiness.whatsappReturn,
                    ],
                  ] as const
                ).map(([key, label, description, ready]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between gap-4 py-4"
                  >
                    <span>
                      <span className="block text-sm">{label}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {description}
                        {!ready && " Configure o canal para ativar."}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="size-5 shrink-0 accent-primary"
                      checked={data.settings[key]}
                      disabled={
                        (!data.settings[key] &&
                          (!ready || !data.readiness.scheduler)) ||
                        saving
                      }
                      onChange={(event) =>
                        setData({
                          ...data,
                          settings: {
                            ...data.settings,
                            [key]: event.target.checked,
                          },
                        })
                      }
                    />
                  </label>
                ))}
              </div>
              <label className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                Intervalo para retorno (dias)
                <Input
                  type="number"
                  min={7}
                  max={180}
                  className="w-24"
                  value={data.settings.returnAfterDays}
                  onChange={(event) =>
                    setData({
                      ...data,
                      settings: {
                        ...data.settings,
                        returnAfterDays: Number(event.target.value),
                      },
                    })
                  }
                />
              </label>
              <div className="mt-5 flex justify-center border-t border-border pt-4 sm:justify-end">
                <Button
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true)
                    try {
                      await saveNotificationSettings(
                        barbershopId,
                        data.settings,
                      )
                      toast.success("Preferências salvas.")
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : "Não foi possível salvar.",
                      )
                    } finally {
                      setSaving(false)
                    }
                  }}
                >
                  {saving ? "Salvando..." : "Salvar preferências"}
                </Button>
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
              <h2 className="text-base">Últimas solicitações</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                “Aceito” significa recebido pelo provedor, não confirmação de
                leitura. Falhas não são repetidas automaticamente para evitar
                duplicação.
              </p>
              {!data.deliveries.length ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum envio automático registrado.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {data.deliveries.map((delivery) => (
                    <li
                      key={delivery.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                    >
                      <span>
                        {
                          {
                            REMINDER: "Lembrete",
                            REVIEW: "Avaliação",
                            RETURN: "Retorno",
                          }[delivery.kind as "REMINDER"]
                        }{" "}
                        · {delivery.channel === "EMAIL" ? "E-mail" : "WhatsApp"}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(delivery.createdAt).toLocaleString("pt-BR")} ·{" "}
                        {{
                          ACCEPTED: "Aceito",
                          FAILED: "Falha",
                          SKIPPED: "Ignorado",
                          PROCESSING: "Processando",
                        }[delivery.status as "ACCEPTED"] || delivery.status}
                        {delivery.error && (
                          <span className="block text-destructive">
                            {delivery.error}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )
      )}
    </div>
  )
}
