"use client"

import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Button } from "@/app/_components/ui/button"
import { toast } from "sonner"
import { CopyIcon, ExternalLinkIcon, Share2Icon, CheckCircle2Icon } from "lucide-react"

interface MarketingTabProps {
  barbershop: Barbershop
}

export default function MarketingTab({ barbershop }: MarketingTabProps) {
  // Lógica local de URL pública
  const publicBookingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${barbershop.slug}`
    : `/${barbershop.slug}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicBookingUrl)
    toast.success("Link de agendamento copiado!")
  }

  const handleShareWhatsapp = () => {
    const message = `Olá! Agende seu corte ou barba na barbearia *${barbershop.name}* com rapidez pelo nosso link: ${publicBookingUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Divulgação / Marketing</h2>
        <p className="text-xs text-muted-foreground">Compartilhe o seu link de agendamentos e atraia novos clientes.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-secondary">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-1">
              <Share2Icon className="w-4 h-4" /> Link de Agendamentos
            </h3>
            <p className="text-xs text-muted-foreground">
              Este é o seu link único que os clientes usam para agendar cortes online de forma autônoma.
            </p>

            <div className="bg-secondary/40 p-3 rounded-lg border border-secondary text-xs text-gray-300 truncate font-mono">
              {publicBookingUrl}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopyLink} variant="outline" className="flex-1 gap-2 text-xs">
                <CopyIcon className="w-4 h-4" /> Copiar Link
              </Button>
              <a href={publicBookingUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button variant="secondary" className="w-full gap-2 text-xs">
                  <ExternalLinkIcon className="w-4 h-4" /> Abrir Página
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-sm text-green-500 flex items-center gap-1">
              <CheckCircle2Icon className="w-4 h-4" /> Divulgar no WhatsApp
            </h3>
            <p className="text-xs text-muted-foreground">
              Abra uma mensagem pré-formatada para enviar aos seus contatos convidando-os a fazer agendamento online.
            </p>

            <div className="bg-secondary/40 p-3 rounded-lg border border-secondary text-xs text-gray-300 space-y-2">
              <p className="font-semibold text-gray-400 uppercase tracking-wider text-[9px]">Mensagem que será enviada:</p>
              <p className="italic">
                &ldquo;Olá! Agende seu corte ou barba na barbearia *{barbershop.name}* com rapidez pelo nosso link: {publicBookingUrl}&rdquo;
              </p>
            </div>

            <Button onClick={handleShareWhatsapp} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2">
              <Share2Icon className="w-4 h-4" /> Enviar para Contatos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
