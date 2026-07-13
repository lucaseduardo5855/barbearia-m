"use client"

import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { LockIcon, MessageCircleIcon, Loader2, Copy, Check } from "lucide-react"
import { useEffect, useState } from "react"
import { createPixPaymentAction } from "@/app/_actions/payment-actions"
import { toast } from "sonner"

interface PixLockScreenProps {
  barbershopId: string
  barbershopName: string
}

export default function PixLockScreen({ barbershopId, barbershopName }: PixLockScreenProps) {
  const CONTACT_NUMBER = "5511999999999" // Formato internacional: DDI + DDD + Número (ex: 55 + 11 + 999999999)
  const WHATSAPP_URL = `https://wa.me/${CONTACT_NUMBER}?text=Olá!%20Fiz%20o%20pagamento%20da%20mensalidade%20para%20a%20barbearia%20*${encodeURIComponent(barbershopName)}*.%20Segue%20o%20comprovante.`

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
            <span className="text-xs text-gray-400 font-semibold uppercase">Valor Mensal</span>
            <span className="text-sm font-bold text-primary">R$ 49,90</span>
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

        {/* Botão de WhatsApp */}
        <div className="space-y-2 pt-2">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="w-full block">
            <Button className="w-full py-6 flex items-center justify-center gap-2 font-bold text-md">
              <MessageCircleIcon className="w-5 h-5 fill-current" />
              Enviar Comprovante por WhatsApp
            </Button>
          </a>
          <p className="text-xs text-muted-foreground">
            Sua conta será liberada na hora assim que confirmarmos o Pix.
          </p>
        </div>
      </Card>
    </div>
  )
}
