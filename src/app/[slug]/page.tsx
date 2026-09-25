import { db } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Button } from "@/app/_components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { MapPinIcon, PhoneIcon, ScissorsIcon, UsersIcon, BanknoteIcon, Clock3Icon, PackageIcon, StarIcon } from "lucide-react"
import PublicProfileTabs from "./_components/public-profile-tabs"

// Ícone do Instagram customizado (já que a versão do lucide-react do projeto não exporta ícones de marcas)
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
)

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M12 2a10 10 0 0 0-8.46 15.33L2 22l4.82-1.5A10 10 0 1 0 12 2Zm0 18.18a8.18 8.18 0 0 1-4.17-1.14l-.3-.18-2.86.89.93-2.78-.2-.3A8.18 8.18 0 1 1 12 20.18Zm4.49-6.13c-.25-.13-1.48-.73-1.7-.81-.23-.08-.4-.12-.57.12-.17.25-.66.81-.8.98-.15.16-.3.18-.55.06a6.68 6.68 0 0 1-1.97-1.21 7.38 7.38 0 0 1-1.36-1.7c-.14-.25 0-.38.11-.5.11-.11.25-.3.37-.45.12-.14.16-.25.24-.41.08-.17.04-.31-.02-.44-.06-.12-.57-1.37-.78-1.87-.2-.48-.41-.42-.57-.43h-.48c-.17 0-.44.06-.67.3-.23.25-.88.86-.88 2.1s.9 2.44 1.03 2.61c.12.16 1.76 2.68 4.26 3.76.59.26 1.05.41 1.41.52.6.19 1.15.16 1.58.1.48-.07 1.48-.6 1.69-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.16-.48-.29Z" />
    </svg>
)


// 1. Definimos a interface dos parâmetros que vêm da URL
interface BarbershopPageProps {
    params: {
        slug: string
    }
}

