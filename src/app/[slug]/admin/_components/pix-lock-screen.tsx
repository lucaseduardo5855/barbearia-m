"use client"

import { Button } from "@/app/_components/ui/button"
import { Card, CardContent } from "@/app/_components/ui/card"
import { LockIcon, MessageCircleIcon } from "lucide-react"

interface PixLockScreenProps {
  barbershopName: string
}

export default function PixLockScreen({ barbershopName }: PixLockScreenProps) {
  // Você pode configurar sua chave Pix e número de WhatsApp aqui
  const PIX_KEY = "12.345.678/0001-99 (CNPJ)"
  const CONTACT_NUMBER = "5511999999999" // Formato internacional: DDI + DDD + Número (ex: 55 + 11 + 999999999)
  const WHATSAPP_URL = `https://wa.me/${CONTACT_NUMBER}?text=Olá!%20Fiz%20o%20pagamento%20da%20mensalidade%20para%20a%20barbearia%20*${encodeURIComponent(barbershopName)}*.%20Segue%20o%20comprovante.`

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
        <div className="bg-secondary/40 p-4 rounded-xl text-left space-y-3 border border-secondary">
          <div className="flex justify-between border-b border-secondary/60 pb-2">
            <span className="text-xs text-gray-400 font-semibold uppercase">Valor Mensal</span>
            <span className="text-sm font-bold text-primary">R$ 49,90</span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-semibold uppercase">Chave Pix de Pagamento</span>
            <div className="flex items-center justify-between bg-black/30 p-2 rounded border border-secondary text-sm font-mono break-all select-all">
              {PIX_KEY}
            </div>
            <p className="text-[10px] text-gray-500">Clique na chave acima para copiar.</p>
          </div>
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
