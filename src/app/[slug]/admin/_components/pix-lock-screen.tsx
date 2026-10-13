"use client"

import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import Image from "next/image"
import { LockIcon, Loader2, Copy, Check } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  createPixPaymentAction,
  checkBarbershopSubscriptionAction,
} from "@/app/_actions/payment-actions"
import { toast } from "sonner"
import {
  SUBSCRIPTION_PLAN_LABEL,
  SUBSCRIPTION_PLAN,
} from "@/lib/subscription-plan"

interface PixLockScreenProps {
  barbershopId: string
  barbershopName: string
}

export default function PixLockScreen({
  barbershopId,
  barbershopName,
}: PixLockScreenProps) {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    id: number
    qrCode: string
    qrCodeBase64: string
  } | null>(null)

  useEffect(() => {
    async function loadPix() {
      try {
        setIsLoading(true)
        const data = await createPixPaymentAction(barbershopId)
        setPaymentData(data)
      } catch (err: any) {
        toast.error("Não foi possível gerar o QR Code Pix. Tente novamente.")
      } finally {
        setIsLoading(false)
      }
    }
    loadPix()
  }, [barbershopId])

  // Verifica automaticamente a cada 3.5s se a assinatura foi ativada
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await checkBarbershopSubscriptionAction(barbershopId)
        if (res.active) {
          toast.success("Pagamento confirmado! Liberando acesso...")
          clearInterval(interval)
          router.refresh()
        }
      } catch (err) {
        // Silencioso para não incomodar o usuário durante verificações normais
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [barbershopId, router])

  const handleCopy = () => {
    if (!paymentData?.qrCode) return
    navigator.clipboard.writeText(paymentData.qrCode)
    setCopied(true)
    toast.success("Código Pix copiado para a área de transferência!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-md space-y-6 border-destructive/50 bg-card p-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4 text-destructive">
            <LockIcon className="h-12 w-12" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-destructive">
            Período de Teste Expirou!
          </h1>
          <p className="text-sm text-muted-foreground">
            Os {SUBSCRIPTION_PLAN.trialDays} dias grátis de teste da barbearia{" "}
            <strong>{barbershopName}</strong> terminaram. Para continuar
            acessando o painel e recebendo agendamentos, ative sua assinatura.
          </p>
        </div>

        {/* Informações de Pagamento */}
        <div className="space-y-4 rounded-xl border border-secondary bg-secondary/40 p-4 text-left">
          <div className="flex justify-between border-b border-secondary/60 pb-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Valor Mensal (Teste)
            </span>
            <span className="text-sm font-medium text-primary">
              {SUBSCRIPTION_PLAN_LABEL}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                Gerando Pix no Mercado Pago...
              </p>
            </div>
          ) : paymentData ? (
            <div className="flex flex-col items-center space-y-4">
              {/* QR Code Container */}
              <div className="flex items-center justify-center rounded-lg bg-foreground p-3 shadow-md">
                <Image
                  src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                  alt="QR Code Pix"
                  width={192}
                  height={192}
                  unoptimized
                  className="h-48 w-48"
                />
              </div>

              {/* Copia e Cola Container */}
              <div className="w-full space-y-1">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Chave Copia e Cola
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 select-all truncate rounded border border-secondary bg-black/30 p-2 font-mono text-xs">
                    {paymentData.qrCode}
                  </div>
                  <Button
                    onClick={handleCopy}
                    variant="secondary"
                    size="icon"
                    className="shrink-0"
                    type="button"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/70">
                  Selecione o botão para copiar o código Pix.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-sm font-medium text-destructive">
              Não foi possível carregar o Pix. Recarregue a página e tente
              novamente.
            </div>
          )}
        </div>

        {/* Status de Liberação Automática */}
        <div className="space-y-2 border-t border-secondary/40 pt-2">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success"></span>
            </span>
            <span>Aguardando pagamento Pix...</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Assim que você efetuar o Pix no seu banco, o sistema reconhecerá e
            liberará o seu acesso automaticamente em tempo real.
          </p>
        </div>
      </Card>
    </div>
  )
}
