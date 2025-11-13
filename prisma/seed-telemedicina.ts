/**
 * Seed de Telemedicina - Crear 3 sesiones de prueba
 */

// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'vetconnect-secret-key-2024';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Helper function to generate room name
function generateRoomName(): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  return `vetconnect-${timestamp}-${random}`;
}

// Helper function to generate session token
function generateSessionToken(sesionId: number, citaId: number, roomName: string, expiresIn: string): string {
  return jwt.sign(
    {
      sesion_id: sesionId,
      cita_id: citaId,
      room_name: roomName,
      type: 'telemedicina',
    },
    JWT_SECRET,
    { expiresIn }
  );
}

async function main() {
  console.log('📹 Creando sesiones de telemedicina de prueba...\n');

  // Verificar si ya existen sesiones de telemedicina
  const sesionesExistentes = await prisma.sesionTelemedicina.count();

  if (sesionesExistentes > 0) {
    console.log('⚠️  Ya existen sesiones de telemedicina en la base de datos.');
    console.log(`   Total de sesiones existentes: ${sesionesExistentes}`);

    // Verificar si hay citas disponibles sin sesión
    const citasDisponibles = await prisma.cita.count({
      where: {
        tipo: 'TELEMEDICINA',
        estado: 'PROGRAMADA',
        sesion_telemedicina: null,
      }
    });

    console.log(`   Citas disponibles para crear sesión: ${citasDisponibles}\n`);

    if (citasDisponibles === 0) {
      console.log('💡 Creando citas adicionales sin sesión para pruebas...\n');
    } else {
      console.log('✅ Ya hay citas disponibles para crear sesiones.\n');
      return;
    }
  }

  // Obtener datos necesarios
  const centros = await prisma.centro.findMany();
  const veterinarios = await prisma.usuario.findMany({ where: { rol: 'VETERINARIO' } });
  const pacientes = await prisma.paciente.findMany({ include: { tutor: true } });

  if (centros.length === 0 || veterinarios.length === 0 || pacientes.length === 0) {
    console.log('❌ No se encontraron datos base. Ejecuta primero: npm run db:seed\n');
    return;
  }

  const ahora = new Date();

  // Crear citas de tipo TELEMEDICINA
  console.log('📅 Creando citas de telemedicina...');

  const citaTelemed1 = await prisma.cita.create({
    data: {
      centro_id: centros[0].id,
      paciente_id: pacientes[4]?.id || pacientes[0].id,
      tutor_id: pacientes[4]?.tutor_id || pacientes[0].tutor_id,
      veterinario_id: veterinarios[0].id,
      tipo: 'TELEMEDICINA',
      fecha: new Date(ahora.getTime() + 2 * 24 * 60 * 60 * 1000), // En 2 días
      hora: '15:00',
      duracion_minutos: 30,
      estado: 'PROGRAMADA',
      motivo: 'Consulta de seguimiento postoperatorio',
      observaciones: 'Revisión de evolución tras cirugía de cadera',
    },
  });

  const citaTelemed2 = await prisma.cita.create({
    data: {
      centro_id: centros[0].id,
      paciente_id: pacientes[3]?.id || pacientes[1].id,
      tutor_id: pacientes[3]?.tutor_id || pacientes[1].tutor_id,
      veterinario_id: veterinarios[1]?.id || veterinarios[0].id,
      tipo: 'TELEMEDICINA',
      fecha: new Date(ahora.getTime() + 4 * 24 * 60 * 60 * 1000), // En 4 días
      hora: '11:00',
      duracion_minutos: 30,
      estado: 'PROGRAMADA',
      motivo: 'Control de comportamiento',
      observaciones: 'Evaluación de problemas conductuales',
    },
  });

  const citaTelemed3 = await prisma.cita.create({
    data: {
      centro_id: centros[0].id,
      paciente_id: pacientes[2]?.id || pacientes[0].id,
      tutor_id: pacientes[2]?.tutor_id || pacientes[0].tutor_id,
      veterinario_id: veterinarios[2]?.id || veterinarios[0].id,
      tipo: 'TELEMEDICINA',
      fecha: new Date(ahora.getTime() + 1 * 24 * 60 * 60 * 1000), // Mañana
      hora: '16:30',
      duracion_minutos: 30,
      estado: 'PROGRAMADA',
      motivo: 'Asesoría nutricional',
      observaciones: 'Consulta sobre plan alimenticio',
    },
  });

  console.log('✅ 3 citas de telemedicina creadas\n');

  console.log('📹 Creando sesiones de telemedicina...');

  // Crear sesión 1 - PROGRAMADA
  const roomName1 = generateRoomName();
  const duracionHoras1 = 48;
  const expiraEn1 = new Date(citaTelemed1.fecha);
  expiraEn1.setHours(expiraEn1.getHours() + duracionHoras1);

  const sesion1 = await prisma.sesionTelemedicina.create({
    data: {
      cita_id: citaTelemed1.id,
      token_sala: 'temp-token-1',
      url_veterinario: 'temp-url-1',
      url_tutor: 'temp-url-1',
      room_name: roomName1,
      estado: 'PROGRAMADA',
      expira_en: expiraEn1,
      link_enviado: true,
      fecha_envio_link: new Date(),
      recetas_generadas: 0,
      examenes_solicitados: 0,
    },
  });

  const token1 = generateSessionToken(sesion1.id, citaTelemed1.id, roomName1, `${duracionHoras1}h`);
  await prisma.sesionTelemedicina.update({
    where: { id: sesion1.id },
    data: {
      token_sala: token1,
      url_veterinario: `${FRONTEND_URL}/telemedicina/sala/${roomName1}?token=${token1}&role=veterinario`,
      url_tutor: `${FRONTEND_URL}/telemedicina/sala/${roomName1}?token=${token1}&role=tutor`,
    },
  });

  console.log(`   ✓ Sesión 1 (PROGRAMADA): ${roomName1}`);

  // Crear sesión 2 - EN_CURSO
  const roomName2 = generateRoomName();
  const duracionHoras2 = 24;
  const expiraEn2 = new Date(citaTelemed2.fecha);
  expiraEn2.setHours(expiraEn2.getHours() + duracionHoras2);

  const sesion2 = await prisma.sesionTelemedicina.create({
    data: {
      cita_id: citaTelemed2.id,
      token_sala: 'temp-token-2',
      url_veterinario: 'temp-url-2',
      url_tutor: 'temp-url-2',
      room_name: roomName2,
      estado: 'EN_CURSO',
      fecha_inicio: new Date(),
      expira_en: expiraEn2,
      link_enviado: true,
      fecha_envio_link: new Date(ahora.getTime() - 1 * 60 * 60 * 1000), // Enviado hace 1 hora
      recetas_generadas: 0,
      examenes_solicitados: 1,
    },
  });

  const token2 = generateSessionToken(sesion2.id, citaTelemed2.id, roomName2, `${duracionHoras2}h`);
  await prisma.sesionTelemedicina.update({
    where: { id: sesion2.id },
    data: {
      token_sala: token2,
      url_veterinario: `${FRONTEND_URL}/telemedicina/sala/${roomName2}?token=${token2}&role=veterinario`,
      url_tutor: `${FRONTEND_URL}/telemedicina/sala/${roomName2}?token=${token2}&role=tutor`,
    },
  });

  // Actualizar cita a EN_CURSO
  await prisma.cita.update({
    where: { id: citaTelemed2.id },
    data: { estado: 'EN_CURSO' },
  });

  console.log(`   ✓ Sesión 2 (EN_CURSO): ${roomName2}`);

  // Crear sesión 3 - FINALIZADA
  const roomName3 = generateRoomName();
  const duracionHoras3 = 24;
  const fechaInicio3 = new Date(ahora.getTime() - 2 * 60 * 60 * 1000); // Inició hace 2 horas
  const fechaFin3 = new Date(ahora.getTime() - 30 * 60 * 1000); // Finalizó hace 30 minutos
  const duracionMinutos3 = Math.floor((fechaFin3.getTime() - fechaInicio3.getTime()) / (1000 * 60));

  const sesion3 = await prisma.sesionTelemedicina.create({
    data: {
      cita_id: citaTelemed3.id,
      token_sala: 'temp-token-3',
      url_veterinario: 'temp-url-3',
      url_tutor: 'temp-url-3',
      room_name: roomName3,
      estado: 'FINALIZADA',
      fecha_inicio: fechaInicio3,
      fecha_fin: fechaFin3,
      duracion_minutos: duracionMinutos3,
      expira_en: new Date(ahora.getTime() + 24 * 60 * 60 * 1000),
      link_enviado: true,
      fecha_envio_link: new Date(ahora.getTime() - 3 * 60 * 60 * 1000), // Enviado hace 3 horas
      notas_sesion: 'Sesión finalizada exitosamente. El tutor consultó sobre plan alimenticio. Se recomendó alimento premium con control de peso.',
      diagnostico: 'Paciente en buen estado general. Se recomienda dieta controlada.',
      recetas_generadas: 1,
      examenes_solicitados: 0,
    },
  });

  const token3 = generateSessionToken(sesion3.id, citaTelemed3.id, roomName3, `${duracionHoras3}h`);
  await prisma.sesionTelemedicina.update({
    where: { id: sesion3.id },
    data: {
      token_sala: token3,
      url_veterinario: `${FRONTEND_URL}/telemedicina/sala/${roomName3}?token=${token3}&role=veterinario`,
      url_tutor: `${FRONTEND_URL}/telemedicina/sala/${roomName3}?token=${token3}&role=tutor`,
    },
  });

  // Actualizar cita a COMPLETADA
  await prisma.cita.update({
    where: { id: citaTelemed3.id },
    data: { estado: 'COMPLETADA' },
  });

  console.log(`   ✓ Sesión 3 (FINALIZADA): ${roomName3}\n`);

  // Crear 2 citas adicionales SIN sesión para que puedan ser seleccionadas
  console.log('📅 Creando citas adicionales sin sesión...');

  await prisma.cita.create({
    data: {
      centro_id: centros[0].id,
      paciente_id: pacientes[1]?.id || pacientes[0].id,
      tutor_id: pacientes[1]?.tutor_id || pacientes[0].tutor_id,
      veterinario_id: veterinarios[0].id,
      tipo: 'TELEMEDICINA',
      fecha: new Date(ahora.getTime() + 5 * 24 * 60 * 60 * 1000), // En 5 días
      hora: '10:00',
      duracion_minutos: 30,
      estado: 'PROGRAMADA',
      motivo: 'Consulta sobre alimentación y nutrición',
      observaciones: 'Primera teleconsulta del paciente',
    },
  });

  await prisma.cita.create({
    data: {
      centro_id: centros[0].id,
      paciente_id: pacientes[0]?.id,
      tutor_id: pacientes[0]?.tutor_id,
      veterinario_id: veterinarios[1]?.id || veterinarios[0].id,
      tipo: 'TELEMEDICINA',
      fecha: new Date(ahora.getTime() + 6 * 24 * 60 * 60 * 1000), // En 6 días
      hora: '14:00',
      duracion_minutos: 30,
      estado: 'PROGRAMADA',
      motivo: 'Control de vacunas y calendario de inmunización',
      observaciones: 'Verificar estado del carnet de vacunas',
    },
  });

  console.log('✅ 2 citas adicionales creadas (sin sesión)\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED DE TELEMEDICINA COMPLETADO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📊 Resumen:');
  console.log('   • 5 Citas de telemedicina creadas (3 con sesión + 2 sin sesión)');
  console.log('   • 3 Sesiones de telemedicina creadas:');
  console.log('     - 1 PROGRAMADA (en 2 días)');
  console.log('     - 1 EN_CURSO (activa ahora)');
  console.log('     - 1 FINALIZADA (hace 30 minutos)');
  console.log('   • 2 Citas disponibles para crear nuevas sesiones\n');

  console.log('💡 Próximos pasos:');
  console.log('   1. Abre http://localhost:8080/telemedicina');
  console.log('   2. Verás las 3 sesiones con diferentes estados');
  console.log('   3. Puedes crear nuevas sesiones desde las 2 citas disponibles');
  console.log('   4. Puedes copiar enlaces e "Ingresar a Sala"\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('\n❌ Error ejecutando seed de telemedicina:');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
