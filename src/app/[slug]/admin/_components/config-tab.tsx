"use client"

import { useState } from "react"
import { Barbershop } from "@prisma/client"
import { Card, CardContent } from "@/app/_components/ui/card"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import { toast } from "sonner"
import { Settings } from "lucide-react"
import { AdminPageHeader } from "./admin-page-header"
import { PhotoUploadField } from "./photo-upload-field"

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
  const [shopWelcomeMessage, setShopWelcomeMessage] = useState(
    barbershop.welcomeMessage || "",
  )
  const [shopInstagramUrl, setShopInstagramUrl] = useState(
    barbershop.instagramUrl || "",
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !shopName ||
      !shopAddress ||
      !shopPhone ||
      !shopDescription ||
      !shopLogoUrl
    ) {
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
      <AdminPageHeader
        icon={Settings}
        title="Configurações do perfil"
        description="Atualize identidade, endereço e meios de contato da sua barbearia."
      />

      <Card className="border-secondary">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Nome do Estabelecimento *
                </label>
                <Input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Telefone de Contato *
                </label>
                <Input
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Endereço Físico *
              </label>
              <Input
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Cidade
                </label>
                <Input
                  value={shopCity}
                  onChange={(e) => setShopCity(e.target.value)}
                  placeholder="Ex.: Ponta Grossa"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Estado (UF)
                </label>
                <Input
                  value={shopState}
                  onChange={(e) =>
                    setShopState(e.target.value.toUpperCase().slice(0, 2))
                  }
                  placeholder="PR"
                  maxLength={2}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">
                Descrição / Slogan *
              </label>
              <Input
                value={shopDescription}
                onChange={(e) => setShopDescription(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PhotoUploadField
                label="Logo da barbearia"
                value={shopLogoUrl}
                onChange={setShopLogoUrl}
                alt={shopName || "Logo da barbearia"}
                required
                disabled={isLoading}
              />

              <PhotoUploadField
                label="Imagem de destaque"
                value={shopBannerUrl}
                onChange={setShopBannerUrl}
                alt={`Imagem de destaque de ${shopName || "barbearia"}`}
                disabled={isLoading}
                helperText="Opcional. A página pública prioriza o logo da barbearia."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Mensagem de Boas-Vindas
                </label>
                <Input
                  value={shopWelcomeMessage}
                  onChange={(e) => setShopWelcomeMessage(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  Link do Instagram
                </label>
                <Input
                  value={shopInstagramUrl}
                  onChange={(e) => setShopInstagramUrl(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-5">
              <Button
                type="submit"
                size="lg"
                className="min-w-48"
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