// 2. Criamos o componente da página (sendo um Server Component por padrão, o que nos permite consultar o banco de dados diretamente aqui!)
export default async function BarbershopPage({ params }: BarbershopPageProps) {
    // 3. Buscamos no banco de dados a barbearia que tem o slug correspondente ao da URL
    const barbershop = await db.barbershop.findUnique({
        where: {
            slug: params.slug,
        },
        include: {
            services: true,
            barbers: true,
        },
    })

    // 4. Se a barbearia não existir, redirecionamos para a tela de erro 404 (Não Encontrado)
    if (!barbershop) {
        return notFound()
    }

    // Garante que os caminhos das imagens locais comecem com "/" para o next/image não quebrar
    const formatImageUrl = (url: string | null) => {
        if (!url) return null
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
            return url
        }
        return `/${url}`
    }

    const imageUrl = formatImageUrl(barbershop.imageUrl) || ""
    const bannerUrl = formatImageUrl(barbershop.bannerUrl)
    const whatsappNumber = barbershop.phones[0]?.replace(/\D/g, "")

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Banner Superior da Barbearia (se houver, senão usa imagem padrão) */}
            <div className="relative w-full h-[200px] bg-primary">
                {bannerUrl ? (
                    <Image
                        src={bannerUrl}
                        alt={`Banner de ${barbershop.name}`}
                        fill
                        className="object-cover"
                    />
                ) : null}
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1 flex flex-col items-center p-4 text-center gap-6 max-w-5xl w-full mx-auto md:p-8 md:py-12">
                {/* Logo/Imagem da Barbearia */}
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary mt-3 bg-background">
                    {imageUrl && (
                        <Image
                            src={imageUrl}
                            alt={barbershop.name}
                            fill
                            className="object-cover"
                        />
                    )}
                </div>

                {/* Nome e Mensagem de Boas-Vindas */}
                <div className="space-y-3">
                    <h1 className="text-2xl font-semibold">{barbershop.name}</h1>
                    <p className="text-sm text-muted-foreground">{barbershop.welcomeMessage || "Bem- vindo ao nosso sistema de agendamentos!"}</p>

                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir o endereço da ${barbershop.name} no Google Maps`}
                        className="flex items-center gap-1 text-sm text-gray-400 justify-center hover:text-primary hover:underline transition-colors"
                    >
                        <MapPinIcon className="w-3.5 h-3.5" />
                        <span>{barbershop.address}</span>
                    </a>

                    {barbershop.instagramUrl && (
                        <div className="flex justify-center pt-1">
                            <a href={barbershop.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-primary hover:underline">
                                <InstagramIcon className="w-4 h-4" />
                                <span>Siga-nos no Instagram</span>
                            </a>
                        </div>
                    )}
                </div>

                {/* 5. Os dois botões principais que direcionam para o agendamento e reservas */}
                <div className="flex w-full max-w-xl flex-col gap-2 mt-2">
                    <Button asChild className="w-full rounded-lg py-5 text-base font-semibold">
                        <Link href={`/${params.slug}/agendar`}>
                            Novo Agendamento
                        </Link>
                    </Button>

                    <Button asChild variant="outline" className="w-full rounded-lg py-5 text-base font-semibold">
                        <Link href={`/${params.slug}/reservas`}>
                            Minhas Reservas
                        </Link>
                    </Button>
                </div>

                <PublicProfileTabs slug={params.slug} services={barbershop.services} barbers={barbershop.barbers} />

                {/*
                <div className="grid w-full gap-4 text-left md:grid-cols-[1fr_280px]">
                    <section id="servicos" className="scroll-mt-6 rounded-xl border border-border bg-card p-5">
                        <div className="mb-4 flex items-center gap-2"><ScissorsIcon className="size-5 text-primary" /><h2 className="font-semibold">Serviços</h2></div>
                        <div className="space-y-2">
                            {barbershop.services.map((service) => (
                                <Link key={service.id} href={`/${params.slug}/agendar?serviceId=${service.id}`} className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 transition-colors hover:bg-secondary">
                                    <span className="font-medium">{service.name}</span>
                                    <span className="font-semibold text-foreground">R$ {Number(service.price).toFixed(2).replace('.', ',')}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                    <aside className="space-y-4">
                        <section id="profissionais" className="scroll-mt-6 rounded-xl border border-border bg-card p-5">
                            <div className="mb-3 flex items-center gap-2"><UsersIcon className="size-5 text-primary" /><h2 className="font-semibold">Profissionais</h2></div>
                            <div className="space-y-2">
                                {barbershop.barbers.map((barber) => <div key={barber.id} className="flex items-center gap-3"><Image src={formatImageUrl(barber.imageUrl) || "/avatar.png"} alt={barber.name} width={36} height={36} className="size-9 rounded-full object-cover" /><span className="text-sm">{barber.name}</span></div>)}
                            </div>
                        </section>
                        <section className="rounded-xl border border-border bg-card p-5">
                            <div className="mb-3 flex items-center gap-2"><BanknoteIcon className="size-5 text-primary" /><h2 className="font-semibold">Pagamento</h2></div>
                            <div className="flex flex-wrap gap-2">
                                {['Dinheiro', 'Pix', 'Cartão'].map((method) => <span key={method} className="rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">{method}</span>)}
                            </div>
                        </section>
                        <section className="rounded-xl border border-border bg-card p-5">
                            <div className="mb-3 flex items-center gap-2"><Clock3Icon className="size-5 text-primary" /><h2 className="font-semibold">Atendimento</h2></div>
                            <div className="space-y-2 text-xs text-muted-foreground">
                                <div className="flex justify-between"><span>Segunda a sexta</span><strong className="text-foreground">09:00 – 19:00</strong></div>
                                <div className="flex justify-between"><span>Sábado</span><strong className="text-foreground">09:00 – 17:00</strong></div>
                                <div className="flex justify-between"><span>Domingo</span><span>Fechado</span></div>
                            </div>
                        </section>
                    </aside>
                </div>

                <div className="grid w-full gap-4 text-left md:grid-cols-2">
                    <section id="pacotes" className="scroll-mt-6 rounded-xl border border-border bg-card p-5">
                        <div className="mb-3 flex items-center gap-2"><PackageIcon className="size-5 text-primary" /><h2 className="font-semibold">Pacotes</h2></div>
                        <p className="text-sm text-muted-foreground">Consulte a equipe para montar um pacote recorrente com seus serviços favoritos.</p>
                    </section>
                    <section id="avaliacoes" className="scroll-mt-6 rounded-xl border border-border bg-card p-5">
                        <div className="mb-3 flex items-center gap-2"><StarIcon className="size-5 text-primary" /><h2 className="font-semibold">Avaliações</h2></div>
                        <p className="text-sm text-muted-foreground">As avaliações dos clientes aparecerão aqui após os atendimentos.</p>
                    </section>
                </div>

                */}
                <div className="w-full border-t border-border pt-5 text-left">
                    <h2 className="mb-3 text-sm font-semibold">Contato</h2>
                    <div className="flex flex-col gap-2">
                        {whatsappNumber && (
                            <a
                                href={`https://wa.me/${whatsappNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-fit items-center gap-3 rounded-lg bg-muted px-4 py-2.5 text-sm transition-colors hover:bg-secondary"
                            >
                                <WhatsAppIcon className="size-5 text-primary" />
                                <span>Falar pelo WhatsApp</span>
                            </a>
                        )}
                        {barbershop.phones.map((phone) => (
                            <a key={phone} href={`tel:${phone.replace(/\D/g, "")}`} className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3 text-sm transition-colors hover:bg-secondary">
                                <PhoneIcon className="size-5 text-primary" />
                                <span>{phone}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
