"use client"

import { useState } from "react"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/app/_components/ui/avatar"
import { Barbershop, Barber } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { toast } from "sonner"
import { Percent, RefreshCw, Trash2Icon, Users } from "lucide-react"
import { updateBarberCommissionRateAction } from "@/app/_actions/admin-actions"
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
  onAddBarber: (params: {
    name: string
    imageUrl: string
    email?: string
    phone?: string
  }) => Promise<void>
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
  const [commissionDrafts, setCommissionDrafts] = useState<
    Record<string, number>
  >(() =>
    Object.fromEntries(
      barbershop.barbers.map((barber) => [
        barber.id,
        Number(barber.commissionRate ?? 0),
      ]),
    ),
  )
  const [savingCommissionId, setSavingCommissionId] = useState<string | null>(
    null,
  )

  const handleSaveCommission = async (barber: Barber) => {
    const commissionRate = commissionDrafts[barber.id] ?? 0
    if (commissionRate < 0 || commissionRate > 100) {
      toast.error("A comissão deve ficar entre 0% e 100%.")
      return
    }
    try {
      setSavingCommissionId(barber.id)
      await updateBarberCommissionRateAction({
        barbershopId: barbershop.id,
        barberId: barber.id,
        commissionRate,
      })
      toast.success(`Comissão de ${barber.name} atualizada.`)
    } catch (error: any) {
      toast.error(error.message || "Não foi possível atualizar a comissão.")
    } finally {
      setSavingCommissionId(null)
    }
  }

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
      <AdminPageHeader
        icon={Users}
        title="Equipe"
        description="Cadastre profissionais, fotos e contatos para organizar a agenda da sua barbearia."
      />

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
        {/* Formulário de Adicionar Barbeiro */}
        <Card className="h-fit rounded-xl bg-card">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-bold text-primary">
              Contratar barbeiro
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Nome do Barbeiro *
                </label>
                <Input
                  placeholder="Ex: João da Silva"
                  value={newBarberName}
                  onChange={(e) => setNewBarberName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  E-mail de Login (Opcional)
                </label>
                <Input
                  type="email"
                  placeholder="Ex: joao@gmail.com"
                  value={newBarberEmail}
                  onChange={(e) => setNewBarberEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Telefone (Opcional)
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 11999998888"
                  value={newBarberPhone}
                  onChange={(e) => setNewBarberPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <PhotoUploadField
                label="Foto de perfil"
                value={newBarberImageUrl}
                onChange={setNewBarberImageUrl}
                alt={newBarberName || "Foto do profissional"}
                disabled={isLoading}
              />

              <Button
                type="submit"
                className="mt-2 w-full"
                disabled={isLoading}
              >
                {isLoading ? "Cadastrando..." : "Cadastrar Profissional"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Listagem de Equipe */}
        <div className="space-y-3 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-sm font-extrabold text-foreground">
              Equipe atual
            </h3>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {barbershop.barbers.length}
            </span>
          </div>

          {barbershop.barbers.map((barber) => (
            <Card
              key={barber.id}
              className="bg-muted/45 shadow-none transition-colors hover:bg-secondary/70"
            >
              <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src={barber.imageUrl} alt={barber.name} />
                    <AvatarFallback>
                      {barber.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-semibold">{barber.name}</h4>
                    {barber.email && (
                      <p className="text-[11px] text-muted-foreground">
                        E-mail: {barber.email}
                      </p>
                    )}
                    {barber.phone && (
                      <p className="text-[11px] text-muted-foreground">
                        Tel: {barber.phone}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Profissional ativo para agendamento
                    </p>
                  </div>
                </div>

                <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
                  <div className="min-w-0 flex-1 sm:w-32">
                    <label
                      htmlFor={`commission-${barber.id}`}
                      className="mb-1 flex items-center gap-1 text-muted-foreground"
                    >
                      <Percent className="size-3.5" /> Comissão
                    </label>
                    <Input
                      id={`commission-${barber.id}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={commissionDrafts[barber.id] ?? 0}
                      onChange={(event) =>
                        setCommissionDrafts((current) => ({
                          ...current,
                          [barber.id]: Number(event.target.value),
                        }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSaveCommission(barber)}
                    disabled={savingCommissionId === barber.id}
                    aria-label={`Atualizar comissão de ${barber.name}`}
                  >
                    <RefreshCw className="size-4" />{" "}
                    {savingCommissionId === barber.id
                      ? "Atualizando..."
                      : "Atualizar comissão"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setBarberToDelete(barber)}
                    disabled={isLoading}
                    aria-label={`Remover ${barber.name}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {barbershop.barbers.length === 0 && (
            <p className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum profissional cadastrado ainda.
            </p>
          )}
        </div>
      </div>

      {/* PopUp AlertDialog */}
      <AlertDialog
        open={!!barberToDelete}
        onOpenChange={(open) => !open && setBarberToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center justify-center">
              Deseja realmente desligar este Profissional?
            </AlertDialogTitle>
            <AlertDialogDescription className="mb-6 flex items-center justify-center">
              Tem certeza que deseja remover o barbeiro &quot;
              {barberToDelete?.name}&quot;?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex w-full flex-row justify-center gap-3 sm:justify-center">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/70"
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
