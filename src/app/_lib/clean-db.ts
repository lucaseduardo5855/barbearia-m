import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando limpeza de barbearias duplicadas por NOME...")

  // 1. Busca todas as barbearias do banco
  const allBarbershops = await prisma.barbershop.findMany({
    orderBy: { createdAt: "asc" } // Pega a mais antiga primeiro
  })

  const seenNames = new Set<string>()
  const duplicatesToDelete: string[] = []

  for (const shop of allBarbershops) {
    // Normaliza o nome para evitar diferenças de maiúsculas/minúsculas
    const normalizedName = shop.name.trim().toLowerCase()
    
    if (seenNames.has(normalizedName)) {
      duplicatesToDelete.push(shop.id)
    } else {
      seenNames.add(normalizedName)
    }
  }

  console.log(`Encontradas ${duplicatesToDelete.length} barbearias duplicadas por nome para remoção.`)

  if (duplicatesToDelete.length > 0) {
    // 2. Deleta agendamentos vinculados a essas barbearias duplicadas
    const deletedBookings = await prisma.booking.deleteMany({
      where: {
        service: {
          barbershopId: { in: duplicatesToDelete }
        }
      }
    })
    console.log(`Removidos ${deletedBookings.count} agendamentos associados a barbearias duplicadas.`)

    // 3. Deleta os serviços das barbearias duplicadas
    const deletedServices = await prisma.barbershopService.deleteMany({
      where: {
        barbershopId: { in: duplicatesToDelete }
      }
    })
    console.log(`Removidos ${deletedServices.count} serviços associados a barbearias duplicadas.`)

    // 4. Deleta os profissionais (barbeiros) das barbearias duplicadas
    const deletedBarbers = await prisma.barber.deleteMany({
      where: {
        barbershopId: { in: duplicatesToDelete }
      }
    })
    console.log(`Removidos ${deletedBarbers.count} barbeiros associados a barbearias duplicadas.`)

    // 5. Finalmente, deleta as barbearias duplicadas
    const deletedShops = await prisma.barbershop.deleteMany({
      where: {
        id: { in: duplicatesToDelete }
      }
    })
    console.log(`Removidas ${deletedShops.count} barbearias duplicadas com sucesso.`)
  }

  console.log("Limpeza concluída!")
}

main()
  .catch((e) => {
    console.error("Erro durante a execução:", e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
