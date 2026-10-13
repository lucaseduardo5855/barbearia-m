"use client"

import { formatBRL } from "@/lib/formatters"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
  Award,
} from "lucide-react"
import { quickSetupBarbershopAction } from "@/app/_actions/admin-actions"
import { PhotoUploadField } from "./photo-upload-field"

// Logos pré-definidas para escolha rápida por botões clicáveis
const PRESET_LOGOS = [
  {
    id: "classic_barber",
    name: "Barber Pole Retrô",
    url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80",
    badge: "💈 Clássico",
  },
  {
    id: "scissors_gold",
    name: "Tesoura & Navalha Gold",
    url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=400&q=80",
    badge: "✂️ Premium",
  },
  {
    id: "skull_vintage",
    name: "Vintage Skull Barbershop",
    url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80",
    badge: "💀 Vintage",
  },
  {
    id: "crown_luxury",
    name: "Crown Gentlemen Club",
    url: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&q=80",
    badge: "👑 Luxo",
  },
  {
    id: "modern_fade",
    name: "Studio Modern Fade",
    url: "https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=400&q=80",
    badge: "⚡ Moderno",
  },
  {
    id: "black_white",
    name: "Minimalist Barber Black",
    url: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=400&q=80",
    badge: "🖤 Minimalista",
  },
]

