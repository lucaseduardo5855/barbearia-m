"use client"
import { MoneyInput } from "@/components/ui/money-input"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/app/_components/ui/input"
import { Button } from "@/app/_components/ui/button"
import {
  registerBarbershop,
  getOwnedBarbershop,
} from "@/app/_actions/register-barbershop"
import { toast } from "sonner"
import { BrandLogo } from "@/app/_components/brand-logo"
import {
  CheckIcon,
  UserIcon,
  UsersIcon,
  BuildingIcon,
  StoreIcon,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react"
import ProfileCard from "@/app/_components/profilecard"
import { PhotoUploadField } from "@/app/[slug]/admin/_components/photo-upload-field"
import { defaultOpeningDays } from "@/lib/opening-hours"
import { registrationSchema } from "@/lib/registration-schema"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import SignInDialog from "@/app/_components/sign-in-dialong"
import { TrialPlanCard } from "./_components/trial-plan-card"

export default function RegisterBarbershopPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loginOpen, setLoginOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [existingSlug, setExistingSlug] = useState<string | null>(null)
  useEffect(() => {
    if (!session?.user) return
    let active = true
    void getOwnedBarbershop()
      .then((shop) => {
        if (active && shop) {
          setExistingSlug(shop.slug)
          setErrorMessage(
            "Esta conta já possui a barbearia " +
              shop.name +
              ". Abra seu painel para atualizar os dados.",
          )
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [session?.user])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Controle de passos (1: Perfil, 2: Dados Básicos, 3: Localização, 4: Serviços, 5: Expediente, 6: Convite)
  const [step, setStep] = useState(1)

  // --- ESTADOS DO FORMULÁRIO ---
  // Passo 1: Perfil
  const [businessProfile, setBusinessProfile] = useState<
    "alone" | "team" | "small" | "medium" | ""
  >("")
  const [heardFrom, setHeardFrom] = useState("")

  // Passo 2: Sobre o Negócio
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [instagramUrl, setInstagramUrl] = useState("")

  // Passo 3: Localização
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")

  // Passo 4: Serviços sugeridos
  const [services, setServices] = useState([
    { name: "Corte de cabelo", price: "40.00", description: "" },
    { name: "Barba", price: "30.00", description: "" },
    { name: "Sobrancelha", price: "20.00", description: "" },
  ])
  const [openingHours, setOpeningHours] = useState(
    defaultOpeningDays.map((day) => ({ ...day })),
  )
  const updateService = (
    index: number,
    field: "name" | "price",
    value: string,
  ) =>
    setServices((current) =>
      current.map((service, i) =>
        i === index ? { ...service, [field]: value } : service,
      ),
    )

  // Passo 6: Convite
  const [barberName, setBarberName] = useState("")
  const [barberEmail, setBarberEmail] = useState("")

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (!session?.user) {
      setLoginOpen(true)
      return
    }
    setErrorMessage("")
    setExistingSlug(null)
    const payload = {
      name,
      address,
      phones: [phone],
      description,
      imageUrl,
      welcomeMessage: welcomeMessage || undefined,
      instagramUrl: instagramUrl || undefined,
      services,
      openingHours,
      barberName: barberName || undefined,
      barberEmail: barberEmail || undefined,
    }
    const parsed = registrationSchema.safeParse(payload)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      const message = issue.message
      setErrorMessage(message)
      toast.error(message)
      const field = issue.path[0]
      setStep(
        field === "services"
          ? 4
          : field === "openingHours"
            ? 5
            : field === "phones" || field === "address"
              ? 3
              : field === "barberEmail"
                ? 6
                : 2,
      )
      return
    }
    try {
      setIsSubmitting(true)
      const result = await registerBarbershop(payload)
      if (!result.ok) {
        setErrorMessage(result.message)
        setExistingSlug(
          "existingSlug" in result ? result.existingSlug || null : null,
        )
        if ("needsLogin" in result && result.needsLogin) setLoginOpen(true)
        toast.error(result.message)
        return
      }
      toast.success(
        "Barbearia cadastrada! Seu período de testes de 7 dias começou.",
      )
      router.push(`/${result.slug}/admin`)
    } catch {
      const message =
        "Não foi possível conectar ao servidor. Tente novamente; seus dados foram mantidos."
      setErrorMessage(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Lista dos Passos da Barra Lateral (Mapeando com a estética do Gendo)
  const stepsList = [
    {
      id: 1,
      title: "Perfil do Negócio",
      desc: "Escolha o modelo do seu negócio",
    },
    {
      id: 2,
      title: "Sobre o seu negócio",
      desc: "Começando a conhecer sua barbearia",
    },
    {
      id: 3,
      title: "Localização",
      desc: "Endereço e contato do estabelecimento",
    },
    {
      id: 4,
      title: "Serviços sugeridos",
      desc: "Defina os preços básicos de serviços",
    },
    { id: 5, title: "Expediente", desc: "Dias e horários de atendimento" },
    {
      id: 6,
      title: "Concluir",
      desc: "Revise e adicione um profissional, se quiser",
    },
  ]

  return (
    <>
      <div className="grid min-h-screen grid-cols-1 overflow-hidden bg-background text-foreground md:grid-cols-12">
        {/* PAINEL ESQUERDO: Estilo Gendo Roxo Premium */}
        <section className="relative hidden select-none flex-col justify-between border-r border-border bg-card p-12 text-foreground md:col-span-5 md:flex">
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-foreground/20 opacity-0 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 left-10 h-96 w-96 rounded-full bg-foreground/30 opacity-0 blur-2xl" />

          <div className="z-10 space-y-6">
            <BrandLogo />
            <div className="space-y-3 pt-4">
              <h2 className="max-w-sm text-4xl font-extrabold leading-tight tracking-tight">
                Poucos passos para transformar seu negócio
              </h2>
            </div>
          </div>

          {/* Lista de Passos Lateral */}
          <div className="relative z-10 my-auto flex flex-col justify-center py-8 pl-2">
            <div className="space-y-5">
              {stepsList.map((s) => {
                const isActive = step === s.id
                const isCompleted = step > s.id
                return (
                  <div key={s.id} className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-base font-bold transition-all duration-300 ${
                        isCompleted
                          ? "border-primary bg-primary text-primary-foreground"
                          : isActive
                            ? "border-primary bg-primary/10 font-medium text-primary"
                            : "border-foreground/30 bg-transparent text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckIcon className="h-5 w-5 stroke-[3.5]" />
                      ) : (
                        s.id
                      )}
                    </div>

                    <div>
                      <p
                        className={`text-base font-bold leading-tight transition-all duration-300 ${
                          isActive
                            ? "text-foreground"
                            : isCompleted
                              ? "text-foreground/90"
                              : "text-muted-foreground"
                        }`}
                      >
                        {s.title}
                      </p>
                      <p
                        className={`text-xs transition-all duration-300 ${
                          isActive
                            ? "text-muted-foreground"
                            : isCompleted
                              ? "text-muted-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        {s.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="z-10">
            <TrialPlanCard compact />
          </div>
        </section>

        {/* PAINEL DIREITO: Formulário Interativo com as Etapas */}
        <section className="col-span-12 flex flex-col justify-center overflow-y-auto p-6 md:col-span-7 md:p-16">
          <div className="mx-auto w-full max-w-xl space-y-6">
            {/* Header Responsivo para Mobile */}
            <div className="mb-4 flex flex-col items-center text-center md:hidden">
              <BrandLogo />
              <h2 className="text-xl font-bold text-foreground">
                Configurar sua Barbearia
              </h2>
              <span className="mt-2 rounded-full bg-primary/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Passo {step} de 6
              </span>
            </div>

            <div className="md:hidden">
              <TrialPlanCard compact />
            </div>

            {/* Cabeçalho da Etapa Corrente */}
            <div>
              <h3 className="text-2xl font-medium tracking-tight text-foreground">
                {step === 1 && "Com qual perfil você se encaixa?"}
                {step === 2 && "Sobre o seu negócio"}
                {step === 3 && "Onde fica?"}
                {step === 4 && "Serviços sugeridos"}
                {step === 5 && "Horário de funcionamento"}
                {step === 6 && "Tudo pronto para começar"}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {step === 1 &&
                  "Para começar, é importante que você escolha o modelo que mais se encaixa ao seu negócio."}
                {step === 2 &&
                  "Preencha o nome, logo e descrição da sua barbearia para configurarmos sua página."}
                {step === 3 &&
                  "Conte-nos onde é seu negócio. Esta localização posicionará você nas ferramentas de busca."}
                {step === 4 &&
                  "De acordo com o seu negócio, pré-definimos alguns preços e serviços. Você pode ajustá-los."}
                {step === 5 &&
                  "Para finalizar, configure os dias e horários de atendimento da sua barbearia."}
                {step === 6 &&
                  "Confira o cadastro. Você pode adicionar o primeiro profissional agora ou depois pelo painel."}
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-lg border border-border bg-secondary/30 p-4 text-sm"
              >
                <p>{errorMessage}</p>
                {existingSlug && (
                  <Button asChild variant="outline" className="mt-3">
                    <Link href={`/${existingSlug}/admin`}>
                      Abrir meu painel
                    </Link>
                  </Button>
                )}
              </div>
            )}
            <Button asChild variant="ghost" className="gap-2">
              <Link href="/">
                <ArrowLeft className="size-4" /> Voltar ao início
              </Link>
            </Button>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ETAPA 1: ESCOLHA DE PERFIL (Estilo Gendo Cards) */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-300">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Card 1: Trabalho Sozinho */}
                    <ProfileCard
                      id="alone"
                      selectedProfile={businessProfile}
                      onSelect={setBusinessProfile}
                      icon={UserIcon}
                      title="Trabalho Sozinho"
                      description="Atendimento individual"
                    />

                    {/* Card 2: Microempresa */}
                    <ProfileCard
                      id="team"
                      selectedProfile={businessProfile}
                      onSelect={setBusinessProfile}
                      icon={UsersIcon}
                      title="Microempresa"
                      description="Entre 1 a 4 funcionários"
                    />

                    {/* Card 3: Pequena Empresa */}
                    <ProfileCard
                      id="small"
                      selectedProfile={businessProfile}
                      onSelect={setBusinessProfile}
                      icon={StoreIcon}
                      title="Pequena empresa"
                      description="Entre 5 a 10 funcionários"
                    />

                    {/* Card 4: Média / Grande Empresa */}
                    <ProfileCard
                      id="medium"
                      selectedProfile={businessProfile}
                      onSelect={setBusinessProfile}
                      icon={BuildingIcon}
                      title="Média ou Grande Empresa"
                      description="Acima de 10 funcionários"
                    />
                  </div>

                  {/* Campo complementar: Onde nos conheceu? */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Onde nos conheceu?
                    </label>
                    <select
                      value={heardFrom}
                      onChange={(e) => setHeardFrom(e.target.value)}
                      className="w-full rounded-lg border border-secondary bg-secondary/15 px-3 py-3.5 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option
                        value=""
                        disabled
                        hidden
                        className="bg-background text-foreground"
                      >
                        Selecione uma categoria
                      </option>
                      <option
                        value="instagram"
                        className="bg-background text-foreground"
                      >
                        Instagram
                      </option>
                      <option
                        value="facebook"
                        className="bg-background text-foreground"
                      >
                        Facebook
                      </option>
                      <option
                        value="google"
                        className="bg-background text-foreground"
                      >
                        Google / Busca
                      </option>
                      <option
                        value="indication"
                        className="bg-background text-foreground"
                      >
                        Indicação de Amigo
                      </option>
                    </select>
                  </div>

                  <Button
                    type="button"
                    className="mt-4 w-full py-6 text-sm font-extrabold"
                    onClick={() => {
                      if (!businessProfile) {
                        toast.error(
                          "Por favor, selecione um perfil para continuar.",
                        )
                        return
                      }
                      setStep(2)
                    }}
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {/* ETAPA 2: SOBRE O NEGÓCIO */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Nome da Barbearia *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-secondary bg-secondary/20 py-5 text-sm focus-visible:border-primary focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Mensagem de Boas-Vindas
                    </label>
                    <Input
                      placeholder="Ex: Estilo e tradição com os melhores profissionais"
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="border-secondary bg-secondary/20 py-5 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Descrição / Sobre a Barbearia *
                    </label>
                    <textarea
                      className="min-h-[90px] w-full rounded-lg border border-secondary bg-secondary/15 px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                      placeholder="Conte um pouco sobre as especialidades da barbearia..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  {session?.user ? (
                    <PhotoUploadField
                      label="Logo da barbearia"
                      value={imageUrl}
                      onChange={setImageUrl}
                      alt={name || "Logo da barbearia"}
                      required
                      disabled={isSubmitting}
                    />
                  ) : (
                    <div className="rounded-lg border border-border p-4">
                      <p className="mb-3 text-sm text-muted-foreground">
                        Entre na sua conta para enviar a logo e salvar o
                        cadastro.
                      </p>
                      <Button onClick={() => setLoginOpen(true)}>
                        Entrar na minha conta
                      </Button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Instagram da Barbearia
                    </label>
                    <Input
                      placeholder="Ex: https://instagram.com/sua_barbearia"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      className="border-secondary bg-secondary/20 py-5 text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 py-6 text-sm"
                      onClick={() => setStep(1)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 py-6 text-sm font-bold"
                      onClick={() => {
                        if (!name || !description || !imageUrl) {
                          toast.error(
                            "Preencha o nome, descrição e logo para continuar.",
                          )
                          return
                        }
                        setStep(3)
                      }}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 3: LOCALIZAÇÃO */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Digite seu endereço... *
                    </label>
                    <Input
                      placeholder="Ex: Avenida dos Cortes, 123 - Centro"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className="border-secondary bg-secondary/20 py-5 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Telefone / WhatsApp de Contato *
                    </label>
                    <Input
                      placeholder="Ex: (11) 98765-4321"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="border-secondary bg-secondary/20 py-5 text-sm"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 py-6 text-sm"
                      onClick={() => setStep(2)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 py-6 text-sm font-bold"
                      onClick={() => {
                        if (!address || !phone) {
                          toast.error(
                            "Preencha o endereço e telefone para continuar.",
                          )
                          return
                        }
                        setStep(4)
                      }}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    Use as sugestões, ajuste os preços ou adicione outros
                    serviços.
                  </p>
                  <div className="space-y-3">
                    {services.map((service, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[minmax(0,1fr)_7rem_2.5rem] items-end gap-2 rounded-lg border border-border p-3"
                      >
                        <div className="space-y-1">
                          <label htmlFor={`service-name-${index}`}>
                            Serviço
                          </label>
                          <Input
                            id={`service-name-${index}`}
                            value={service.name}
                            onChange={(e) =>
                              updateService(index, "name", e.target.value)
                            }
                            placeholder="Nome do serviço"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`service-price-${index}`}>
                            Preço (R$)
                          </label>
                          <MoneyInput
                            id={`service-price-${index}`}
                            value={Number(service.price || 0)}
                            onValueChange={(value) =>
                              updateService(index, "price", String(value))
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover ${service.name || "serviço"}`}
                          onClick={() =>
                            setServices((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setServices((current) => [
                        ...current,
                        { name: "", price: "", description: "" },
                      ])
                    }
                    className="gap-2"
                  >
                    <Plus className="size-4" /> Adicionar outro serviço
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Cabelo e barba",
                      "Acabamento",
                      "Hidratação",
                      "Coloração",
                      "Platinado",
                    ].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="ghost"
                        size="sm"
                        disabled={services.some((s) => s.name === suggestion)}
                        onClick={() =>
                          setServices((current) => [
                            ...current,
                            { name: suggestion, price: "", description: "" },
                          ])
                        }
                      >
                        + {suggestion}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-3 border-t border-border pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(3)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => {
                        if (
                          !services.length ||
                          services.some(
                            (s) =>
                              s.name.trim().length < 2 ||
                              !s.price.trim() ||
                              !Number.isFinite(Number(s.price)) ||
                              Number(s.price) < 0,
                          )
                        ) {
                          toast.error(
                            "Preencha o nome e o preço de cada serviço.",
                          )
                          return
                        }
                        setStep(5)
                      }}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}
              {step === 5 && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    Defina a abertura e o fechamento para cada dia.
                  </p>
                  <div className="divide-y divide-border">
                    {openingHours.map((day, index) => (
                      <div
                        key={day.key}
                        className="grid grid-cols-[minmax(5.5rem,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 py-3"
                      >
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={day.active}
                            className="size-4 accent-primary"
                            onChange={(e) =>
                              setOpeningHours((current) =>
                                current.map((d, i) =>
                                  i === index
                                    ? { ...d, active: e.target.checked }
                                    : d,
                                ),
                              )
                            }
                          />
                          {day.label}
                        </label>
                        {(["start", "end"] as const).map((field) => (
                          <div key={field}>
                            <label
                              htmlFor={`day-${day.key}-${field}`}
                              className="sr-only"
                            >
                              {day.label}:{" "}
                              {field === "start" ? "abertura" : "fechamento"}
                            </label>
                            <Input
                              id={`day-${day.key}-${field}`}
                              type="time"
                              disabled={!day.active}
                              value={day[field]}
                              onChange={(e) =>
                                setOpeningHours((current) =>
                                  current.map((d, i) =>
                                    i === index
                                      ? { ...d, [field]: e.target.value }
                                      : d,
                                  ),
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 border-t border-border pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(4)}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => {
                        if (
                          !openingHours.some((day) => day.active) ||
                          openingHours.some(
                            (day) => day.active && day.end <= day.start,
                          )
                        ) {
                          toast.error(
                            "Escolha os dias e horários válidos de atendimento.",
                          )
                          return
                        }
                        setStep(6)
                      }}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {/* ETAPA 6: CONVITE DE EQUIPE */}
              {step === 6 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300">
                  <TrialPlanCard />
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      Nome do Primeiro Barbeiro (Opcional)
                    </label>
                    <Input
                      placeholder="Ex: Roberto Barbeiro / Nome do seu colega"
                      value={barberName}
                      onChange={(e) => setBarberName(e.target.value)}
                      className="border-secondary bg-secondary/20 py-5 text-sm"
                    />
                    <p className="text-sm leading-6 text-muted-foreground">
                      Este passo cadastra um profissional na agenda. Não envia
                      convite por e-mail. Para acessar o sistema, ele deve
                      entrar com a conta do e-mail informado. Você pode
                      configurar a equipe depois.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="barber-email">
                      E-mail do profissional (opcional)
                    </label>
                    <Input
                      id="barber-email"
                      type="email"
                      value={barberEmail}
                      onChange={(e) => setBarberEmail(e.target.value)}
                      placeholder="profissional@exemplo.com"
                    />
                    <p className="text-sm text-muted-foreground">
                      Informe o mesmo e-mail usado por ele para entrar. Acesso
                      limitado à operação da própria agenda.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                    <p className="text-foreground">{name}</p>
                    <p className="mt-1">
                      {services.length} serviço(s) ·{" "}
                      {openingHours.filter((day) => day.active).length} dia(s)
                      de atendimento
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 py-6 text-sm"
                      onClick={() => setStep(5)}
                    >
                      Voltar
                    </Button>
                    <button
                      id="submit-onboarding"
                      type="submit"
                      className="hidden"
                    />
                    <Button
                      type="submit"
                      className="flex-1 bg-primary py-6 text-sm font-extrabold text-primary-foreground hover:bg-primary/85"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Finalizando..." : "Finalizar e Entrar"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </section>
      </div>
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-w-md">
          <SignInDialog
            redirectAfterLogin={false}
            onLoginSuccess={() => setLoginOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
