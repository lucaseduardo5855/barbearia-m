import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarPlus, ExternalLink, MapPin, MessageCircle, Phone, Scissors } from "lucide-react"
import { db } from "@/lib/prisma"
import { Button } from "@/app/_components/ui/button"
import PublicProfileTabs from "./_components/public-profile-tabs"

interface BarbershopPageProps {
  params: { slug: string }
}

function formatImageUrl(url: string | null) {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url
  return `/${url}`
}

export default async function BarbershopPage({ params }: BarbershopPageProps) {
  const barbershop = await db.barbershop.findUnique({
    where: { slug: params.slug },
    include: { services: true, barbers: true },
  })

  if (!barbershop) return notFound()

  const imageUrl = formatImageUrl(barbershop.imageUrl)
  const whatsappNumber = barbershop.phones[0]?.replace(/\D/g, "")
  const initials = barbershop.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
            <div className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary text-2xl font-extrabold text-primary sm:size-36 sm:text-3xl">
              {imageUrl ? (
                <Image src={imageUrl} alt={barbershop.name} fill priority sizes="144px" className="object-cover" />
              ) : (
                initials || <Scissors className="size-9" />
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-[-0.025em] sm:text-3xl">{barbershop.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{barbershop.welcomeMessage || barbershop.description || "Escolha um serviço e encontre o melhor horário para você."}</p>
              {barbershop.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{barbershop.address}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              )}
              {barbershop.instagramUrl && (
                <a href={barbershop.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-fit items-center gap-1.5 text-xs font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring">
                  Ver Instagram <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Button asChild size="lg" className="gap-2"><Link href={`/${params.slug}/agendar`}><CalendarPlus className="size-4" /> Novo agendamento</Link></Button>
              <Button asChild variant="outline" size="lg"><Link href={`/${params.slug}/reservas`}>Minhas reservas</Link></Button>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2 border-t border-border pt-5">
            {whatsappNumber && (
              <Button asChild variant="secondary" size="sm" className="gap-2">
                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4 text-success" /> Falar no WhatsApp</a>
              </Button>
            )}
            {barbershop.phones.map((phone) => (
              <Button asChild key={phone} variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <a href={`tel:${phone.replace(/\D/g, "")}`}><Phone className="size-4" /> {phone}</a>
              </Button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <PublicProfileTabs slug={params.slug} services={barbershop.services} barbers={barbershop.barbers} openingHours={barbershop.openingHours} />
        </section>
      </div>
    </main>
  )
}
