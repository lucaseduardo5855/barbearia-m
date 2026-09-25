"use client"

import { useState } from "react"
import { Barbershop, BarbershopService } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { UploadButton } from "@/app/_lib/uploadthing"
import { toast } from "sonner"
import { PlusIcon, Trash2Icon } from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ServicosTabProps {
  barbershop: Barbershop & {
    services: BarbershopService[]
  }
  isLoading: boolean
  onAddService: (params: {
    name: string
    price: number
    description: string
    imageUrl: string
  }) => Promise<void>
  onDeleteService: (serviceId: string) => Promise<void>
}

export default function ServicosTab({
  barbershop,
  isLoading,
  onAddService,
  onDeleteService,
}: ServicosTabProps) {
  // --- Estados do Formulário de Serviço (Isolados aqui!) ---
  const [newServiceName, setNewServiceName] = useState("")
  const [newServicePrice, setNewServicePrice] = useState("")
  const [newServiceDescription, setNewServiceDescription] = useState("")
  const [newServiceImageUrl, setNewServiceImageUrl] = useState("")
  const [serviceToDelete, setServiceToDelete] = useState<BarbershopService | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServiceName || !newServicePrice || !newServiceDescription || !newServiceImageUrl) {
      toast.error("Por favor, preencha todos os campos do serviço.")
      return
    }

    try {
      await onAddService({
        name: newServiceName,
        price: Number(newServicePrice),
        description: newServiceDescription,
        imageUrl: newServiceImageUrl,
      })
      
      // Limpa os campos após sucesso
      setNewServiceName("")
      setNewServicePrice("")
      setNewServiceDescription("")
      setNewServiceImageUrl("")
    } catch (err) {
      // O erro já é tratado na action do pai
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Gerenciamento de Serviços</h2>
        <p className="text-xs text-muted-foreground">Cadastre novos tipos de serviço ou gerencie os preços atuais.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Formulário de Adicionar Serviço */}
        <Card className="border-secondary h-fit">
          <CardContent className="p-6">
            <h3 className="font-bold text-sm text-primary mb-4 flex items-center gap-1">
              <PlusIcon className="w-4 h-4" /> Novo Serviço
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Nome do Serviço</label>
                <Input 
                  placeholder="Ex: Luzes / Nevou" 
                  value={newServiceName} 
                  onChange={(e) => setNewServiceName(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Preço (R$)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 80.00" 
                  value={newServicePrice} 
                  onChange={(e) => setNewServicePrice(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Descrição Curta</label>
                <Input 
                  placeholder="Ex: Descoloração platinada completa" 
                  value={newServiceDescription} 
                  onChange={(e) => setNewServiceDescription(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Imagem do Serviço *</label>
                {newServiceImageUrl ? (
                  <div className="relative w-full h-[40px] border border-primary/30 rounded-lg overflow-hidden flex items-center justify-between px-3 bg-primary/5">
                    <span className="text-xs text-primary font-medium truncate max-w-[80%]">Foto enviada!</span>
                    <button 
                      type="button" 
                      onClick={() => setNewServiceImageUrl("")} 
                      className="bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      disabled={isLoading}
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setNewServiceImageUrl(res[0].url)
                        toast.success("Foto do serviço enviada!")
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Erro: ${error.message}`)
                    }}
                    content={{
                      button({ ready }) {
                        if (ready) return "Enviar Foto"
                        return "Carregando..."
                      },
                      allowedContent: "PNG, JPG (até 4MB)"
                    }}
                    appearance={{
                      button: "border border-border bg-muted text-foreground font-medium text-xs py-2.5 w-full rounded-lg hover:bg-secondary transition-colors cursor-pointer",
                      allowedContent: "text-[8px] text-gray-500 mt-1 text-center"
                    }}
                  />
                )}
              </div>

              <Button type="submit" className="w-full mt-2 rounded-lg" disabled={isLoading}>
                {isLoading ? "Cadastrando..." : "Cadastrar Serviço"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Listagem de Serviços Atuais */}
        <div className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="font-bold text-sm text-gray-200">Serviços Cadastrados ({barbershop.services.length})</h3>

          {barbershop.services.map((service) => (
            <Card key={service.id} className="border-border bg-background transition-colors hover:bg-muted/40">
              <CardContent className="flex min-h-[92px] items-center justify-between gap-4 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-secondary shrink-0">
                    <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{service.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                    <span className="text-sm text-foreground font-semibold">R$ {Number(service.price).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="icon"
                  className="w-8 h-8 rounded-lg"
                  onClick={() => setServiceToDelete(service)}
                  disabled={isLoading}
                >
                  <Trash2Icon className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <AlertDialog open={Boolean(serviceToDelete)} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent className="w-[92%] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
            <AlertDialogDescription>O serviço “{serviceToDelete?.name}” será removido da lista de agendamentos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
              if (!serviceToDelete) return
              await onDeleteService(serviceToDelete.id)
              setServiceToDelete(null)
            }}>Excluir serviço</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
