"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  LayoutDashboard,
  Menu,
  Pause,
  Scissors,
  Search,
  Store,
  Users,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { LandingBarbershopModes } from "./landing-barbershop-modes"
import { LandingOperationsFlow } from "./landing-operations-flow"
import { LandingBookingMotion } from "./landing-booking-motion"
import SignInDiaLog from "./sign-in-dialong"
import { LottieSuccess } from "./ui/lottie-loader"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const features = [
  {
    id: "agenda",
    label: "Agenda da equipe",
    title: "Cada cadeira, cada horário e cada encaixe no lugar certo.",
    copy: "Visualize a rotina de todos os profissionais, encontre espaços livres e deixe o atendimento fluir sem conversas perdidas.",
    icon: CalendarDays,
  },
  {
    id: "financeiro",
    label: "Caixa do dia",
    title: "O movimento da barbearia fica fácil de acompanhar.",
    copy: "Receitas, despesas e comissões aparecem no mesmo contexto dos atendimentos que aconteceram no dia.",
    icon: CircleDollarSign,
  },
  {
    id: "equipe",
    label: "Equipe alinhada",
    title: "Todo profissional enxerga o que vem a seguir.",
    copy: "Organize agenda, serviços e repasses sem pedir atualização em planilha ou grupo de mensagens.",
    icon: Users,
  },
  {
    id: "clientes",
    label: "Agenda pública",
    title: "Seu cliente encontra horários sem interromper o atendimento.",
    copy: "Publique serviços, profissionais e disponibilidade em uma página própria para a sua barbearia.",
    icon: Store,
  },
] as const

const featureVisuals = {
  agenda: {
    eyebrow: "Agenda de hoje",
    rows: [
      ["09:00", "Thiago Moura", "Corte + barba"],
      ["10:30", "Rafael Mendes", "Corte masculino"],
      ["13:00", "Camila Freitas", "Barba clássica"],
    ],
  },
  financeiro: {
    eyebrow: "Caixa de hoje",
    rows: [
      ["Entradas", "R$ 1.080,00", "12 atendimentos"],
      ["Comissões", "R$ 324,00", "3 profissionais"],
      ["Saldo previsto", "R$ 756,00", "Fechamento do dia"],
    ],
  },
  equipe: {
    eyebrow: "Equipe ativa",
    rows: [
      ["Lucas", "5 agendamentos", "37% ocupado"],
      ["Vinícius", "4 agendamentos", "53% ocupado"],
      ["Marcos", "3 agendamentos", "27% ocupado"],
    ],
  },
  clientes: {
    eyebrow: "Página pública",
    rows: [
      ["Corte + barba", "45 min", "R$ 70"],
      ["Corte masculino", "30 min", "R$ 45"],
      ["Barba clássica", "30 min", "R$ 35"],
    ],
  },
} as const

const appointments = [
  {
    time: "09:00",
    client: "Thiago Moura",
    service: "Corte + barba",
    value: "R$ 70",
    tone: "bg-success/15 border-success/25",
  },
  {
    time: "10:30",
    client: "Rafael Mendes",
    service: "Corte masculino",
    value: "R$ 45",
    tone: "bg-info/15 border-info/25",
  },
  {
    time: "13:00",
    client: "Camila Freitas",
    service: "Barba clássica",
    value: "R$ 35",
    tone: "bg-warning/15 border-warning/25",
  },
]

