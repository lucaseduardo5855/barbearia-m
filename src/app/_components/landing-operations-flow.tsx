import { BadgeDollarSign, CalendarCheck2, PackageCheck, Scissors, Store, UsersRound } from "lucide-react"

type FlowCardProps = {
  icon: typeof CalendarCheck2
  label: string
  title: string
  copy: string
  detail: string
}

const entryPoints: FlowCardProps[] = [
  {
    icon: Store,
    label: "Página pública",
    title: "Seu link fica pronto para receber pedidos",
    copy: "Serviços, profissionais e horários disponíveis no mesmo lugar.",
    detail: "Horários abertos hoje",
  },
  {
    icon: Scissors,
    label: "Atendimento",
    title: "O serviço realizado organiza o restante",
    copy: "O status do agendamento acompanha a rotina da cadeira.",
    detail: "Corte + barba concluído",
  },
  {
    icon: UsersRound,
    label: "Equipe",
    title: "Cada profissional trabalha olhando o mesmo dia",
    copy: "A agenda mostra o que vem a seguir para cada pessoa.",
    detail: "3 profissionais ativos",
  },
]

const outcomes: FlowCardProps[] = [
  {
    icon: BadgeDollarSign,
    label: "Comissões",
    title: "O repasse acompanha o atendimento",
    copy: "Valores previstos permanecem visíveis no financeiro do período.",
    detail: "Comissão calculada",
  },
  {
    icon: PackageCheck,
    label: "Produtos",
    title: "Vendas de produto ficam registradas na operação",
    copy: "O estoque e o valor vendido seguem conectados ao painel.",
    detail: "Venda adicionada ao caixa",
  },
  {
    icon: CalendarCheck2,
    label: "Histórico",
    title: "O atendimento continua fácil de consultar",
    copy: "Cliente, serviço, data e status ficam acessíveis depois do corte.",
    detail: "Registro salvo na agenda",
  },
]

function FlowCard({ icon: Icon, label, title, copy, detail }: FlowCardProps) {
  return (
    <article className="landing-flow__card group min-h-44 rounded-2xl border border-border bg-card p-4 shadow-[0_10px_24px_hsl(var(--foreground)/0.05)] transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:bg-primary/[0.03] hover:shadow-[0_18px_34px_hsl(var(--primary)/0.12)]">
      <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform duration-200 group-hover:rotate-[-6deg] group-hover:scale-110"><Icon className="size-3.5" aria-hidden="true" /></span>
        {label}
      </div>
      <h3 className="mt-3 text-sm font-extrabold tracking-[-0.015em] text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{copy}</p>
      <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-[11px] font-semibold text-foreground transition-colors group-hover:bg-primary/10">{detail}</p>
    </article>
  )
}

export function LandingOperationsFlow() {
  return (
    <section id="painel-conectado" className="scroll-mt-24 border-y border-border/70 bg-card px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold text-primary">Uma operação conectada</p>
          <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-foreground sm:text-5xl">O que acontece na cadeira aparece no painel.</h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground">Agenda, serviços, vendas e comissão trabalham com a mesma informação para evitar lançamentos repetidos.</p>
        </div>

        <div className="landing-flow relative mt-14 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem_minmax(0,1fr)] lg:items-center lg:gap-16">
          <svg className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1000 540" preserveAspectRatio="none" aria-hidden="true">
            <path className="landing-flow__line" d="M228,80 C365,80 382,230 474,230" />
            <path className="landing-flow__line" d="M228,270 C360,270 390,270 474,270" />
            <path className="landing-flow__line" d="M228,460 C365,460 382,310 474,310" />
            <path className="landing-flow__line" d="M526,230 C620,230 640,80 772,80" />
            <path className="landing-flow__line" d="M526,270 C640,270 650,270 772,270" />
            <path className="landing-flow__line" d="M526,310 C620,310 640,460 772,460" />
          </svg>

          <div className="relative grid gap-3">{entryPoints.map((item) => <FlowCard key={item.label} {...item} />)}</div>

          <article className="relative rounded-2xl bg-foreground p-5 text-background shadow-[0_24px_48px_hsl(var(--foreground)/0.2)] sm:p-6">
            <div className="flex items-center justify-between border-b border-background/15 pb-4 text-xs font-semibold text-background/70">
              <span className="inline-flex items-center gap-2"><span className="landing-flow__node size-2 rounded-full bg-primary" /> Agenda</span>
              <span>Hoje, 15:00</span>
            </div>
            <div className="mt-5 rounded-xl bg-primary/20 p-4 ring-1 ring-primary/35">
              <p className="text-sm font-extrabold">Lucas Almeida</p>
              <p className="mt-1 text-xs text-background/70">Corte + barba · com Rafael</p>
              <span className="mt-3 inline-flex rounded-full bg-success/20 px-2.5 py-1 text-[11px] font-bold text-success">Concluído</span>
            </div>
            <dl className="mt-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-background/10 pb-3"><dt className="text-background/65">Serviço</dt><dd className="font-bold">R$ 85,00</dd></div>
              <div className="flex items-center justify-between border-b border-background/10 pb-3"><dt className="text-background/65">Produto</dt><dd className="font-bold">R$ 45,00</dd></div>
              <div className="flex items-center justify-between"><dt className="text-background/65">Total</dt><dd className="text-sm font-extrabold">R$ 130,00</dd></div>
            </dl>
          </article>

          <div className="relative grid gap-3">{outcomes.map((item) => <FlowCard key={item.label} {...item} />)}</div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">Prévia ilustrativa do fluxo de informações no BARBER-M.</p>
      </div>
    </section>
  )
}
