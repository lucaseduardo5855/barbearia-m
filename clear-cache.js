const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Limpando cache de consultas do PostgreSQL na Neon...')
    await prisma.$executeRawUnsafe('DEALLOCATE ALL')
    await prisma.$executeRawUnsafe('DISCARD ALL')
    console.log('✅ Cache limpo com sucesso!')
  } catch (error) {
    console.error('Erro ao limpar cache:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