// Catálogo de Serviços rápidos - Beleza / Barbearia
const SERVICE_TEMPLATES = [
  {
    id: "corte_social",
    name: "Corte Social / Tradicional",
    category: "Cabelo",
    price: 35,
    description: "Corte tesoura e máquina com finalização e lavagem rápida.",
    imageUrl:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "corte_fade",
    name: "Corte Degradê / Fade",
    category: "Cabelo",
    price: 45,
    description: "Degradê moderno navalhado ou na shaver com alinhamento.",
    imageUrl:
      "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "barba_terapia",
    name: "Barba Completa (Toalha Quente)",
    category: "Barba",
    price: 35,
    description: "Modelagem, toalha quente aromática e hidratação de barba.",
    imageUrl:
      "https://images.unsplash.com/photo-1517832606589-7629c3397143?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pezinho",
    name: "Pezinho & Acabamento",
    category: "Acabamento",
    price: 15,
    description: "Alinhamento de contorno do cabelo e costeletas com navalha.",
    imageUrl:
      "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "escova",
    name: "Escova & Penteado",
    category: "Cabelo",
    price: 25,
    description: "Lavagem capilar, escovação e modelagem com pomada matte.",
    imageUrl:
      "https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "sobrancelha",
    name: "Sobrancelha na Navalha",
    category: "Beleza",
    price: 15,
    description: "Design e limpeza de sobrancelhas masculinas na lâmina.",
    imageUrl:
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "hidratacao",
    name: "Hidratação Profunda",
    category: "Tratamento",
    price: 40,
    description: "Tratamento intensivo de fios com máscara reconstrutora.",
    imageUrl:
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "selagem",
    name: "Selagem Capilar",
    category: "Tratamento",
    price: 90,
    description: "Alinhamento e redução de volume para fios disciplinados.",
    imageUrl:
      "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "combo_corte_barba",
    name: "Combo Corte + Barba",
    category: "Combos",
    price: 70,
    description:
      "Experiência completa de corte de cabelo e barba com toalha quente.",
    imageUrl:
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
  },
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

export default function QuickSetupModal({
  open,
  onOpenChange,
  barbershop,
}: QuickSetupModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState(barbershop.name || "")
  const [address, setAddress] = useState(barbershop.address || "")
  const [city, setCity] = useState(barbershop.city || "São Paulo")
  const [state, setState] = useState(barbershop.state || "SP")
  const [phone, setPhone] = useState(barbershop.phones?.[0] || "")
  const [selectedLogo, setSelectedLogo] = useState(
    barbershop.imageUrl || PRESET_LOGOS[0].url,
  )
  const [customLogoUrl, setCustomLogoUrl] = useState("")

  // Horários de trabalho padrão
  const [workDays, setWorkDays] = useState({
    seg: { active: true, start: "09:00", end: "19:00" },
    ter: { active: true, start: "09:00", end: "19:00" },
    qua: { active: true, start: "09:00", end: "19:00" },
    qui: { active: true, start: "09:00", end: "19:00" },
    sex: { active: true, start: "09:00", end: "20:00" },
    sab: { active: true, start: "08:30", end: "19:00" },
    dom: { active: false, start: "09:00", end: "14:00" },
  })

  // Serviços selecionados por botões
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    "corte_fade",
    "corte_social",
    "barba_terapia",
    "pezinho",
    "combo_corte_barba",
  ])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
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
      dom: prev.dom,
    }))
    toast.success("Horário replicado de Segunda a Sábado!")
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)

      const finalLogo = customLogoUrl.trim() || selectedLogo

      const selectedServicesList = SERVICE_TEMPLATES.filter((s) =>
        selectedServiceIds.includes(s.id),
      ).map((s) => ({
        name: s.name,
        description: s.description,
        price: s.price,
        imageUrl: s.imageUrl,
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
        selectedServices: selectedServicesList,
      })

      toast.success("Unidade configurada com sucesso!")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(
        "Não foi possível salvar as configurações da unidade. Tente novamente.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-border bg-card p-6 text-foreground">
        <DialogHeader className="border-b border-border/50 pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-xl bg-primary/20 p-2 text-primary">
              <Store className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="break-words text-lg font-medium text-foreground sm:text-xl">
                Configuração Rápida da Unidade
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Selecione a unidade, defina o horário, escolha uma logo e ative
                os serviços que oferece.
              </DialogDescription>
            </div>
          </div>

          {/* Stepper Tabs */}
          <div className="mt-4 grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                step === 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              1. Unidade & Logo
            </button>
            <button
              onClick={() => setStep(2)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                step === 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              2. Horários
            </button>
            <button
              onClick={() => setStep(3)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                step === 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Scissors className="h-3.5 w-3.5" />
              3. Serviços (Beleza)
            </button>
          </div>
        </DialogHeader>

        {/* STEP 1: Unidade e Logo */}
        {step === 1 && (
          <div className="animate-in fade-in space-y-5 py-4 duration-200">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Store className="h-3.5 w-3.5 text-primary" /> Nome da Unidade
                  / Barbearia
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Barbearia Elite - Centro"
                  className="bg-secondary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" /> WhatsApp /
                  Telefone
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="bg-secondary/30"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Endereço
                  Completo
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
            <div className="space-y-3 border-t border-border/40 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" /> Escolha uma
                    logo
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Selecione um estilo pronto ou envie a logo da sua barbearia.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                      className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-2 ring-primary/50"
                          : "border-border/60 bg-secondary/20 hover:border-primary/40 hover:bg-secondary/40"
                      }`}
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border shadow-inner">
                        <Image
                          src={logo.url}
                          alt={logo.name}
                          fill
                          sizes="64px"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {logo.name}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {logo.badge}
                      </span>
                      {isSelected && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="pt-2">
                <PhotoUploadField
                  label="Logo personalizada"
                  value={customLogoUrl}
                  onChange={setCustomLogoUrl}
                  alt={barbershop.name}
                  helperText="PNG ou JPG, até 4 MB"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                onClick={() => setStep(2)}
                className="gap-2 bg-primary font-bold text-primary-foreground hover:bg-primary/85"
              >
                Próximo: Horários <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Horários de Trabalho */}
        {step === 2 && (
          <div className="animate-in fade-in space-y-5 py-4 duration-200">
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 p-3 sm:flex-row sm:items-center">
              <div className="space-y-0.5">
                <span className="text-xs font-bold uppercase tracking-wide text-primary">
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
                className="bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/85"
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
                { key: "dom", label: "Domingo" },
              ].map(({ key, label }) => {
                const day = workDays[key as keyof typeof workDays]
                return (
                  <div
                    key={key}
                    className={`flex flex-col items-stretch gap-3 rounded-xl border p-3 transition-all sm:flex-row sm:items-center sm:justify-between ${
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
                            [key]: { ...day, active: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 cursor-pointer rounded border-border accent-primary"
                      />
                      <label
                        htmlFor={`check-${key}`}
                        className="cursor-pointer select-none text-xs font-semibold text-foreground"
                      >
                        {label}
                      </label>
                    </div>

                    {day.active ? (
                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                        <Input
                          type="time"
                          value={day.start}
                          onChange={(e) =>
                            setWorkDays((prev) => ({
                              ...prev,
                              [key]: { ...day, start: e.target.value },
                            }))
                          }
                          className="h-11 w-full min-w-0 bg-background px-1 text-center text-sm sm:w-36 sm:px-3"
                        />
                        <span className="text-xs font-semibold text-muted-foreground">
                          até
                        </span>
                        <Input
                          type="time"
                          value={day.end}
                          onChange={(e) =>
                            setWorkDays((prev) => ({
                              ...prev,
                              [key]: { ...day, end: e.target.value },
                            }))
                          }
                          className="h-11 w-full min-w-0 bg-background px-1 text-center text-sm sm:w-36 sm:px-3"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-medium italic text-muted-foreground">
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
                className="gap-2 bg-primary text-xs font-bold text-primary-foreground hover:bg-primary/85"
              >
                Próximo: Catálogo de Serviços <Scissors className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Escolha de Serviços Rápidos em Botões */}
        {step === 3 && (
          <div className="animate-in fade-in space-y-5 py-4 duration-200">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                  <Scissors className="h-4 w-4 text-primary" />
                  Catálogo de Serviços - Beleza & Barbearia
                </h4>
                <span className="text-xs font-bold text-primary">
                  {selectedServiceIds.length} selecionados
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Selecione os serviços que você oferece para adicioná-los ao
                catálogo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {SERVICE_TEMPLATES.map((item) => {
                const isSelected = selectedServiceIds.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleService(item.id)}
                    className={`relative flex flex-col justify-between gap-2.5 rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-md shadow-primary/10 ring-1 ring-primary"
                        : "border-border/60 bg-secondary/15 hover:border-primary/40 hover:bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                          {item.category}
                        </span>
                        <h5 className="text-sm font-bold leading-tight text-foreground">
                          {item.name}
                        </h5>
                      </div>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "border border-muted-foreground/40 text-transparent"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                    </div>

                    <p className="line-clamp-2 text-[11px] text-muted-foreground">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between border-t border-border/40 pt-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Sugerido:
                      </span>
                      <strong className="text-sm font-bold text-success">
                        {formatBRL(item.price)}
                      </strong>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-4">
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
                className="h-10 gap-2 bg-primary px-6 text-xs font-bold text-primary-foreground hover:bg-primary/85"
              >
                {isSubmitting ? (
                  "Salvando configurações..."
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
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
