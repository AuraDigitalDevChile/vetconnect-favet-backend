/**
 * VetConnect FAVET - Seed Database
 * Script para poblar la base de datos con datos de prueba
 */

// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unused-vars */

import { PrismaClient } from '@prisma/client';
import { AuthUtils } from '../src/utils/auth.utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  // ==========================================
  // 1. CENTROS VETERINARIOS
  // ==========================================
  console.log('📍 Creando centros veterinarios...');

  const centroBilbao = await prisma.centro.upsert({
    where: { codigo: 'BILBAO' },
    update: {},
    create: {
      nombre: 'Hospital Clínico Veterinario Bilbao',
      codigo: 'BILBAO',
      direccion: 'Av. Santa Rosa 11735, La Pintana, Santiago',
      telefono: '+56 2 2978 5700',
      email: 'contacto@bilbao.favet.uchile.cl',
      capacidad_usuarios: 80,
    },
  });

  const centroElRoble = await prisma.centro.upsert({
    where: { codigo: 'ELROBLE' },
    update: {},
    create: {
      nombre: 'Hospital Clínico Veterinario El Roble',
      codigo: 'ELROBLE',
      direccion: 'Av. Larraín 9750, La Reina, Santiago',
      telefono: '+56 2 2978 5800',
      email: 'contacto@elroble.favet.uchile.cl',
      capacidad_usuarios: 100,
    },
  });

  const centroHospital = await prisma.centro.upsert({
    where: { codigo: 'HOSPITAL' },
    update: {},
    create: {
      nombre: 'Hospital Docente Veterinario FAVET',
      codigo: 'HOSPITAL',
      direccion: 'Av. Santa Rosa 11735, La Pintana, Santiago',
      telefono: '+56 2 2978 5600',
      email: 'contacto@hospital.favet.uchile.cl',
      capacidad_usuarios: 50,
    },
  });

  console.log('✅ 3 centros creados\n');

  // ==========================================
  // 2. USUARIOS (Diferentes roles)
  // ==========================================
  console.log('👥 Creando usuarios...');

  const passwordHash = await AuthUtils.hashPassword('admin123');

  // Admin - Bilbao
  const adminBilbao = await prisma.usuario.upsert({
    where: { email: 'admin@vetconnect.cl' },
    update: {},
    create: {
      centro_id: centroBilbao.id,
      nombre_completo: 'Carlos Administrador',
      email: 'admin@vetconnect.cl',
      rut: '12345678-9',
      password_hash: passwordHash,
      rol: 'ADMIN',
      telefono: '+56912345678',
    },
  });

  // Veterinarios
  const vet1 = await prisma.usuario.upsert({
    where: { email: 'dra.rodriguez@vetconnect.cl' },
    update: {},
    create: {
      centro_id: centroBilbao.id,
      nombre_completo: 'Dra. María Rodríguez',
      email: 'dra.rodriguez@vetconnect.cl',
      rut: '11111111-1',
      password_hash: passwordHash,
      rol: 'VETERINARIO',
      telefono: '+56911111111',
    },
  });

  const vet2 = await prisma.usuario.upsert({
    where: { email: 'dr.fernandez@vetconnect.cl' },
    update: {},
    create: {
      centro_id: centroBilbao.id,
      nombre_completo: 'Dr. Pedro Fernández',
      email: 'dr.fernandez@vetconnect.cl',
      rut: '22222222-2',
      password_hash: passwordHash,
      rol: 'VETERINARIO',
      telefono: '+56922222222',
    },
  });

  const vet3 = await prisma.usuario.upsert({
    where: { email: 'dra.lopez@vetconnect.cl' },
    update: {},
    create: {
      centro_id: centroElRoble.id,
      nombre_completo: 'Dra. Ana López',
      email: 'dra.lopez@vetconnect.cl',
      rut: '33333333-3',
      password_hash: passwordHash,
      rol: 'VETERINARIO',
      telefono: '+56933333333',
    },
  });

  // Recepcionistas
  const recep1 = await prisma.usuario.upsert({
    where: { email: 'sofia.recepcion@vetconnect.cl' },
    update: {},
    create: {
      centro_id: centroBilbao.id,
      nombre_completo: 'Sofía Recepcionista',
      email: 'sofia.recepcion@vetconnect.cl',
      rut: '44444444-4',
      password_hash: passwordHash,
      rol: 'RECEPCIONISTA',
      telefono: '+56944444444',
    },
  });

  const recep2 = await prisma.usuario.upsert({
    where: { email: 'juan.recepcion@vetconnect.cl' },
    update: {},
    create: {
      centro_id: centroElRoble.id,
      nombre_completo: 'Juan Recepcionista',
      email: 'juan.recepcion@vetconnect.cl',
      rut: '55555555-5',
      password_hash: passwordHash,
      rol: 'RECEPCIONISTA',
      telefono: '+56955555555',
    },
  });

  // Asistentes
  const asist1 = await prisma.usuario.upsert({
    where: { email: 'carmen.asistente@vetconnect.cl' },
    update: {},
    create: {
      centro_id: centroBilbao.id,
      nombre_completo: 'Carmen Asistente',
      email: 'carmen.asistente@vetconnect.cl',
      rut: '66666666-6',
      password_hash: passwordHash,
      rol: 'ASISTENTE',
      telefono: '+56966666666',
    },
  });

  console.log('✅ 8 usuarios creados (1 admin, 3 veterinarios, 2 recepcionistas, 1 asistente)\n');

  // ==========================================
  // 3. TUTORES
  // ==========================================
  console.log('🧑 Creando tutores...');

  const tutor1 = await prisma.tutor.upsert({
    where: { rut: '15111111-1' },
    update: {},
    create: {
      nombre_completo: 'María González Pérez',
      rut: '15111111-1',
      email: 'maria.gonzalez@example.com',
      telefono: '+56987654321',
      direccion: 'Av. Providencia 1234, Providencia, Santiago',
    },
  });

  const tutor2 = await prisma.tutor.upsert({
    where: { rut: '16222222-2' },
    update: {},
    create: {
      nombre_completo: 'Juan Pérez Soto',
      rut: '16222222-2',
      email: 'juan.perez@example.com',
      telefono: '+56998765432',
      direccion: 'Calle San Diego 456, Santiago Centro',
    },
  });

  const tutor3 = await prisma.tutor.upsert({
    where: { rut: '17333333-3' },
    update: {},
    create: {
      nombre_completo: 'Carolina Muñoz Silva',
      rut: '17333333-3',
      email: 'carolina.munoz@example.com',
      telefono: '+56976543210',
      direccion: 'Av. Las Condes 7890, Las Condes, Santiago',
    },
  });

  const tutor4 = await prisma.tutor.upsert({
    where: { rut: '18444444-4' },
    update: {},
    create: {
      nombre_completo: 'Roberto Silva Vargas',
      rut: '18444444-4',
      email: 'roberto.silva@example.com',
      telefono: '+56965432109',
      direccion: 'Pasaje Los Laureles 321, Ñuñoa, Santiago',
      notas: 'Cliente frecuente, preguntar por descuentos',
    },
  });

  const tutor5 = await prisma.tutor.upsert({
    where: { rut: '19555555-5' },
    update: {},
    create: {
      nombre_completo: 'Fernanda Torres Rojas',
      rut: '19555555-5',
      email: 'fernanda.torres@example.com',
      telefono: '+56954321098',
      direccion: 'Av. Vicuña Mackenna 567, La Florida, Santiago',
    },
  });

  console.log('✅ 5 tutores creados\n');

  // ==========================================
  // 4. PACIENTES (Variados)
  // ==========================================
  console.log('🐾 Creando pacientes...');

  const paciente1 = await prisma.paciente.create({
    data: {
      centro_id: centroBilbao.id,
      tutor_id: tutor1.id,
      numero_ficha: 'BLB-0001',
      nombre: 'Max',
      especie: 'CANINO',
      raza: 'Golden Retriever',
      sexo: 'MACHO',
      estado_reproductivo: 'CASTRADO',
      fecha_nacimiento: new Date('2020-05-15'),
      peso_kg: 32.5,
      tamanio: 'GRANDE',
      caracter: 'DOCIL',
      color: 'Dorado',
      chip: '941000012345678',
      notas: 'Muy sociable, ama los niños',
    },
  });

  const paciente2 = await prisma.paciente.create({
    data: {
      centro_id: centroBilbao.id,
      tutor_id: tutor1.id,
      numero_ficha: 'BLB-0002',
      nombre: 'Luna',
      especie: 'FELINO',
      raza: 'Persa',
      sexo: 'HEMBRA',
      estado_reproductivo: 'ESTERILIZADO',
      fecha_nacimiento: new Date('2021-03-20'),
      peso_kg: 4.2,
      tamanio: 'PEQUENO',
      caracter: 'NERVIOSO',
      color: 'Blanco',
      chip: '941000012345679',
      notas: 'Asustadiza con extraños',
    },
  });

  const paciente3 = await prisma.paciente.create({
    data: {
      centro_id: centroBilbao.id,
      tutor_id: tutor2.id,
      numero_ficha: 'BLB-0003',
      nombre: 'Rocky',
      especie: 'CANINO',
      raza: 'Pitbull',
      sexo: 'MACHO',
      estado_reproductivo: 'CASTRADO',
      fecha_nacimiento: new Date('2019-08-10'),
      peso_kg: 28.0,
      tamanio: 'MEDIANO',
      caracter: 'DOCIL',
      color: 'Café oscuro',
      chip: '941000012345680',
    },
  });

  const paciente4 = await prisma.paciente.create({
    data: {
      centro_id: centroBilbao.id,
      tutor_id: tutor2.id,
      numero_ficha: 'BLB-0004',
      nombre: 'Michi',
      especie: 'FELINO',
      raza: 'Mestizo',
      sexo: 'MACHO',
      estado_reproductivo: 'ENTERO',
      fecha_nacimiento: new Date('2022-01-15'),
      peso_kg: 3.8,
      tamanio: 'PEQUENO',
      caracter: 'DOCIL',
      color: 'Gris atigrado',
    },
  });

  const paciente5 = await prisma.paciente.create({
    data: {
      centro_id: centroBilbao.id,
      tutor_id: tutor3.id,
      numero_ficha: 'BLB-0005',
      nombre: 'Bella',
      especie: 'CANINO',
      raza: 'Labrador',
      sexo: 'HEMBRA',
      estado_reproductivo: 'ESTERILIZADO',
      fecha_nacimiento: new Date('2018-11-05'),
      peso_kg: 30.0,
      tamanio: 'GRANDE',
      caracter: 'DOCIL',
      color: 'Negro',
      chip: '941000012345681',
      notas: 'Entrenada como perro de asistencia',
    },
  });

  const paciente6 = await prisma.paciente.create({
    data: {
      centro_id: centroElRoble.id,
      tutor_id: tutor4.id,
      numero_ficha: 'ROB-0001',
      nombre: 'Toby',
      especie: 'CANINO',
      raza: 'Chihuahua',
      sexo: 'MACHO',
      estado_reproductivo: 'ENTERO',
      fecha_nacimiento: new Date('2021-06-20'),
      peso_kg: 2.5,
      tamanio: 'PEQUENO',
      caracter: 'NERVIOSO',
      color: 'Café claro',
      chip: '941000012345682',
    },
  });

  const paciente7 = await prisma.paciente.create({
    data: {
      centro_id: centroElRoble.id,
      tutor_id: tutor5.id,
      numero_ficha: 'ROB-0002',
      nombre: 'Simba',
      especie: 'FELINO',
      raza: 'Maine Coon',
      sexo: 'MACHO',
      estado_reproductivo: 'CASTRADO',
      fecha_nacimiento: new Date('2020-09-12'),
      peso_kg: 7.8,
      tamanio: 'GRANDE',
      caracter: 'DOCIL',
      color: 'Naranja atigrado',
      chip: '941000012345683',
      notas: 'Raza grande, muy tranquilo',
    },
  });

  const paciente8 = await prisma.paciente.create({
    data: {
      centro_id: centroElRoble.id,
      tutor_id: tutor5.id,
      numero_ficha: 'ROB-0003',
      nombre: 'Nala',
      especie: 'FELINO',
      raza: 'Siamés',
      sexo: 'HEMBRA',
      estado_reproductivo: 'ESTERILIZADO',
      fecha_nacimiento: new Date('2021-12-01'),
      peso_kg: 3.5,
      tamanio: 'PEQUENO',
      caracter: 'DOCIL',
      color: 'Crema con puntas oscuras',
    },
  });

  console.log('✅ 8 pacientes creados (5 caninos, 3 felinos)\n');

  // ==========================================
  // 5. CITAS DE EJEMPLO
  // ==========================================
  console.log('📅 Creando citas...');

  const ahora = new Date();
  const manana = new Date(ahora);
  manana.setDate(manana.getDate() + 1);
  const proximaSemana = new Date(ahora);
  proximaSemana.setDate(proximaSemana.getDate() + 7);

  const cita1 = await prisma.cita.create({
    data: {
      centro_id: centroBilbao.id,
      paciente_id: paciente1.id,
      tutor_id: tutor1.id,
      veterinario_id: vet1.id,
      tipo: 'CONTROL',
      fecha: manana,
      hora: '10:00',
      duracion_minutos: 30,
      estado: 'CONFIRMADA',
      motivo: 'Control post-operatorio',
      observaciones: 'Revisión de cicatrización',
    },
  });

  const cita2 = await prisma.cita.create({
    data: {
      centro_id: centroBilbao.id,
      paciente_id: paciente2.id,
      tutor_id: tutor1.id,
      veterinario_id: vet3.id,
      tipo: 'CONSULTA_GENERAL',
      fecha: proximaSemana,
      hora: '14:30',
      duracion_minutos: 45,
      estado: 'PROGRAMADA',
      motivo: 'Problema dermatológico',
      observaciones: 'Se rasca constantemente',
    },
  });

  const cita3 = await prisma.cita.create({
    data: {
      centro_id: centroBilbao.id,
      paciente_id: paciente3.id,
      tutor_id: tutor2.id,
      veterinario_id: vet2.id,
      tipo: 'VACUNACION',
      fecha: new Date(ahora.getTime() + 3 * 24 * 60 * 60 * 1000),
      hora: '09:00',
      duracion_minutos: 20,
      estado: 'PROGRAMADA',
      motivo: 'Vacuna anual',
    },
  });

  console.log('✅ 3 citas creadas\n');

  // ==========================================
  // 6. INVENTARIO
  // ==========================================
  console.log('📦 Creando items de inventario...');

  const item1 = await prisma.inventario.create({
    data: {
      centro_id: centroBilbao.id,
      sku_interno: 'MED-001',
      codigo_barras: '7890123456789',
      nombre: 'Amoxicilina 500mg',
      categoria: 'FARMACO',
      unidad_medida: 'Comprimido',
      stock_actual: 500,
      stock_minimo: 100,
      precio_compra: 150.0,
      precio_venta: 250.0,
      es_farmaco: true,
      lote: 'LOT-2024-001',
      fecha_vencimiento: new Date('2025-12-31'),
    },
  });

  const item2 = await prisma.inventario.create({
    data: {
      centro_id: centroBilbao.id,
      sku_interno: 'INS-001',
      codigo_barras: '7890123456790',
      nombre: 'Jeringa 5ml',
      categoria: 'INSUMO',
      unidad_medida: 'Unidad',
      stock_actual: 1000,
      stock_minimo: 200,
      precio_compra: 50.0,
      precio_venta: 100.0,
    },
  });

  const item3 = await prisma.inventario.create({
    data: {
      centro_id: centroBilbao.id,
      sku_interno: 'MED-002',
      codigo_barras: '7890123456791',
      nombre: 'Antipulgas Spot-On',
      categoria: 'PRODUCTO_VENTA',
      unidad_medida: 'Pipeta',
      stock_actual: 150,
      stock_minimo: 50,
      precio_compra: 3500.0,
      precio_venta: 6500.0,
      lote: 'LOT-2024-002',
      fecha_vencimiento: new Date('2026-06-30'),
    },
  });

  const item4 = await prisma.inventario.create({
    data: {
      centro_id: centroBilbao.id,
      sku_interno: 'MED-003',
      codigo_barras: '7890123456792',
      nombre: 'Ketoprofeno 10mg/ml',
      categoria: 'FARMACO',
      unidad_medida: 'ml',
      stock_actual: 200,
      stock_minimo: 50,
      precio_compra: 2000.0,
      precio_venta: 3500.0,
      es_farmaco: true,
      lote: 'LOT-2024-003',
      fecha_vencimiento: new Date('2025-08-31'),
      descripcion: 'Antiinflamatorio no esteroideo',
    },
  });

  console.log('✅ 4 items de inventario creados\n');

  // ==========================================
  // 7. PROVEEDORES
  // ==========================================
  console.log('🏢 Creando proveedores...');

  const proveedor1 = await prisma.proveedor.create({
    data: {
      rut: '76123456-7',
      razon_social: 'Laboratorio Veterinario Chile SpA',
      nombre_contacto: 'José Martínez',
      email: 'ventas@labvetchile.cl',
      telefono: '+56223456789',
      direccion: 'Av. Vicuña Mackenna 4860, Macul, Santiago',
    },
  });

  const proveedor2 = await prisma.proveedor.create({
    data: {
      rut: '77234567-8',
      razon_social: 'MedSupply Veterinaria Ltda',
      nombre_contacto: 'Andrea Silva',
      email: 'contacto@medsupply.cl',
      telefono: '+56227654321',
      direccion: 'Calle Los Leones 1234, Providencia, Santiago',
    },
  });

  console.log('✅ 2 proveedores creados\n');

  // ==========================================
  // 8. CONVENIOS
  // ==========================================
  console.log('🤝 Creando convenios...');

  const convenio1 = await prisma.convenio.create({
    data: {
      nombre: 'Convenio Municipalidad La Pintana',
      descripcion: 'Convenio con Municipalidad de La Pintana. Contacto: Patricia González (patricia.gonzalez@lapintana.cl, +56223344556). Descuento especial en esterilizaciones.',
      descuento_examenes: 15.0,
      descuento_procedimientos: 20.0,
      descuento_productos: 10.0,
      descuento_cirugias: 25.0,
      descuento_hospitalizacion: 15.0,
      activo: true,
    },
  });

  const convenio2 = await prisma.convenio.create({
    data: {
      nombre: 'Convenio Universidad de Chile - Funcionarios',
      descripcion: 'Convenio para funcionarios de la Universidad de Chile. Contacto: Departamento de Recursos Humanos (rrhh@uchile.cl, +56229782000). Descuento general en todas las atenciones.',
      descuento_examenes: 15.0,
      descuento_procedimientos: 15.0,
      descuento_productos: 15.0,
      descuento_cirugias: 15.0,
      descuento_hospitalizacion: 15.0,
      activo: true,
    },
  });

  console.log('✅ 2 convenios creados\n');

  // ==========================================
  // RESUMEN FINAL
  // ==========================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED COMPLETADO EXITOSAMENTE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📊 Resumen de datos creados:');
  console.log(`   • 3 Centros veterinarios`);
  console.log(`   • 8 Usuarios (1 admin, 3 veterinarios, 2 recepcionistas, 1 asistente)`);
  console.log(`   • 5 Tutores`);
  console.log(`   • 8 Pacientes (5 caninos, 3 felinos)`);
  console.log(`   • 3 Citas programadas`);
  console.log(`   • 4 Items de inventario`);
  console.log(`   • 2 Proveedores`);
  console.log(`   • 2 Convenios\n`);

  console.log('🔐 Credenciales de acceso:');
  console.log('   ┌─────────────────────────────────────────┐');
  console.log('   │ Admin:                                  │');
  console.log('   │   Email:    admin@vetconnect.cl         │');
  console.log('   │   Password: admin123                    │');
  console.log('   ├─────────────────────────────────────────┤');
  console.log('   │ Veterinarios:                           │');
  console.log('   │   dra.rodriguez@vetconnect.cl / admin123│');
  console.log('   │   dr.fernandez@vetconnect.cl / admin123 │');
  console.log('   │   dra.lopez@vetconnect.cl / admin123    │');
  console.log('   ├─────────────────────────────────────────┤');
  console.log('   │ Recepcionistas:                         │');
  console.log('   │   sofia.recepcion@vetconnect.cl         │');
  console.log('   │   juan.recepcion@vetconnect.cl          │');
  console.log('   └─────────────────────────────────────────┘\n');

  console.log('💡 Próximos pasos:');
  console.log('   1. Iniciar servidor: npm run dev');
  console.log('   2. Probar login en: http://localhost:3000/api/auth/login');
  console.log('   3. Explorar DB en Prisma Studio: npx prisma studio\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('\n❌ Error ejecutando seed:');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
