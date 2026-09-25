"use client"

import { useState } from "react"
import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { toast } from "sonner"
import { UploadButton } from "@/app/_lib/uploadthing"

interface ConfigTabProps {
  barbershop: Barbershop
  isLoading: boolean
  onUpdateConfig: (params: {
    name: string
    address: string
    city?: string | null
    state?: string | null
    phones: string[]
    description: string
    imageUrl: string
    bannerUrl?: string | null
    welcomeMessage?: string | null
    instagramUrl?: string | null
  }) => Promise<void>
}

export default function ConfigTab({
  barbershop,
  isLoading,
  onUpdateConfig,
}: ConfigTabProps) {
  // --- Estados do Formulário de Configuração (Isolados aqui!) ---
  const [shopName, setShopName] = useState(barbershop.name)
  const [shopAddress, setShopAddress] = useState(barbershop.address)
  const [shopCity, setShopCity] = useState(barbershop.city || "")
  const [shopState, setShopState] = useState(barbershop.state || "")
  const [shopPhone, setShopPhone] = useState(barbershop.phones[0] || "")
  const [shopDescription, setShopDescription] = useState(barbershop.description)
  const [shopLogoUrl, setShopLogoUrl] = useState(barbershop.imageUrl)
  const [shopBannerUrl, setShopBannerUrl] = useState(barbershop.bannerUrl || "")
  const [shopWelcomeMessage, setShopWelcomeMessage] = useState(barbershop.welcomeMessage || "")
  const [shopInstagramUrl, setShopInstagramUrl] = useState(barbershop.instagramUrl || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopName || !shopAddress || !shopPhone || !shopDescription || !shopLogoUrl) {
      toast.error("Por favor, preencha todos os campos obrigatórios (*).")
      return
    }

    try {
      await onUpdateConfig({
        name: shopName,
        address: shopAddress,
        city: shopCity || null,
        state: shopState || null,
        phones: [shopPhone],
        description: shopDescription,
        imageUrl: shopLogoUrl,
        bannerUrl: shopBannerUrl || null,
        welcomeMessage: shopWelcomeMessage || null,
        instagramUrl: shopInstagramUrl || null,
      })
    } catch (err) {
      // O erro já é tratado no componente pai
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Configurações do Perfil</h2>
        <p className="text-xs text-muted-foreground">Atualize a identidade visual e informações de contato da sua barbearia.</p>
      </div>

      <Card className="border-secondary">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold">Nome do Estabelecimento *</label>
                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} required disabled={isLoading} />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold">Telefone de Contato *</label>
                <Input value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} required disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-300 font-semibold">Endereço Físico *</label>
              <Input value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} required disabled={isLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold">Cidade</label>
                <Input value={shopCity} onChange={(e) => setShopCity(e.target.value)} placeholder="Ex.: Ponta Grossa" disabled={isLoading} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold">Estado (UF)</label>
                <Input value={shopState} onChange={(e) => setShopState(e.target.value.toUpperCase().slice(0, 2))} placeholder="PR" maxLength={2} disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-300 font-semibold">Descrição / Slogan *</label>
              <Input value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} required disabled={isLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold">Logo da barbearia *</label>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  {shopLogoUrl && <p className="mb-2 truncate text-xs text-muted-foreground">Logo selecionado</p>}
                  <UploadButton endpoint="imageUploader" onClientUploadComplete={(res) => { if (res?.[0]) { setShopLogoUrl(res[0].url); toast.success("Logo enviado!") } }} onUploadError={(error) => { toast.error(error.message) }} content={{ button: ({ ready }) => ready ? "Selecionar logo" : "Carregando...", allowedContent: "PNG ou JPG até 4MB" }} appearance={{ button: "h-9 w-full rounded-md border border-border bg-background text-xs font-medium text-foreground hover:bg-muted", allowedContent: "mt-2 text-center text-[10px] text-muted-foreground" }} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold">Banner superior</label>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  {shopBannerUrl && <p className="mb-2 truncate text-xs text-muted-foreground">Banner selecionado</p>}
                  <UploadButton endpoint="imageUploader" onClientUploadComplete={(res) => { if (res?.[0]) { setShopBannerUrl(res[0].url); toast.success("Banner enviado!") } }} onUploadError={(error) => { toast.error(error.message) }} content={{ button: ({ ready }) => ready ? "Selecionar banner" : "Carregando...", allowedContent: "PNG ou JPG até 4MB" }} appearance={{ button: "h-9 w-full rounded-md border border-border bg-background text-xs font-medium text-foreground hover:bg-muted", allowedContent: "mt-2 text-center text-[10px] text-muted-foreground" }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold">Mensagem de Boas-Vindas</label>
                <Input value={shopWelcomeMessage} onChange={(e) => setShopWelcomeMessage(e.target.value)} disabled={isLoading} />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold">Link do Instagram</label>
                <Input value={shopInstagramUrl} onChange={(e) => setShopInstagramUrl(e.target.value)} disabled={isLoading} />
              </div>
            </div>

            <div className="flex justify-center"><Button type="submit" size="sm" className="mt-2 rounded-lg px-5 font-medium" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Configurações"}
            </Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
