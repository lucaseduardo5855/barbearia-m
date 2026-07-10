"use client"

import { useState } from "react"
import { Barbershop, Barber } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { UploadButton } from "@/app/_lib/uploadthing"
import { toast } from "sonner"
import { PlusIcon, Trash2Icon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog"

interface EquipeTabProps {
  barbershop: Barbershop & {
    barbers: Barber[]
  }
  isLoading: boolean
  onAddBarber: (params: { name: string; imageUrl: string; email?: string; phone?: string }) => Promise<void>
  onDeleteBarber: (barberId: string) => Promise<void>
}

export default function EquipeTab({
  barbershop,
  isLoading,
  onAddBarber,
  onDeleteBarber,
}: EquipeTabProps) {
  // --- Estados do Formulário de Barbeiro ---
  const [newBarberName, setNewBarberName] = useState("")
  const [newBarberImageUrl, setNewBarberImageUrl] = useState("")
  const [newBarberEmail, setNewBarberEmail] = useState("")
  const [newBarberPhone, setNewBarberPhone] = useState("")
  const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBarberName) {
      toast.error("Por favor, preencha o nome do barbeiro.")
      return
    }

    try {
      await onAddBarber({
        name: newBarberName,
        imageUrl: newBarberImageUrl,
        email: newBarberEmail || undefined,
        phone: newBarberPhone || undefined,
      })
      
      // Limpa os campos após o sucesso
      setNewBarberName("")
      setNewBarberImageUrl("")
      setNewBarberEmail("")
      setNewBarberPhone("")
    } catch (err) {
      // O erro já é tratado na action do pai
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Gerenciamento da Equipe</h2>
        <p className="text-xs text-muted-foreground">Cadastre novos barbeiros e profissionais para atender os clientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Adicionar Barbeiro */}
        <Card className="border-secondary h-fit">
          <CardContent className="p-5">
            <h3 className="font-bold text-sm text-primary mb-4 flex items-center gap-1">
              <PlusIcon className="w-4 h-4" /> Contratar Barbeiro
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Nome do Barbeiro *</label>
                <Input 
                  placeholder="Ex: João da Silva" 
                  value={newBarberName} 
                  onChange={(e) => setNewBarberName(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">E-mail de Login (Opcional)</label>
                <Input 
                  type="email"
                  placeholder="Ex: joao@gmail.com" 
                  value={newBarberEmail} 
                  onChange={(e) => setNewBarberEmail(e.target.value)} 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Telefone (Opcional)</label>
                <Input 
                  type="text"
                  placeholder="Ex: 11999998888" 
                  value={newBarberPhone} 
                  onChange={(e) => setNewBarberPhone(e.target.value)} 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Foto de Perfil (Opcional)</label>
                {newBarberImageUrl ? (
                  <div className="relative w-full h-[40px] border border-primary/30 rounded-lg overflow-hidden flex items-center justify-between px-3 bg-primary/5">
                    <span className="text-xs text-primary font-medium truncate max-w-[80%]">Foto enviada!</span>
                    <button 
                      type="button" 
                      onClick={() => setNewBarberImageUrl("")} 
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
                        setNewBarberImageUrl(res[0].url)
                        toast.success("Foto de perfil enviada!")
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
                      button: "bg-primary text-black font-extrabold text-[11px] py-2 w-full rounded-lg hover:bg-primary/95 transition-all cursor-pointer",
                      allowedContent: "text-[8px] text-gray-500 mt-1 text-center"
                    }}
                  />
                )}
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? "Cadastrando..." : "Cadastrar Profissional"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Listagem de Equipe */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-bold text-sm text-gray-200">Equipe Atual ({barbershop.barbers.length})</h3>

          {barbershop.barbers.map((barber) => (
            <Card key={barber.id} className="border-secondary bg-secondary/10">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border border-secondary shrink-0">
                    <img src={barber.imageUrl} alt={barber.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{barber.name}</h4>
                    {barber.email && (
                      <p className="text-[11px] text-gray-400">E-mail: {barber.email}</p>
                    )}
                    {barber.phone && (
                      <p className="text-[11px] text-gray-400">Tel: {barber.phone}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">Profissional ativo para agendamento</p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="icon"
                  className="w-8 h-8 rounded-lg"
                  onClick={() => setBarberToDelete(barber)}
                  disabled={isLoading}
                >
                  <Trash2Icon className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PopUp AlertDialog */}
      <AlertDialog open={!!barberToDelete} onOpenChange={(open) => !open && setBarberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-center">
              Deseja realmente desligar este Profissional?
            </AlertDialogTitle>
            <AlertDialogDescription className="flex items-center justify-center mb-6">
              Tem certeza que deseja remover o barbeiro &quot;{barberToDelete?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-center sm:justify-center gap-3 w-full">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/70 text-destructive-foreground"
              onClick={async () => {
                if (barberToDelete) {
                  await onDeleteBarber(barberToDelete.id)
                  setBarberToDelete(null)
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
