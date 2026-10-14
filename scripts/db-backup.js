const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function runBackup() {
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dbUrl = process.env.DATABASE_URL;

  console.log('🔄 Iniciando processo de backup do banco de dados...');

  // 1. Tentar executar pg_dump se disponível no ambiente
  let pgDumpSuccess = false;
  try {
    execSync('pg_dump --version', { stdio: 'ignore' });
    if (dbUrl) {
      const sqlFile = path.join(backupsDir, `dump_${timestamp}.sql`);
      console.log(`📦 Executando pg_dump nativo para ${sqlFile}...`);
      execSync(`pg_dump "${dbUrl}" -f "${sqlFile}"`, { stdio: 'inherit' });
      console.log(`✅ Backup SQL gerado com sucesso em: ${sqlFile}`);
      pgDumpSuccess = true;
    }
  } catch (err) {
    // pg_dump não está no PATH do Windows
    console.log('ℹ️  pg_dump não encontrado no PATH do sistema. Usando snapshot via Prisma ORM...');
  }

  // 2. Snapshot de segurança dos dados com Prisma (garante backup independente do OS)
  try {
    console.log('📥 Exportando tabelas do banco de dados...');
    const snapshot = {
      timestamp: new Date().toISOString(),
      users: await prisma.user.findMany(),
      barbershops: await prisma.barbershop.findMany(),
      services: await prisma.barbershopService.findMany(),
      barbers: await prisma.barber.findMany(),
      bookings: await prisma.booking.findMany(),
      subscriptionPayments: await prisma.subscriptionPayment.findMany(),
    };

    const jsonFile = path.join(backupsDir, `snapshot_${timestamp}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(snapshot, null, 2), 'utf-8');

    console.log(`✅ Snapshot JSON completo exportado com sucesso:`);
    console.log(`   📁 Arquivo: ${jsonFile}`);
    console.log(`   📊 Estatísticas:`);
    console.log(`      - Barbearias: ${snapshot.barbershops.length}`);
    console.log(`      - Usuários: ${snapshot.users.length}`);
    console.log(`      - Serviços: ${snapshot.services.length}`);
    console.log(`      - Barbeiros: ${snapshot.barbers.length}`);
    console.log(`      - Agendamentos: ${snapshot.bookings.length}`);
    console.log(`      - Mensalidades SaaS (Pix): ${snapshot.subscriptionPayments.length}`);
  } catch (error) {
    console.error('❌ Erro ao exportar dados via Prisma:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();
