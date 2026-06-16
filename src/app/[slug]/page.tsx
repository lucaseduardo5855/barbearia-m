import { db } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Button } from "@/app/_components/ui/button"
import Link from "next/link"
import Image from "next/image"

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

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Banner Superior da Barbearia (se houver, senão usa imagem padrão) */}
            <div className="relative w-full h-[200px] bg-muted">
                {barbershop.bannerUrl ? (
                    <Image
                        src={barbershop.bannerUrl}
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
                    <Image
                        src={barbershop.imageUrl}
                        alt={barbershop.name}
                        fill
                        className="object-cover"
                    />
                </div>

                {/* Nome e Mensagem de Boas-Vindas */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">{barbershop.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        {barbershop.welcomeMessage || "Bem-vindo ao nosso sistema de agendamentos!"}
                    </p>
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
