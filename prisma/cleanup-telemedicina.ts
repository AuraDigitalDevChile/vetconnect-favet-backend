import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Eliminando sesiones de telemedicina existentes...');

  await prisma.sesionTelemedicina.deleteMany({});
  console.log('   ✓ Sesiones eliminadas');

  await prisma.cita.deleteMany({ where: { tipo: 'TELEMEDICINA' } });
  console.log('   ✓ Citas de telemedicina eliminadas');

  console.log('\n✅ Limpieza completada\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
