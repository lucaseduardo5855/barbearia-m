"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowDownAZ,
  ArrowRight,
  ArrowUpNarrowWide,
  Banknote,
  Clock3,
  Package,
  Scissors,
  Star,
  Users,
} from "lucide-react"
import { defaultOpeningDays, type OpeningDay } from "@/lib/opening-hours"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

type Service = { id: string; name: string; price: unknown; description: string }
type Barber = { id: string; name: string; imageUrl: string | null }
const demoReviews = [
  {
    name: "Marcos A.",
    text: "Atendimento pontual e corte muito bem feito.",
    rating: 5,
  },
  {
    name: "Lucas R.",
    text: "Consegui achar um horário livre sem precisar ligar.",
    rating: 5,
  },
  {
    name: "João P.",
    text: "Ambiente organizado e profissional atencioso.",
    rating: 4,
  },
]

export default function PublicProfileTabs({
  slug,
  services,
  barbers,
  openingHours,
}: {
  slug: string
  services: Service[]
  barbers: Barber[]
  openingHours?: string | null
}) {
  const [tab, setTab] = useState("servicos")
  const [sort, setSort] = useState<"name" | "price">("name")
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const sortedServices = useMemo(
    () =>
      [...services].sort((a, b) =>
        sort === "name"
          ? a.name.localeCompare(b.name)
          : Number(a.price) - Number(b.price),
      ),
    [services, sort],
  )
  const schedule = useMemo<OpeningDay[]>(() => {
    if (!openingHours) return defaultOpeningDays
    try {
      const parsed = JSON.parse(openingHours) as Record<
        string,
        Partial<OpeningDay>
      >
      return defaultOpeningDays.map((day) => ({
        ...day,
        ...(parsed[day.key] || {}),
      }))
    } catch {
      return defaultOpeningDays
    }
  }, [openingHours])
  const tabs = [
    ["servicos", "Serviços", Scissors],
    ["profissionais", "Profissionais", Users],
    ["pacotes", "Pacotes", Package],
    ["avaliacoes", "Avaliações", Star],
  ] as const

  return (
    <div className="w-full">
      <nav
        className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Seções da barbearia"
        role="tablist"
      >
        {tabs.map(([id, label, Icon]) => {
          const selected = tab === id
          return (
            <button
              key={id}
              type="button"
              id={`${id}-tab`}
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              onClick={() => setTab(id)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring ${selected ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          )
        })}
      </nav>

      {tab === "servicos" && (
        <div
          id="servicos-panel"
          role="tabpanel"
          aria-labelledby="servicos-tab"
          className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]"
        >
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold tracking-[-0.015em]">
                  Serviços disponíveis
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escolha um serviço para continuar o agendamento.
                </p>
              </div>
              <div
                className="flex rounded-lg bg-muted p-1 text-xs"
                aria-label="Ordenar serviços"
              >
                <button
                  type="button"
                  aria-pressed={sort === "name"}
                  onClick={() => setSort("name")}
                  className={`inline-flex min-h-8 items-center gap-1 rounded-md px-2 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring ${sort === "name" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  <ArrowDownAZ className="size-3" /> Nome
                </button>
                <button
                  type="button"
                  aria-pressed={sort === "price"}
                  onClick={() => setSort("price")}
                  className={`inline-flex min-h-8 items-center gap-1 rounded-md px-2 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring ${sort === "price" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  <ArrowUpNarrowWide className="size-3" /> Valor
                </button>
              </div>
            </div>

            {sortedServices.length > 0 ? (
              <div className="mt-6 divide-y divide-border">
                {sortedServices.map((service) => (
                  <Link
                    key={service.id}
                    href={`/${slug}/agendar?serviceId=${service.id}`}
                    className="group flex min-h-20 items-center gap-4 py-4 transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Scissors className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground group-hover:text-primary">
                        {service.name}
                      </span>
                      <span className="mt-1 line-clamp-1 block text-xs text-muted-foreground">
                        {service.description}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        R$ {Number(service.price).toFixed(2).replace(".", ",")}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                Esta barbearia ainda não cadastrou serviços.
              </p>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Clock3 className="size-4 text-primary" />
                <h2 className="font-extrabold">Horário de atendimento</h2>
              </div>
              <div className="mt-4 space-y-2.5 text-xs">
                {schedule.map((day) => (
                  <div
                    key={day.key}
                    className="flex items-center justify-between gap-3 text-muted-foreground"
                  >
                    <span>{day.label}</span>
                    <strong className="whitespace-nowrap text-foreground">
                      {day.active ? `${day.start} – ${day.end}` : "Fechado"}
                    </strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Banknote className="size-4 text-primary" />
                <h2 className="font-extrabold">Pagamento</h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["Dinheiro", "Pix", "Cartão"].map((method) => (
                  <span
                    key={method}
                    className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </section>
          </aside>
        </div>
      )}

      {tab === "profissionais" && (
        <section
          id="profissionais-panel"
          role="tabpanel"
          aria-labelledby="profissionais-tab"
          className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <h2 className="text-lg font-extrabold tracking-[-0.015em]">
            Profissionais
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Conheça quem pode atender você.
          </p>
          {barbers.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {barbers.map((barber) => (
                <button
                  type="button"
                  key={barber.id}
                  onClick={() => setSelectedBarber(barber)}
                  className="group flex min-h-20 items-center gap-3 rounded-xl bg-muted/70 p-3 text-left transition-colors duration-200 hover:-translate-y-0.5 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Image
                    src={barber.imageUrl || "/avatar.png"}
                    alt={barber.name}
                    width={56}
                    height={56}
                    className="size-14 rounded-full object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">
                      {barber.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Ver perfil
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
              Esta barbearia ainda não cadastrou profissionais.
            </p>
          )}
        </section>
      )}

      {tab === "pacotes" && (
        <section
          id="pacotes-panel"
          role="tabpanel"
          aria-labelledby="pacotes-tab"
          className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
            <Package className="size-4" />
          </div>
          <h2 className="mt-5 text-lg font-extrabold">Pacotes</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Os pacotes e combinações especiais desta barbearia aparecerão aqui
            quando estiverem disponíveis.
          </p>
        </section>
      )}

      {tab === "avaliacoes" && (
        <section
          id="avaliacoes-panel"
          role="tabpanel"
          aria-labelledby="avaliacoes-tab"
          className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold tracking-[-0.015em]">
                Avaliações
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Exemplos de como as avaliações dos clientes aparecerão aqui.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1.5 text-sm font-extrabold text-warning">
              <Star className="size-3.5 fill-current" /> 4,9
            </span>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {demoReviews.map((review) => (
              <article key={review.name} className="rounded-xl bg-muted/70 p-4">
                <div
                  className="flex items-center gap-1 text-warning"
                  aria-label={`${review.rating} de 5 estrelas`}
                >
                  {Array.from({ length: review.rating }, (_, index) => (
                    <Star key={index} className="size-3.5 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-foreground">
                  “{review.text}”
                </p>
                <p className="mt-4 text-xs font-bold text-muted-foreground">
                  {review.name}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <Dialog
        open={Boolean(selectedBarber)}
        onOpenChange={(open) => {
          if (!open) setSelectedBarber(null)
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md p-3 sm:max-w-md">
          {selectedBarber && (
            <>
              <DialogTitle className="sr-only">
                Foto de {selectedBarber.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Foto ampliada do profissional {selectedBarber.name}.
              </DialogDescription>
              <Image
                src={selectedBarber.imageUrl || "/avatar.png"}
                alt={selectedBarber.name}
                width={600}
                height={600}
                className="aspect-square w-full rounded-xl object-cover"
              />
              <p className="py-2 text-center font-extrabold">
                {selectedBarber.name}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
