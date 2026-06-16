import { db } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Button } from "@/app/_components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { MapPinIcon } from "lucide-react"

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

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Banner Superior da Barbearia (se houver, senão usa imagem padrão) */}
            <div className="relative w-full h-[200px] bg-muted">
                {bannerUrl ? (
                    <Image
                        src={bannerUrl}
                        alt={`Banner de ${barbershop.name}`}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Sem Banner Cadastrado
                    </div>
                )}
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6 max-w-md mx-auto">
                {/* Logo/Imagem da Barbearia */}
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary -mt-16 bg-background">
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

                    <div className="flex items-center gap-1 text-sm text-gray-400 justify-center">
                        <MapPinIcon className="w-3.5 h-3.5" />
                        <span>{barbershop.address}</span>
                    </div>

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
                <div className="w-full flex flex-col gap-3 mt-4">
                    <Link href={`/${params.slug}/agendar`} className="w-full">
                        <Button className="w-full py-6 text-lg font-semibold">
                            Novo Agendamento
                        </Button>
                    </Link>

                    <Link href={`/${params.slug}/reservas`} className="w-full">
                        <Button variant="outline" className="w-full py-6 text-lg font-semibold">
                            Minhas Reservas
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