const agendaColumns = [
  { initials: "LM", name: "Lucas", meta: "5 agendamentos", line: "bg-primary" },
  { initials: "VM", name: "Vinícius", meta: "4 agendamentos", line: "bg-info" },
  {
    initials: "MS",
    name: "Marcos",
    meta: "3 agendamentos",
    line: "bg-success",
  },
]

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_12px_26px_hsl(var(--primary)/0.24)] ${compact ? "size-7" : "size-9"}`}
    >
      <Scissors
        className={compact ? "size-3.5" : "size-4"}
        aria-hidden="true"
      />
    </span>
  )
}

function AgendaPreview() {
  return (
    <div
      data-gsap="hero-preview"
      className="landing-showcase relative mx-auto w-full max-w-[44rem]"
      aria-label="Prévia ilustrativa da agenda do BARBER-M"
    >
      <div
        className="pointer-events-none absolute -inset-x-12 top-12 h-2/3 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_26px_70px_hsl(var(--foreground)/0.16)]">
        <div className="flex h-11 items-center justify-between border-b border-border bg-card px-4 sm:px-5">
          <div className="flex items-center gap-2.5">
            <BrandMark compact />
            <span className="text-xs font-extrabold tracking-[0.12em]">
              BARBER-M
            </span>
            <span className="hidden rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground sm:inline">
              Painel administrativo
            </span>
          </div>
          <span className="rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-semibold text-success">
            Dados ilustrativos
          </span>
        </div>

        <div className="grid min-h-[25rem] grid-cols-[3rem_minmax(0,1fr)] sm:grid-cols-[8.75rem_minmax(0,1fr)]">
          <aside
            className="border-r border-border bg-muted/45 px-2 py-4 sm:px-3"
            aria-hidden="true"
          >
            <div className="hidden items-center gap-2 px-2 sm:flex">
              <BrandMark compact />
              <span className="text-[10px] font-extrabold tracking-[0.1em]">
                BARBER-M
              </span>
            </div>
            <div className="mt-7 space-y-1">
              <div className="flex items-center gap-2 rounded-lg bg-primary px-2 py-2 text-primary-foreground shadow-sm sm:px-2.5">
                <LayoutDashboard className="size-3.5 shrink-0" />
                <span className="hidden text-[10px] font-semibold sm:block">
                  Visão geral
                </span>
              </div>
              <div className="flex items-center gap-2 px-2 py-2 text-muted-foreground sm:px-2.5">
                <CalendarDays className="size-3.5 shrink-0" />
                <span className="hidden text-[10px] font-medium sm:block">
                  Agenda
                </span>
              </div>
              <div className="flex items-center gap-2 px-2 py-2 text-muted-foreground sm:px-2.5">
                <Wallet className="size-3.5 shrink-0" />
                <span className="hidden text-[10px] font-medium sm:block">
                  Financeiro
                </span>
              </div>
              <div className="flex items-center gap-2 px-2 py-2 text-muted-foreground sm:px-2.5">
                <Users className="size-3.5 shrink-0" />
                <span className="hidden text-[10px] font-medium sm:block">
                  Equipe
                </span>
              </div>
            </div>
          </aside>

          <div className="min-w-0 px-3 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">
                  Terça-feira, 29 de setembro
                </p>
                <h2 className="mt-1 text-base font-extrabold tracking-[-0.02em] sm:text-lg">
                  Agenda da equipe
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="hidden items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:flex"
                >
                  Ter, 29 de set <ChevronDown className="size-3" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="hidden sm:inline">Novo </span>agendamento
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5" aria-hidden="true">
              <span className="rounded-full bg-foreground px-2 py-1 text-[9px] font-semibold text-background">
                Todos (12)
              </span>
              <span className="rounded-full bg-warning/20 px-2 py-1 text-[9px] font-semibold text-warning">
                Pendentes (2)
              </span>
              <span className="rounded-full bg-info/15 px-2 py-1 text-[9px] font-semibold text-info">
                Confirmados (4)
              </span>
              <span className="hidden rounded-full bg-success/15 px-2 py-1 text-[9px] font-semibold text-success sm:inline">
                Concluídos (6)
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[2.25rem_repeat(3,minmax(5.5rem,1fr))] border-b border-border bg-muted/45 sm:grid-cols-[3rem_repeat(3,minmax(7rem,1fr))]">
                <div className="border-r border-border p-2 text-[9px] font-semibold text-muted-foreground">
                  Hora
                </div>
                {agendaColumns.map((column) => (
                  <div
                    key={column.name}
                    className="min-w-0 border-r border-border p-2 last:border-r-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-card text-[8px] font-extrabold text-foreground">
                        {column.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-bold">
                          {column.name}
                        </p>
                        <p className="hidden truncate text-[8px] text-muted-foreground sm:block">
                          {column.meta}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`mt-2 block h-0.5 rounded-full ${column.line}`}
                    />
                  </div>
                ))}
              </div>

              {appointments.map((appointment, index) => (
                <div
                  key={appointment.time}
                  className="grid min-h-[4.6rem] grid-cols-[2.25rem_repeat(3,minmax(5.5rem,1fr))] border-b border-border last:border-b-0 sm:grid-cols-[3rem_repeat(3,minmax(7rem,1fr))]"
                >
                  <div className="border-r border-border px-1 pt-2 text-center text-[8px] font-semibold text-muted-foreground sm:text-[9px]">
                    {appointment.time}
                  </div>
                  <div className="border-r border-border p-1.5">
                    {index !== 1 && (
                      <AppointmentCard appointment={appointment} />
                    )}
                  </div>
                  <div className="border-r border-border p-1.5">
                    {index !== 2 && (
                      <AppointmentCard
                        appointment={
                          appointments[(index + 1) % appointments.length]
                        }
                      />
                    )}
                  </div>
                  <div className="p-1.5">
                    {index !== 0 && (
                      <AppointmentCard
                        appointment={
                          appointments[(index + 2) % appointments.length]
                        }
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-sm">
              <div className="rounded-lg bg-primary/10 px-3 py-2">
                <p className="text-[9px] font-medium text-muted-foreground">
                  Receita prevista
                </p>
                <p className="mt-1 text-sm font-extrabold text-primary">
                  R$ 1.080,00
                </p>
              </div>
              <div className="rounded-lg bg-muted px-3 py-2">
                <p className="text-[9px] font-medium text-muted-foreground">
                  Atendimentos
                </p>
                <p className="mt-1 text-sm font-extrabold">
                  12{" "}
                  <span className="text-[9px] font-medium text-muted-foreground">
                    hoje
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute -bottom-7 -left-3 hidden w-52 rounded-xl border border-border bg-card p-3 shadow-[0_18px_45px_hsl(var(--foreground)/0.16)] sm:block"
        aria-hidden="true"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold">Atendimento confirmado</span>
          <Check className="size-3.5 text-success" />
        </div>
        <p className="mt-2 text-xs font-extrabold">Rafael · 15:00</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Corte + barba · R$ 70
        </p>
      </div>
    </div>
  )
}

function AppointmentCard({
  appointment,
}: {
  appointment: (typeof appointments)[number]
}) {
  return (
    <div
      className={`min-w-0 rounded-md border px-1.5 py-1.5 ${appointment.tone}`}
    >
      <p className="truncate text-[8px] font-extrabold sm:text-[9px]">
        {appointment.client}
      </p>
      <p className="mt-0.5 truncate text-[7px] text-muted-foreground sm:text-[8px]">
        {appointment.service}
      </p>
      <p className="mt-1 text-right text-[7px] font-bold sm:text-[8px]">
        {appointment.value}
      </p>
    </div>
  )
}

const marketplaceBarbershops = [
  {
    name: "Barbearia do Minhoca",
    meta: "Centro · 4,9 ★",
    image: "/logominhoca.png",
  },
  {
    name: "Corte & Estilo",
    meta: "Vila Madalena · 5,0 ★",
    image: "/illustrations/barber-at-work.webp",
  },
  {
    name: "Barba & Navalha",
    meta: "Jardins · 4,8 ★",
    image: "/illustrations/barber-at-work.webp",
  },
]

function MarketplacePreview() {
  return (
    <div
      data-gsap="marketplace-preview"
      className="relative w-full max-w-[25rem] rounded-2xl border border-border bg-card p-3 shadow-[0_22px_48px_hsl(var(--foreground)/0.13)] sm:p-3.5"
      aria-label="Prévia ilustrativa do marketplace para clientes"
    >
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <BrandMark compact />
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.1em]">
              BARBER-M
            </p>
            <p className="text-[9px] text-muted-foreground">
              Marketplace para clientes
            </p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary">
          Área do cliente
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[10px] text-muted-foreground">
        <Search className="size-3.5 text-primary" />
        <span>Buscar por serviço ou barbearia</span>
      </div>
      <div className="mt-3 flex gap-1.5 overflow-hidden" aria-hidden="true">
        {["Cabelo", "Barba", "Corte + barba", "Sobrancelha"].map((tag) => (
          <span
            key={tag}
            className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[9px] font-semibold text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {marketplaceBarbershops.map((barbershop) => (
          <div
            key={barbershop.name}
            className="min-w-0 overflow-hidden rounded-lg border border-border bg-background"
          >
            <div className="h-14 bg-muted">
              <Image
                src={barbershop.image}
                alt=""
                width={160}
                height={56}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-1.5">
              <p className="truncate text-[9px] font-bold">{barbershop.name}</p>
              <p className="mt-0.5 truncate text-[8px] text-muted-foreground">
                {barbershop.meta}
              </p>
              <span className="mt-1.5 block rounded-md bg-primary px-2 py-1 text-center text-[8px] font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                Ver perfil
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-success/25 bg-success/10 px-3 py-2">
        <LottieSuccess size={30} />
        <div className="min-w-0">
          <p className="text-[10px] font-bold">Agendamento confirmado</p>
          <p className="truncate text-[9px] text-muted-foreground">
            Corte + barba · hoje às 15:00
          </p>
        </div>
        <span className="ml-auto shrink-0 text-[9px] font-bold text-success">
          R$ 70
        </span>
      </div>
    </div>
  )
}

function CustomerFlowPreview() {
  const steps = [
    {
      icon: Search,
      title: "Cliente encontra",
      copy: "Busca por cidade, serviço ou barbearia.",
    },
    {
      icon: CalendarDays,
      title: "Cliente agenda",
      copy: "Escolhe serviço, profissional e horário.",
    },
    {
      icon: LayoutDashboard,
      title: "Você acompanha",
      copy: "Tudo entra na agenda e no caixa.",
    },
  ]

  return (
    <section
      data-gsap="scroll-section"
      className="border-y border-border/70 bg-card px-5 py-16 sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
            Uma experiência conectada
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">
            Do primeiro clique ao caixa fechado.
          </h2>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            O cliente encontra e agenda sozinho. A equipe recebe tudo organizado
            no painel.
          </p>
        </div>
        <div className="mt-9 grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="group relative rounded-2xl border border-border bg-background p-5 transition-[transform,box-shadow,border-color,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:border-primary/30 hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/[0.025] hover:shadow-[0_18px_36px_-22px_hsl(var(--primary)/0.45)]"
              >
                <span
                  className="pointer-events-none absolute inset-x-5 top-0 h-px origin-left scale-x-0 bg-primary/70 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                  aria-hidden="true"
                />
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[-5deg] group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5 transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  <span className="text-xs font-extrabold text-muted-foreground transition-colors duration-500 group-hover:text-primary">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-extrabold transition-colors duration-500 group-hover:text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.copy}
                </p>
                {index < steps.length - 1 && (
                  <ArrowRight className="absolute -right-4 top-1/2 z-10 hidden size-7 -translate-y-1/2 rounded-full border border-border bg-card p-1.5 text-primary transition-[transform,box-shadow] duration-500 group-hover:translate-x-1 group-hover:shadow-[0_8px_18px_-10px_hsl(var(--primary)/0.6)] md:block" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const landingRoot = useRef<HTMLElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] =
    useState<(typeof features)[number]["id"]>("agenda")
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(hoverTimer.current), [])
  const [featurePaused, setFeaturePaused] = useState(false)
  const featureSection = useRef<HTMLElement>(null)
  const active =
    features.find((feature) => feature.id === activeFeature) ?? features[0]
  const ActiveIcon = active.icon
  const activeVisual = featureVisuals[active.id]

  useEffect(() => {
    if (
      featurePaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    let visible = false
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    if (featureSection.current) observer.observe(featureSection.current)
    const timer = window.setInterval(() => {
      if (!visible || document.hidden) return
      setActiveFeature((current) => {
        const index = features.findIndex((feature) => feature.id === current)
        return features[(index + 1) % features.length].id
      })
    }, 7000)

    return () => {
      window.clearInterval(timer)
      observer.disconnect()
    }
  }, [featurePaused])

  useGSAP(
    () => {
      const media = gsap.matchMedia()
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-gsap='hero-copy'] > *", {
          opacity: 0,
          y: 22,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
        })
        gsap.from("[data-gsap='hero-preview']", {
          opacity: 0,
          x: 28,
          rotate: 1.5,
          duration: 0.9,
          delay: 0.15,
          ease: "power3.out",
        })

        gsap.utils
          .toArray<HTMLElement>("[data-gsap='scroll-section']")
          .forEach((section) => {
            gsap.fromTo(
              section,
              { opacity: 0, y: 34 },
              {
                opacity: 1,
                y: 0,
                duration: 0.75,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: section,
                  start: "top 84%",
                  once: true,
                },
              },
            )
          })
      })

      return () => media.revert()
    },
    { scope: landingRoot },
  )

  return (
    <main
      ref={landingRoot}
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest('a[href^="#"]')
        const target =
          link && document.getElementById(link.getAttribute("href")!.slice(1))
        if (target) {
          event.preventDefault()
          target.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "auto"
              : "smooth",
            block: "start",
          })
        }
      }}
      className="landing-opero min-h-screen overflow-hidden bg-background text-foreground"
    >
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10"
          aria-label="Navegação principal"
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="BARBER-M, início da página"
          >
            <BrandMark />
            <span className="text-sm font-extrabold tracking-[0.12em]">
              BARBER-M
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a
              href="#recursos"
              className="rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Funcionalidades
            </a>
            <a
              href="#como-funciona"
              className="rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Como funciona
            </a>
            <a
              href="#para-quem"
              className="rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Para barbearias
            </a>
            <Link
              href="/?view=marketplace"
              className="rounded-sm transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              Encontrar barbearias
            </Link>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-lg px-4 font-semibold"
                >
                  Entrar
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90%] sm:max-w-md">
                <SignInDiaLog />
              </DialogContent>
            </Dialog>
            <Button
              asChild
              size="sm"
              className="h-10 rounded-lg px-4 font-bold shadow-[0_10px_22px_hsl(var(--primary)/0.24)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_14px_26px_hsl(var(--primary)/0.3)]"
            >
              <Link href="/admin/register">
                Criar minha barbearia <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <Menu className="size-5" />
          </Button>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-border bg-card px-5 py-4 sm:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              <a
                href="#recursos"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                Funcionalidades
              </a>
              <a
                href="#como-funciona"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                Como funciona
              </a>
              <a
                href="#para-quem"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                Para barbearias
              </a>
              <div className="mt-2 flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      Entrar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90%] sm:max-w-md">
                    <SignInDiaLog />
                  </DialogContent>
                </Dialog>
                <Button asChild size="sm" className="flex-1">
                  <Link href="/admin/register">Começar</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <section className="landing-opero__hero border-b border-border/70 px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-10">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-10">
          <div data-gsap="hero-copy" className="max-w-xl">
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.02] tracking-[-0.038em] sm:text-5xl lg:text-[4.2rem]">
              Sua barbearia em sintonia,{" "}
              <span className="text-muted-foreground">da agenda ao caixa.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Agenda da equipe, atendimentos, financeiro e comissões no mesmo
              painel. Menos troca de tela para você ter mais controle do dia.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="h-14 min-w-[13.25rem] rounded-full px-6 text-[15px] font-bold shadow-[0_14px_30px_hsl(var(--primary)/0.24)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_hsl(var(--primary)/0.3)]"
              >
                <Link href="/admin/register">
                  Criar minha barbearia <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 rounded-full border-border bg-card px-3 pr-6 text-[15px] font-bold shadow-[0_5px_12px_hsl(var(--foreground)/0.05)] transition-all duration-500 hover:-translate-y-0.5 hover:bg-card hover:shadow-[0_10px_18px_hsl(var(--foreground)/0.1)]"
              >
                <Link href="/?view=marketplace">
                  Encontrar barbearias <Search className="ml-2 size-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2.5 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" /> Agenda por
                profissional
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CircleDollarSign className="size-3.5 text-primary" /> Controle
                de caixa
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-3.5 text-success" /> Página de
                agendamento
              </span>
            </div>
          </div>
          <div data-gsap="hero-showcase" className="relative pb-10 lg:pb-0">
            <AgendaPreview />
            <div className="relative z-10 mt-4 lg:absolute lg:-bottom-8 lg:-right-8 lg:mt-0 lg:origin-bottom-right lg:scale-[0.78]">
              <MarketplacePreview />
            </div>
          </div>
        </div>
      </section>

      <section
        data-gsap="scroll-section"
        className="border-b border-border/70 bg-card px-5 py-5 sm:px-8 lg:px-10"
        aria-label="Módulos disponíveis"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-9 gap-y-3 text-sm font-semibold text-muted-foreground sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" /> Agenda
          </span>
          <span className="inline-flex items-center gap-2">
            <Users className="size-4 text-primary" /> Equipe
          </span>
          <span className="inline-flex items-center gap-2">
            <Wallet className="size-4 text-primary" /> Financeiro
          </span>
          <span className="inline-flex items-center gap-2">
            <Store className="size-4 text-primary" /> Agenda pública
          </span>
        </div>
      </section>

      <section
        data-gsap="scroll-section"
        id="recursos"
        ref={featureSection}
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-[-0.035em] sm:text-5xl">
              O que acontece na barbearia aparece onde você precisa.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
              O BARBER-M concentra os momentos que fazem parte da operação, para
              a equipe trabalhar com a mesma informação.
            </p>
            <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {features.map((feature) => {
                const Icon = feature.icon
                const selected = activeFeature === feature.id
                return (
                  <button
                    key={feature.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      clearTimeout(hoverTimer.current)
                      setActiveFeature(feature.id)
                    }}
                    onMouseEnter={() => {
                      setFeaturePaused(true)
                      clearTimeout(hoverTimer.current)
                      hoverTimer.current = setTimeout(
                        () => setActiveFeature(feature.id),
                        180,
                      )
                    }}
                    onMouseLeave={() => {
                      clearTimeout(hoverTimer.current)
                      setFeaturePaused(false)
                    }}
                    onFocus={() => setActiveFeature(feature.id)}
                    className={`group relative flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-[transform,background-color,border-color,box-shadow,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:text-foreground hover:shadow-[0_14px_30px_-20px_hsl(var(--foreground)/0.2)] focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary/20 bg-primary text-primary-foreground shadow-[0_12px_24px_hsl(var(--primary)/0.18)]" : "border-transparent text-muted-foreground"}`}
                  >
                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 ${selected ? "bg-primary-foreground/15" : "border border-border bg-card"}`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex-1 text-sm font-bold">
                      {feature.label}
                    </span>
                    <ChevronRight
                      className={`size-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${selected ? "translate-x-0" : "-translate-x-1 group-hover:translate-x-0"}`}
                    />
                    {selected && (
                      <span className="absolute inset-x-3 bottom-0 h-0.5 overflow-hidden rounded-full bg-primary-foreground/20">
                        <span className="block h-full origin-left animate-[landing-feature-progress_7s_linear] bg-primary-foreground" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            key={active.id}
            className="landing-mode-preview__content self-start rounded-2xl border border-border/70 bg-muted/75 p-5 shadow-[0_18px_42px_hsl(var(--foreground)/0.06)] sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/illustrations/barber-at-work.webp"
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 rounded-xl object-cover"
                />
                <ActiveIcon className="size-6 text-primary" />
              </div>
              <button
                type="button"
                onClick={() => setFeaturePaused((paused) => !paused)}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                aria-pressed={featurePaused}
              >
                <Pause className="size-3" />{" "}
                {featurePaused ? "Retomar demo" : "Pausar demo"}
              </button>
            </div>
            <h3 className="mt-8 max-w-xl text-2xl font-extrabold tracking-[-0.025em] sm:text-4xl">
              {active.title}
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              {active.copy}
            </p>
            <div className="mt-10 overflow-hidden rounded-xl border border-border bg-card shadow-[0_10px_26px_hsl(var(--foreground)/0.08)]">
              <div className="flex items-center justify-between border-b border-border bg-muted/55 px-4 py-3">
                <span className="text-xs font-bold text-foreground">
                  {activeVisual.eyebrow}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary">
                  Dados ilustrativos
                </span>
              </div>
              {activeVisual.rows.map(([label, value, meta]) => (
                <div
                  key={label}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[0.8fr_1fr_auto]"
                >
                  <span className="text-xs font-bold text-foreground">
                    {label}
                  </span>
                  <span className="text-xs font-semibold text-primary sm:text-right">
                    {value}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {meta}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-card p-4 shadow-[0_10px_26px_hsl(var(--foreground)/0.08)]">
                <Clock3 className="size-4 text-primary" />
                <p className="mt-5 text-sm font-bold">Rotina visível</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  O que já foi e o que vem a seguir, sem procurar informação.
                </p>
              </div>
              <div className="rounded-xl bg-card p-4 shadow-[0_10px_26px_hsl(var(--foreground)/0.08)]">
                <Users className="size-4 text-primary" />
                <p className="mt-5 text-sm font-bold">Equipe conectada</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  As atualizações relevantes chegam à pessoa certa.
                </p>
              </div>
              <div className="rounded-xl bg-card p-4 shadow-[0_10px_26px_hsl(var(--foreground)/0.08)]">
                <CircleDollarSign className="size-4 text-primary" />
                <p className="mt-5 text-sm font-bold">Fechamento claro</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Cada atendimento ajuda a compor a leitura financeira do dia.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CustomerFlowPreview />

      <div data-gsap="scroll-section">
        <LandingOperationsFlow />
        <LandingBookingMotion />
      </div>

      <div data-gsap="scroll-section">
        <LandingBarbershopModes />
      </div>

      <section
        data-gsap="scroll-section"
        id="como-funciona"
        className="scroll-mt-24 border-y border-border/70 bg-card px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <h2 className="max-w-md text-3xl font-extrabold leading-tight tracking-[-0.035em] sm:text-5xl">
              Uma rotina simples, do primeiro horário ao fechamento.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
              Comece com a sua operação real e deixe o sistema organizar as
              próximas etapas.
            </p>
          </div>
          <ol className="divide-y divide-border">
            <li className="grid gap-4 py-6 first:pt-0 sm:grid-cols-[2.25rem_1fr] sm:gap-6">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
                1
              </span>
              <div>
                <h3 className="text-xl font-extrabold tracking-[-0.02em]">
                  Monte a sua agenda
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Cadastre serviços, horários e profissionais para que cada
                  cadeira comece o dia organizada.
                </p>
              </div>
            </li>
            <li className="grid gap-4 py-6 sm:grid-cols-[2.25rem_1fr] sm:gap-6">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
                2
              </span>
              <div>
                <h3 className="text-xl font-extrabold tracking-[-0.02em]">
                  Compartilhe seu link
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  O cliente vê os serviços e escolhe um horário disponível na
                  página da sua barbearia.
                </p>
              </div>
            </li>
            <li className="grid gap-4 py-6 last:pb-0 sm:grid-cols-[2.25rem_1fr] sm:gap-6">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground">
                3
              </span>
              <div>
                <h3 className="text-xl font-extrabold tracking-[-0.02em]">
                  Atenda com o dia em ordem
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Os atendimentos alimentam a visão do caixa, o histórico e as
                  comissões da equipe.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section
        data-gsap="scroll-section"
        id="diferenciais"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div className="rounded-2xl bg-primary p-7 text-primary-foreground shadow-[0_24px_60px_hsl(var(--primary)/0.25)] sm:p-10">
            <LayoutDashboard className="size-7" />
            <blockquote className="mt-16 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.035em] sm:text-4xl">
              “O que a equipe precisa saber aparece antes de alguém precisar
              perguntar.”
            </blockquote>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-primary-foreground/80">
              <span className="inline-flex items-center gap-2">
                <Check className="size-4" /> Painel para a rotina
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="size-4" /> Agenda pública
              </span>
            </div>
          </div>
          <div>
            <h2 className="max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.035em] sm:text-5xl">
              Feito para barbearias que querem crescer sem perder o ritmo.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              Para quem atende sozinho, coordena uma equipe ou abriu a primeira
              unidade e precisa enxergar a operação sem complicar o atendimento.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Para confirmar horários sem depender de improviso",
                "Para equipes que precisam trabalhar olhando o mesmo dia",
                "Para donos que querem conferir o caixa sem montar outra planilha",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm font-semibold"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <Check className="size-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        data-gsap="scroll-section"
        className="px-5 pb-24 sm:px-8 sm:pb-32 lg:px-10"
      >
        <div className="landing-opero__cta relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-muted px-6 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16">
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-[-0.035em] sm:text-5xl">
                A próxima agenda organizada começa agora.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Crie sua barbearia, cadastre sua equipe e publique o seu
                primeiro horário.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-14 shrink-0 rounded-full px-6 text-[15px] font-bold shadow-[0_14px_30px_hsl(var(--primary)/0.24)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_hsl(var(--primary)/0.3)]"
            >
              <Link href="/admin/register">
                Criar minha barbearia <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card px-5 py-7 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/landing"
            className="flex items-center gap-2 font-extrabold tracking-[0.12em] text-foreground"
          >
            <BrandMark compact /> BARBER-M
          </Link>
          <span>Gestão de barbearia feita para o ritmo do atendimento.</span>
        </div>
      </footer>
    </main>
  )
}
