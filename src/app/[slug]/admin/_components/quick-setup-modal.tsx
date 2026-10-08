"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/app/_components/ui/button"
import { Input } from "@/app/_components/ui/input"
import { toast } from "sonner"
import {
  Scissors,
  Sparkles,
  Crown,
  Clock,
  MapPin,
  Phone,
  Store,
  Check,
  CheckCircle2,
  Calendar,
  Layers,
  Flame,
  Award
} from "lucide-react"
import { quickSetupBarbershopAction } from "@/app/_actions/admin-actions"
import { PhotoUploadField } from "./photo-upload-field"

// Logos pré-definidas para escolha rápida por botões clicáveis
const PRESET_LOGOS = [
  {
    id: "classic_barber",
    name: "Barber Pole Retrô",
    url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80",
    badge: "💈 Clássico"
  },
  {
    id: "scissors_gold",
    name: "Tesoura & Navalha Gold",
    url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80",
    badge: "✂️ Premium"
  },
  {
    id: "skull_vintage",
    name: "Vintage Skull Barbershop",
    url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80",
    badge: "💀 Vintage"
  },
  {
    id: "crown_luxury",
    name: "Crown Gentlemen Club",
    url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80",
    badge: "👑 Luxo"
  },
  {
    id: "modern_fade",
    name: "Studio Modern Fade",
    url: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=400&q=80",
    badge: "⚡ Moderno"
  },
  {
    id: "black_white",
    name: "Minimalist Barber Black",
    url: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=400&q=80",
    badge: "🖤 Minimalista"
  }
]

// Catálogo de Serviços rápidos - Beleza / Barbearia
const SERVICE_TEMPLATES = [
  {
    id: "corte_social",
    name: "Corte Social / Tradicional",
    category: "Cabelo",
    price: 35,
    description: "Corte tesoura e máquina com finalização e lavagem rápida.",
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "corte_fade",
    name: "Corte Degradê / Fade",
    category: "Cabelo",
    price: 45,
    description: "Degradê moderno navalhado ou na shaver com alinhamento.",
    imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "barba_terapia",
    name: "Barba Completa (Toalha Quente)",
    category: "Barba",
    price: 35,
    description: "Modelagem, toalha quente aromática e hidratação de barba.",
    imageUrl: "https://images.unsplash.com/photo-1517832606589-7629c3397143?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "pezinho",
    name: "Pezinho & Acabamento",
    category: "Acabamento",
    price: 15,
    description: "Alinhamento de contorno do cabelo e costeletas com navalha.",
    imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "escova",
    name: "Escova & Penteado",
    category: "Cabelo",
    price: 25,
    description: "Lavagem capilar, escovação e modelagem com pomada matte.",
    imageUrl: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "sobrancelha",
    name: "Sobrancelha na Navalha",
    category: "Beleza",
    price: 15,
    description: "Design e limpeza de sobrancelhas masculinas na lâmina.",
    imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "hidratacao",
    name: "Hidratação Profunda",
    category: "Tratamento",
    price: 40,
    description: "Tratamento intensivo de fios com máscara reconstrutora.",
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "selagem",
    name: "Selagem Capilar",
    category: "Tratamento",
    price: 90,
    description: "Alinhamento e redução de volume para fios disciplinados.",
    imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "combo_corte_barba",
    name: "Combo Corte + Barba",
    category: "Combos",
    price: 70,
    description: "Experiência completa de corte de cabelo e barba com toalha quente.",
    imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80"
  }
]

interface QuickSetupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  barbershop: {
    id: string
    name: string
    address: string
    city?: string | null
    state?: string | null
    phones: string[]
    imageUrl: string
    openingHours?: string | null
  }
}

