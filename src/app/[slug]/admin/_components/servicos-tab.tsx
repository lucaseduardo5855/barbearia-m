"use client"

import { useState } from "react"
import Image from "next/image"
import { Barbershop, BarbershopService } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { toast } from "sonner"
import { Plus, Scissors, Trash2 } from "lucide-react"
import { AdminPageHeader } from "./admin-page-header"
import { PhotoUploadField } from "./photo-upload-field"
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
      <AdminPageHeader icon={Scissors} title="Serviços" description="Cadastre os serviços da sua barbearia e mantenha preços, descrição e foto em um único lugar." />

      <div className="grid w-full grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]">
        {/* Formulário de Adicionar Serviço */}
        <Card className="h-fit rounded-2xl border border-border bg-card shadow-none">
          <CardContent className="p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-foreground">
              <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary"><Plus className="size-4" /></span> Novo serviço
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">Nome do Serviço</label>
                <Input 
                  placeholder="Ex: Luzes / Nevou" 
                  value={newServiceName} 
                  onChange={(e) => setNewServiceName(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">Preço (R$)</label>
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
                <label className="text-[10px] text-muted-foreground font-bold uppercase">Descrição Curta</label>
                <Input 
                  placeholder="Ex: Descoloração platinada completa" 
                  value={newServiceDescription} 
                  onChange={(e) => setNewServiceDescription(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>

              <PhotoUploadField label="Foto do serviço" value={newServiceImageUrl} onChange={setNewServiceImageUrl} alt={newServiceName || "Foto do serviço"} required disabled={isLoading} />

              <Button type="submit" className="w-full mt-2 rounded-lg" disabled={isLoading}>
                {isLoading ? "Cadastrando..." : "Cadastrar Serviço"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Listagem de Serviços Atuais */}
        <div className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-4"><h3 className="text-sm font-extrabold text-foreground">Serviços cadastrados</h3><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">{barbershop.services.length}</span></div>

          <div className="mt-3 space-y-2">
          {barbershop.services.map((service) => (
            <Card key={service.id} className="bg-muted/45 shadow-none transition-colors hover:bg-secondary/70">
              <CardContent className="flex min-h-[92px] items-center justify-between gap-4 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    <Image src={service.imageUrl} alt={service.name} fill sizes="48px" className="object-cover" />
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
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {barbershop.services.length === 0 && <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>}
          </div>
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
