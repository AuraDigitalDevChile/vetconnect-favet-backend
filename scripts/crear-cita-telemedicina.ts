/**
 * Script para crear una cita de TELEMEDICINA de prueba
 * Ejecutar con: npx ts-node scripts/crear-cita-telemedicina.ts
 */

import prisma from '../src/config/database';

async function crearCitaTelemedicina() {
  try {
    // 1. Obtener el primer centro
    const centro = await prisma.centro.findFirst();
    if (!centro) {
      console.error('❌ No se encontró ningún centro');
      return;
    }
    console.log(`✅ Centro: ${centro.nombre} (ID: ${centro.id})`);

    // 2. Obtener el primer paciente
    const paciente = await prisma.paciente.findFirst({
      where: { centro_id: centro.id },
      include: { tutor: true },
    });
    if (!paciente) {
      console.error('❌ No se encontró ningún paciente');
      return;
    }
    console.log(`✅ Paciente: ${paciente.nombre} (ID: ${paciente.id})`);

    // 3. Obtener el primer veterinario
    const veterinario = await prisma.usuario.findFirst({
      where: {
        centro_id: centro.id,
        rol: 'VETERINARIO',
        activo: true,
      },
    });
    if (!veterinario) {
      console.error('❌ No se encontró ningún veterinario');
      return;
    }
    console.log(`✅ Veterinario: ${veterinario.nombre_completo} (ID: ${veterinario.id})`);

    // 4. Crear cita de TELEMEDICINA para mañana
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const fechaStr = manana.toISOString().split('T')[0];

    const cita = await prisma.cita.create({
      data: {
        centro_id: centro.id,
        paciente_id: paciente.id,
        tutor_id: paciente.tutor_id,
        veterinario_id: veterinario.id,
        tipo: 'TELEMEDICINA',
        fecha: new Date(fechaStr),
        hora: '14:00',
        duracion_minutos: 30,
        motivo: 'Consulta virtual de seguimiento',
        observaciones: 'Cita de prueba para demo de telemedicina',
        estado: 'PROGRAMADA',
        confirmada: false,
        recordatorio_enviado: false,
      },
    });

    console.log('\n🎉 ¡Cita de TELEMEDICINA creada exitosamente!');
    console.log(`📅 Fecha: ${fechaStr}`);
    console.log(`🕐 Hora: 14:00`);
    console.log(`🏥 Paciente: ${paciente.nombre}`);
    console.log(`👨‍⚕️ Veterinario: ${veterinario.nombre_completo}`);
    console.log(`📋 ID: ${cita.id}`);
    console.log(`\n✨ Ya puedes ir a Telemedicina y crear una sesión desde esta cita`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearCitaTelemedicina();
