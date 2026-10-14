import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Populando serviços padrão em todas as barbearias ativas...")

  // 1. Busca todas as barbearias do banco
  const allBarbershops = await prisma.barbershop.findMany()

  // 2. Dados padrões de serviço
  const servicesData = [
    {
      name: "Cabelo",
      price: 45.0,
      description: "Corte clássico ou moderno com lavagem inclusa.",
      imageUrl: "https://images.unsplash.com/photo-1599351431247-f579338af7b6?q=80&w=300"
    },
    {
      name: "Barba",
      price: 35.0,
      description: "Barba desenhada com toalha quente e navalha.",
      imageUrl: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=300"
    },
    {
      name: "Acabamento",
      price: 20.0,
      description: "Alinhamento do pezinho e contornos do cabelo.",
      imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=300"
    }
  ]

  // 3. Nomes de barbeiros para variação
  const barberNames = ["Marcio", "Renato", "Eduardo", "Claudio", "Thiago"]

  for (const shop of allBarbershops) {
    // Verifica se a barbearia já tem serviços cadastrados para não duplicar
    const existingServices = await prisma.barbershopService.findMany({
      where: { barbershopId: shop.id }
    })

    if (existingServices.length === 0) {
      console.log(`- Cadastrando serviços para: ${shop.name} (${shop.slug})`)
      
      // Cria os serviços
      for (const s of servicesData) {
        await prisma.barbershopService.create({
          data: {
            name: s.name,
            price: s.price,
            description: s.description,
            imageUrl: s.imageUrl,
            barbershopId: shop.id
          }
        })
      }

      // Cria pelo menos um barbeiro para a barbearia
      const randomBarberName = barberNames[Math.floor(Math.random() * barberNames.length)]
      await prisma.barber.create({
        data: {
          name: randomBarberName,
          imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300",
          barbershopId: shop.id
        }
      })
    }
  }

  console.log("População de dados concluída!")
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
