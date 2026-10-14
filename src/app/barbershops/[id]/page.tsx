import PhoneItem from "@/app/_components/phone-item"
import ServiceItem from "@/app/_components/service-item"
import SidebarSheet from "@/app/_components/sidebar-sheet"
import { Button } from "@/app/_components/ui/button"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { db } from "@/lib/prisma"
import { ChevronLeftIcon, StarIcon, MapPinIcon, MenuIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

interface BarbershopPageProps {
  params: {
    id: string
  }
}

const BarbershopPage = async ({ params }: BarbershopPageProps) => {
  //chamar bd
  const barbershop = await db.barbershop.findUnique({
    where: {
      id: params.id,
    },
    include: {
      services: true, // Incluir os serviços oferecidos pela barbearia
    },
  })

  barbershop?.services

  //se não tiver barbearia, mostrar página de 404
  if (!barbershop) {
    return notFound()
  }

  if (barbershop.slug) {
    redirect(`/${barbershop.slug}`)
  }

  return (
    <div>
      {/* IMAGEM */}
      <div className="relative h-[250px] w-full bg-primary md:h-[320px]">
        {barbershop.bannerUrl && (
          <Image
            alt={`Banner de ${barbershop.name}`}
            src={barbershop.bannerUrl}
            fill
            sizes="100vw"
            className="object-cover"
          />
        )}

        <Button
          size="icon"
          variant="secondary"
          aria-label="Voltar"
          className="absolute left-4 top-4"
          asChild
        >
          <Link href="/">
            <ChevronLeftIcon />
          </Link>
        </Button>

        {/* Botão do Menu-Hamburguer */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              aria-label="Abrir menu"
              className="absolute right-4 top-4"
            >
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SidebarSheet />
        </Sheet>
      </div>

      {/* Nome e Endereço */}
      <main className="mx-auto w-full max-w-6xl md:px-6">
      <div className="border-b border-solid p-5 md:px-8 md:py-7">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-primary bg-background md:size-20">
            <Image
              alt={`Logo da ${barbershop.name}`}
              src={barbershop.imageUrl}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <h1 className="text-xl font-bold md:text-3xl">{barbershop.name}</h1>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barbershop.address)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir o endereço da ${barbershop.name} no Google Maps`}
          className="mb-2 flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary hover:underline md:text-base"
        >
          <MapPinIcon className="size-[18px] text-primary" />
          <span>{barbershop.address}</span>
        </a>

        <div className="flex items-center gap-2">
          <StarIcon className="fill-primary text-primary" />
          <p className="text-sm text-muted-foreground">5,0 (482 avaliações)</p>
        </div>
      </div>

      {/* DESCRIÇÃO */}
      <div className="space-y-2 border-b border-solid p-5 md:px-8 md:py-7">
        <h2 className="text-xs font-bold uppercase text-primary/80">Sobre nós</h2>
        <p className="justify-text text-sm">{barbershop?.description}</p>
      </div>

      {/* SERVIÇOS */}
      <div className="border-bottom space-y-3 border-solid p-5 md:px-8 md:py-7">
        <h2 className="text-xs font-bold uppercase text-primary/80">Serviços</h2>
        <div className="space-y-3 pt-3">
          {barbershop.services.map((service) => (
            <ServiceItem
              key={service.id}
              barberShop={JSON.parse(JSON.stringify(barbershop))}
              service={JSON.parse(JSON.stringify(service))}
            />
          ))}
        </div>
      </div>

      {/* CONTATO */}
      <div className="space-y-3 p-5 text-foreground">
        {barbershop.phones.map((phone) => (
          <PhoneItem phone={phone} key={phone} />
        ))}
      </div>
      </main>
    </div>
  )
}

export default BarbershopPage
