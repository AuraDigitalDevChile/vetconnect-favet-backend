/**
 * Script para crear una cita de TELEMEDICINA para HOY
 */

import prisma from '../src/config/database';

async function crearCitaTelemedicinHoy() {
  try {
    const centro = await prisma.centro.findFirst();
    const paciente = await prisma.paciente.findFirst({
      where: { centro_id: centro!.id, nombre: { not: 'Max' } }, // Diferente paciente
      include: { tutor: true },
    });
    const veterinario = await prisma.usuario.findFirst({
      where: { centro_id: centro!.id, rol: 'VETERINARIO', activo: true },
    });

    const hoy = new Date();
    const fechaStr = hoy.toISOString().split('T')[0];

    const cita = await prisma.cita.create({
      data: {
        centro_id: centro!.id,
        paciente_id: paciente!.id,
        tutor_id: paciente!.tutor_id,
        veterinario_id: veterinario!.id,
        tipo: 'TELEMEDICINA',
        fecha: new Date(fechaStr),
        hora: '16:30',
        duracion_minutos: 30,
        motivo: 'Consulta virtual urgente',
        observaciones: 'Cita de prueba para demo inmediato',
        estado: 'PROGRAMADA',
        confirmada: false,
        recordatorio_enviado: false,
      },
    });

    console.log(`\n🎉 ¡Cita de TELEMEDICINA para HOY creada!`);
    console.log(`📅 Fecha: ${fechaStr} (HOY)`);
    console.log(`🕐 Hora: 16:30`);
    console.log(`🏥 Paciente: ${paciente!.nombre}`);
    console.log(`👨‍⚕️ Veterinario: ${veterinario!.nombre_completo}`);
    console.log(`📋 ID: ${cita.id}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

crearCitaTelemedicinHoy();
