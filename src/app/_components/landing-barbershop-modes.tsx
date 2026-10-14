"use client"

import { useState, useRef, useEffect } from "react"
import {
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Scissors,
  Store,
} from "lucide-react"
import { cn } from "@/lib/utils"

const modes = [
  {
    id: "agenda",
    icon: CalendarDays,
    label: "Agenda da equipe",
    description: "Horários, encaixes e profissionais no mesmo calendário.",
    title: "Cada profissional sabe qual é o próximo atendimento.",
    copy: "Acompanhe a ocupação e abra um novo horário sem sair do contexto do dia.",
    previewLabel: "Agenda de hoje",
    rows: [
      ["09:00", "Thiago Moura", "Corte + barba"],
      ["10:30", "Rafael Mendes", "Corte masculino"],
      ["13:00", "Lucas Almeida", "Barba clássica"],
    ],
  },
  {
    id: "caixa",
    icon: CircleDollarSign,
    label: "Caixa e comissões",
    description: "Recebimentos, despesas e repasses em uma só leitura.",
    title: "O fechamento do dia não depende de outra planilha.",
    copy: "Veja os valores dos atendimentos concluídos e o que ainda está previsto para a equipe.",
    previewLabel: "Resumo do dia",
    rows: [
      ["Receitas", "R$ 940,00", "Atendimentos concluídos"],
      ["Comissões", "R$ 320,00", "3 profissionais"],
      ["Saldo", "R$ 620,00", "Após despesas"],
    ],
  },
  {
    id: "servicos",
    icon: Scissors,
    label: "Serviços e produtos",
    description: "O catálogo acompanha o que sua barbearia realmente oferece.",
    title: "Serviço, preço e produto ficam prontos para vender.",
    copy: "Cadastre o que a equipe realiza e mantenha a operação clara para quem agenda e atende.",
    previewLabel: "Catálogo ativo",
    rows: [
      ["Corte + barba", "R$ 70,00", "Serviço"],
      ["Barba clássica", "R$ 35,00", "Serviço"],
      ["Pomada modeladora", "R$ 45,00", "Produto"],
    ],
  },
  {
    id: "publica",
    icon: Store,
    label: "Página de agendamento",
    description:
      "Um link próprio para o cliente marcar sem interromper a equipe.",
    title: "Sua agenda pública mostra o que o cliente precisa para marcar.",
    copy: "Serviços e horários ficam organizados em uma página da sua barbearia.",
    previewLabel: "Barbearia do Minhoca",
    rows: [
      ["Escolha o serviço", "Corte + barba", "45 min"],
      ["Escolha o profissional", "Rafael", "Disponível"],
      ["Escolha o horário", "15:00", "Hoje"],
    ],
  },
] as const

export function LandingBarbershopModes() {
  const [activeMode, setActiveMode] =
    useState<(typeof modes)[number]["id"]>("agenda")
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(hoverTimer.current), [])
  const chooseMode = (id: (typeof modes)[number]["id"]) => {
    clearTimeout(hoverTimer.current)
    setActiveMode(id)
  }
  const active = modes.find((mode) => mode.id === activeMode) ?? modes[0]

  return (
    <section
      id="para-quem"
      className="scroll-mt-24 px-5 py-24 sm:px-8 sm:py-32 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-primary">
            Feito para a rotina de uma barbearia
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-foreground sm:text-5xl">
            Você escolhe o que quer organizar. O painel acompanha.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Passe pelas áreas para ver como a mesma operação ganha contexto em
            cada tela.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,0.75fr)] lg:items-center lg:gap-16">
          <div
            aria-label="Áreas do BARBER-M"
            className="divide-y divide-border border-y border-border"
          >
            {modes.map((mode) => {
              const Icon = mode.icon
              const selected = mode.id === active.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseMode(mode.id)}
                  onMouseEnter={() => {
                    clearTimeout(hoverTimer.current)
                    hoverTimer.current = setTimeout(
                      () => chooseMode(mode.id),
                      180,
                    )
                  }}
                  onMouseLeave={() => clearTimeout(hoverTimer.current)}
                  onFocus={() => chooseMode(mode.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 px-3 py-4 text-left transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "bg-muted" : "hover:bg-muted/55",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-primary",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-extrabold tracking-[-0.015em] text-foreground">
                      {mode.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {mode.description}
                    </span>
                  </span>
                  <ChevronRight
                    className={cn(
                      "size-5 shrink-0 transition-transform duration-500",
                      selected
                        ? "translate-x-0 text-primary"
                        : "-translate-x-1 text-muted-foreground group-hover:translate-x-0",
                    )}
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>

          <article
            id="mode-preview"
            aria-live="polite"
            className="landing-mode-preview relative overflow-hidden rounded-2xl bg-muted p-5 shadow-[0_22px_45px_hsl(var(--foreground)/0.1)] sm:p-7"
          >
            <div
              className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-2xl"
              aria-hidden="true"
            />
            <div
              key={active.id}
              className="landing-mode-preview__content relative"
            >
              <p className="text-xs font-bold text-primary">
                {active.previewLabel}
              </p>
              <h3 className="mt-3 max-w-md text-2xl font-extrabold tracking-[-0.025em] text-foreground sm:text-3xl">
                {active.title}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                {active.copy}
              </p>

              <div className="mt-8 overflow-hidden rounded-xl bg-card shadow-[0_18px_38px_hsl(var(--foreground)/0.12)] ring-1 ring-foreground/10">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-xs font-extrabold">
                    <span className="size-2 rounded-full bg-success" /> Prévia
                    do painel
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                    Ilustrativo
                  </span>
                </div>
                <div className="divide-y divide-border">
                  {active.rows.map(([time, name, meta]) => (
                    <div
                      key={`${time}-${name}`}
                      className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3 px-4 py-3"
                    >
                      <span className="text-xs font-extrabold tabular-nums text-primary">
                        {time}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-foreground">
                          {name}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                          {meta}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
