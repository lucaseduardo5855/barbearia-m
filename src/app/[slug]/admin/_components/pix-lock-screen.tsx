"use client"

import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { LockIcon, Loader2, Copy, Check } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createPixPaymentAction, checkBarbershopSubscriptionAction } from "@/app/_actions/payment-actions"
import { toast } from "sonner"

interface PixLockScreenProps {
  barbershopId: string
  barbershopName: string
}

export default function PixLockScreen({ barbershopId, barbershopName }: PixLockScreenProps) {
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
        toast.error("Erro ao gerar o QR Code Pix. Tente novamente.")
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
    <div className="flex min-h-screen bg-background text-foreground flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/50 bg-card p-6 text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4 text-destructive">
            <LockIcon className="w-12 h-12" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-destructive">Período de Teste Expirou!</h1>
          <p className="text-sm text-muted-foreground">
            Os 7 dias grátis de teste da barbearia <strong>{barbershopName}</strong> terminaram. 
            Para continuar acessando o painel e recebendo agendamentos, ative sua assinatura.
          </p>
        </div>

        {/* Informações de Pagamento */}
        <div className="bg-secondary/40 p-4 rounded-xl text-left space-y-4 border border-secondary">
          <div className="flex justify-between border-b border-secondary/60 pb-2">
            <span className="text-xs text-gray-400 font-semibold uppercase">Valor Mensal (Teste)</span>
            <span className="text-sm font-bold text-primary">R$ 1,00</span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Gerando Pix no Mercado Pago...</p>
            </div>
          ) : paymentData ? (
            <div className="flex flex-col items-center space-y-4">
              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-lg flex items-center justify-center shadow-md">
                <img
                  src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                  alt="QR Code Pix"
                  className="w-48 h-48"
                />
              </div>

              {/* Copia e Cola Container */}
              <div className="w-full space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase">Chave Copia e Cola</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/30 p-2 rounded border border-secondary text-xs font-mono truncate select-all">
                    {paymentData.qrCode}
                  </div>
                  <Button
                    onClick={handleCopy}
                    variant="secondary"
                    size="icon"
                    className="shrink-0"
                    type="button"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-gray-500">Clique no botão para copiar o código Pix.</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-destructive font-medium">
              Erro ao carregar o Pix. Recarregue a página.
            </div>
          )}
        </div>

        {/* Status de Liberação Automática */}
        <div className="space-y-2 pt-2 border-t border-secondary/40">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Aguardando pagamento Pix...</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Assim que você efetuar o Pix no seu banco, o sistema reconhecerá e liberará o seu acesso automaticamente em tempo real.
          </p>
        </div>
      </Card>
    </div>
  )
}
