"use client"

import { useState } from "react"
import Image from "next/image"
import { Barbershop, Barber } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { toast } from "sonner"
import { Trash2Icon, Users } from "lucide-react"
import { AdminPageHeader } from "./admin-page-header"
import { PhotoUploadField } from "./photo-upload-field"
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
      <AdminPageHeader icon={Users} title="Equipe" description="Cadastre profissionais, fotos e contatos para organizar a agenda da sua barbearia." />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        {/* Formulário de Adicionar Barbeiro */}
        <Card className="h-fit rounded-xl bg-card">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-bold text-primary">Contratar barbeiro</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">Nome do Barbeiro *</label>
                <Input 
                  placeholder="Ex: João da Silva" 
                  value={newBarberName} 
                  onChange={(e) => setNewBarberName(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">E-mail de Login (Opcional)</label>
                <Input 
                  type="email"
                  placeholder="Ex: joao@gmail.com" 
                  value={newBarberEmail} 
                  onChange={(e) => setNewBarberEmail(e.target.value)} 
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">Telefone (Opcional)</label>
                <Input 
                  type="text"
                  placeholder="Ex: 11999998888" 
                  value={newBarberPhone} 
                  onChange={(e) => setNewBarberPhone(e.target.value)} 
                  disabled={isLoading}
                />
              </div>

              <PhotoUploadField label="Foto de perfil" value={newBarberImageUrl} onChange={setNewBarberImageUrl} alt={newBarberName || "Foto do profissional"} disabled={isLoading} />

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? "Cadastrando..." : "Cadastrar Profissional"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Listagem de Equipe */}
        <div className="space-y-3 rounded-xl bg-card p-5 shadow-[0_12px_30px_hsl(var(--foreground)/0.08)] sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-4"><h3 className="text-sm font-extrabold text-foreground">Equipe atual</h3><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">{barbershop.barbers.length}</span></div>

          {barbershop.barbers.map((barber) => (
            <Card key={barber.id} className="bg-muted/45 shadow-none transition-colors hover:bg-secondary/70">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-extrabold text-primary">
                    {barber.imageUrl ? <Image src={barber.imageUrl} alt={barber.name} fill sizes="48px" className="object-cover" /> : barber.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{barber.name}</h4>
                    {barber.email && (
                      <p className="text-[11px] text-muted-foreground">E-mail: {barber.email}</p>
                    )}
                    {barber.phone && (
                      <p className="text-[11px] text-muted-foreground">Tel: {barber.phone}</p>
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
          {barbershop.barbers.length === 0 && <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">Nenhum profissional cadastrado ainda.</p>}
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