export default function QuickSetupModal({ open, onOpenChange, barbershop }: QuickSetupModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState(barbershop.name || "")
  const [address, setAddress] = useState(barbershop.address || "")
  const [city, setCity] = useState(barbershop.city || "São Paulo")
  const [state, setState] = useState(barbershop.state || "SP")
  const [phone, setPhone] = useState(barbershop.phones?.[0] || "")
  const [selectedLogo, setSelectedLogo] = useState(barbershop.imageUrl || PRESET_LOGOS[0].url)
  const [customLogoUrl, setCustomLogoUrl] = useState("")

  // Horários de trabalho padrão
  const [workDays, setWorkDays] = useState({
    seg: { active: true, start: "09:00", end: "19:00" },
    ter: { active: true, start: "09:00", end: "19:00" },
    qua: { active: true, start: "09:00", end: "19:00" },
    qui: { active: true, start: "09:00", end: "19:00" },
    sex: { active: true, start: "09:00", end: "20:00" },
    sab: { active: true, start: "08:30", end: "19:00" },
    dom: { active: false, start: "09:00", end: "14:00" }
  })

  // Serviços selecionados por botões
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    "corte_fade",
    "corte_social",
    "barba_terapia",
    "pezinho",
    "combo_corte_barba"
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const applyScheduleToAll = (start: string, end: string) => {
    setWorkDays((prev) => ({
      seg: { ...prev.seg, start, end },
      ter: { ...prev.ter, start, end },
      qua: { ...prev.qua, start, end },
      qui: { ...prev.qui, start, end },
      sex: { ...prev.sex, start, end },
      sab: { ...prev.sab, start, end },
      dom: prev.dom
    }))
    toast.success("Horário replicado de Segunda a Sábado!")
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)

      const finalLogo = customLogoUrl.trim() || selectedLogo

      const selectedServicesList = SERVICE_TEMPLATES.filter((s) =>
        selectedServiceIds.includes(s.id)
      ).map((s) => ({
        name: s.name,
        description: s.description,
        price: s.price,
        imageUrl: s.imageUrl
      }))

      await quickSetupBarbershopAction({
        barbershopId: barbershop.id,
        name: name.trim() || barbershop.name,
        address: address.trim() || barbershop.address,
        city,
        state,
        phones: phone ? [phone] : barbershop.phones,
        openingHours: JSON.stringify(workDays),
        imageUrl: finalLogo,
        selectedServices: selectedServicesList
      })

      toast.success("Unidade configurada com sucesso!")
      onOpenChange(false)
    } catch (error: any) {
      toast.error("Não foi possível salvar as configurações da unidade. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border p-6 text-foreground">
        <DialogHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-warning/20 text-warning">
              <Store className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                Configuração Rápida da Unidade
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Selecione a unidade, defina o horário, escolha uma logo e ative os serviços que oferece.
              </DialogDescription>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-2">
            <button
              onClick={() => setStep(1)}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                step === 1
                  ? "bg-warning text-warning-foreground shadow-md shadow-warning/20"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              1. Unidade & Logo
            </button>
            <button
              onClick={() => setStep(2)}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                step === 2
                  ? "bg-warning text-warning-foreground shadow-md shadow-warning/20"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              2. Horários
            </button>
            <button
              onClick={() => setStep(3)}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                step === 3
                  ? "bg-warning text-warning-foreground shadow-md shadow-warning/20"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              3. Serviços (Beleza)
            </button>
          </div>
        </DialogHeader>

        {/* STEP 1: Unidade e Logo */}
        {step === 1 && (
          <div className="space-y-5 py-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-warning" /> Nome da Unidade / Barbearia
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Barbearia Elite - Centro"
                  className="bg-secondary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-warning" /> WhatsApp / Telefone
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="bg-secondary/30"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-warning" /> Endereço Completo
                </label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua das Flores, 123 - Bairro"
                  className="bg-secondary/30"
                />
              </div>
            </div>

            {/* SELEÇÃO DE LOGO EM BOTÕES */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-warning" /> Escolha uma logo
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Selecione um estilo pronto ou envie a logo da sua barbearia.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRESET_LOGOS.map((logo) => {
                  const isSelected = selectedLogo === logo.url && !customLogoUrl
                  return (
                    <button
                      key={logo.id}
                      type="button"
                      onClick={() => {
                        setSelectedLogo(logo.url)
                        setCustomLogoUrl("")
                      }}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center ${
                        isSelected
                          ? "border-warning bg-warning/10 shadow-lg shadow-warning/10 ring-2 ring-warning/50"
                          : "border-border/60 bg-secondary/20 hover:border-warning/40 hover:bg-secondary/40"
                      }`}
                    >
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-border shadow-inner">
                        <Image
                          src={logo.url}
                          alt={logo.name}
                          fill
                          sizes="64px"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground">{logo.name}</span>
                      <span className="text-[10px] text-warning font-medium px-2 py-0.5 rounded-full bg-warning/10">
                        {logo.badge}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-warning text-warning-foreground flex items-center justify-center font-bold">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="pt-2">
                <PhotoUploadField label="Logo personalizada" value={customLogoUrl} onChange={setCustomLogoUrl} alt={barbershop.name} helperText="PNG ou JPG, até 4 MB" />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                onClick={() => setStep(2)}
                className="bg-warning hover:bg-warning/85 text-warning-foreground font-bold gap-2"
              >
                Próximo: Horários <Clock className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Horários de Trabalho */}
        {step === 2 && (
          <div className="space-y-5 py-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-warning/10 border border-warning/20">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-warning uppercase tracking-wide">
                  Atalho Rápido
                </span>
                <p className="text-xs text-muted-foreground">
                  Quer abrir das 09:00 às 19:00 em todos os dias úteis?
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => applyScheduleToAll("09:00", "19:00")}
                className="bg-warning hover:bg-warning/85 text-warning-foreground font-bold text-xs"
              >
                Replicar Padrão (09h - 19h)
              </Button>
            </div>

            <div className="space-y-2">
              {[
                { key: "seg", label: "Segunda-feira" },
                { key: "ter", label: "Terça-feira" },
                { key: "qua", label: "Quarta-feira" },
                { key: "qui", label: "Quinta-feira" },
                { key: "sex", label: "Sexta-feira" },
                { key: "sab", label: "Sábado" },
                { key: "dom", label: "Domingo" }
              ].map(({ key, label }) => {
                const day = workDays[key as keyof typeof workDays]
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      day.active
                        ? "border-border bg-secondary/20"
                        : "border-border/40 bg-secondary/5 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={day.active}
                        id={`check-${key}`}
                        onChange={(e) =>
                          setWorkDays((prev) => ({
                            ...prev,
                            [key]: { ...day, active: e.target.checked }
                          }))
                        }
                        className="w-4 h-4 rounded border-border accent-warning cursor-pointer"
                      />
                      <label
                        htmlFor={`check-${key}`}
                        className="text-xs font-semibold text-foreground cursor-pointer select-none"
                      >
                        {label}
                      </label>
                    </div>

                    {day.active ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={day.start}
                          onChange={(e) =>
                            setWorkDays((prev) => ({
                              ...prev,
                              [key]: { ...day, start: e.target.value }
                            }))
                          }
                          className="h-8 w-24 text-xs font-bold bg-background text-center"
                        />
                        <span className="text-xs text-muted-foreground font-semibold">até</span>
                        <Input
                          type="time"
                          value={day.end}
                          onChange={(e) =>
                            setWorkDays((prev) => ({
                              ...prev,
                              [key]: { ...day, end: e.target.value }
                            }))
                          }
                          className="h-8 w-24 text-xs font-bold bg-background text-center"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic font-medium">
                        Fechado
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between pt-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="text-xs"
              >
                Voltar
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-warning hover:bg-warning/85 text-warning-foreground font-bold gap-2 text-xs"
              >
                Próximo: Catálogo de Serviços <Scissors className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Escolha de Serviços Rápidos em Botões */}
        {step === 3 && (
          <div className="space-y-5 py-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-warning" />
                  Catálogo de Serviços - Beleza & Barbearia
                </h4>
                <span className="text-xs font-bold text-warning">
                  {selectedServiceIds.length} selecionados
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Selecione os serviços que você oferece para adicioná-los ao catálogo.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {SERVICE_TEMPLATES.map((item) => {
                const isSelected = selectedServiceIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleService(item.id)}
                    className={`relative p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? "border-warning bg-warning/10 shadow-md shadow-warning/10 ring-1 ring-warning"
                        : "border-border/60 bg-secondary/15 hover:border-warning/40 hover:bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-warning uppercase tracking-wide">
                          {item.category}
                        </span>
                        <h5 className="font-bold text-sm text-foreground leading-tight">
                          {item.name}
                        </h5>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? "bg-warning text-warning-foreground"
                            : "border border-muted-foreground/40 text-transparent"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-xs text-muted-foreground font-medium">Sugerido:</span>
                      <strong className="text-sm font-bold text-success">
                        R$ {item.price.toFixed(2).replace(".", ",")}
                      </strong>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="text-xs"
              >
                Voltar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="bg-warning hover:bg-warning/85 text-warning-foreground font-bold gap-2 text-xs h-10 px-6 shadow-lg shadow-warning/20"
              >
                {isSubmitting ? (
                  "Salvando configurações..."
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Concluir e Salvar Unidade
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
