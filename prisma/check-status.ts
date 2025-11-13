import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== VERIFICANDO ESTADO DE TELEMEDICINA ===\n');

  const sesiones = await prisma.sesionTelemedicina.findMany({
    include: {
      cita: {
        include: {
          paciente: true,
        }
      }
    }
  });

  const citasTotal = await prisma.cita.findMany({
    where: { tipo: 'TELEMEDICINA' },
    include: {
      paciente: true,
      sesion_telemedicina: true,
    }
  });

  const citasSinSesion = citasTotal.filter(c => !c.sesion_telemedicina && c.estado === 'PROGRAMADA');

  console.log('📊 RESUMEN:');
  console.log(`   Total sesiones: ${sesiones.length}`);
  console.log(`   Total citas TELEMEDICINA: ${citasTotal.length}`);
  console.log(`   Citas disponibles (sin sesión): ${citasSinSesion.length}\n`);

  console.log('📹 SESIONES:');
  sesiones.forEach((s, i) => {
    console.log(`   ${i + 1}. ${s.estado} - ${s.cita.paciente?.nombre || 'Sin paciente'} (Cita ID: ${s.cita_id})`);
  });

  console.log('\n📅 CITAS SIN SESIÓN:');
  if (citasSinSesion.length === 0) {
    console.log('   ⚠️  No hay citas disponibles para crear sesiones');
  } else {
    citasSinSesion.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.paciente?.nombre || 'Sin paciente'} - ${c.fecha} ${c.hora} (ID: ${c.id})`);
    });
  }

  console.log('\n✅ Verificación completada\n');
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
