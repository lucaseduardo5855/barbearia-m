"use client"

import { useState } from "react"
import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { toast } from "sonner"

interface ConfigTabProps {
  barbershop: Barbershop
  isLoading: boolean
  onUpdateConfig: (params: {
    name: string
    address: string
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

            <div className="space-y-1">
              <label className="text-xs text-gray-300 font-semibold">Descrição / Slogan *</label>
              <Input value={shopDescription} onChange={(e) => setShopDescription(e.target.value)} required disabled={isLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold">URL do Logo (Logo Redonda) *</label>
                <Input value={shopLogoUrl} onChange={(e) => setShopLogoUrl(e.target.value)} required disabled={isLoading} />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-300 font-semibold">URL do Banner (Imagem Superior)</label>
                <Input value={shopBannerUrl} onChange={(e) => setShopBannerUrl(e.target.value)} disabled={isLoading} />
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

            <Button type="submit" className="w-full py-5 font-bold mt-2" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
