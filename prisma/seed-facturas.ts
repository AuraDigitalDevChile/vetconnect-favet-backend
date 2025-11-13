/**
 * Seed para crear facturas de prueba
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creando facturas de prueba...\n');

  // Crear factura 1
  const factura1 = await prisma.factura.create({
    data: {
      centro_id: 1,
      paciente_id: 1,
      tutor_id: 1,
      usuario_id: 1,
      numero_factura: 'F-2025-001',
      tipo_documento: 'BOLETA',
      fecha_emision: new Date('2025-11-01'),
      fecha_vencimiento: new Date('2025-12-01'),
      fecha_pago: new Date('2025-11-01'),
      subtotal: 33613,
      descuento: 0,
      iva: 6387,
      total: 40000,
      estado: 'PAGADA',
      metodo_pago: 'EFECTIVO',
      items: {
        create: [
          {
            tipo_item: 'SERVICIO',
            descripcion: 'Consulta veterinaria - Consulta general + examen físico completo',
            cantidad: 1,
            precio_unitario: 25000,
            descuento: 0,
            subtotal: 25000,
          },
          {
            tipo_item: 'SERVICIO',
            descripcion: 'Vacuna antirrábica - Vacuna antirrábica anual',
            cantidad: 1,
            precio_unitario: 15000,
            descuento: 0,
            subtotal: 15000,
          },
        ],
      },
    },
  });

  console.log('✅ Factura 1 creada:', factura1.numero_factura);

  // Crear factura 2
  const factura2 = await prisma.factura.create({
    data: {
      centro_id: 1,
      paciente_id: 2,
      tutor_id: 2,
      usuario_id: 2,
      numero_factura: 'F-2025-002',
      tipo_documento: 'BOLETA',
      fecha_emision: new Date('2025-11-10'),
      fecha_vencimiento: new Date('2025-12-10'),
      subtotal: 50420,
      descuento: 0,
      iva: 9580,
      total: 60000,
      estado: 'PENDIENTE',
      items: {
        create: [
          {
            tipo_item: 'SERVICIO',
            descripcion: 'Cirugía menor - Extracción de tumor benigno',
            cantidad: 1,
            precio_unitario: 45000,
            descuento: 0,
            subtotal: 45000,
          },
          {
            tipo_item: 'MEDICAMENTO',
            descripcion: 'Medicamentos postoperatorios - Antibióticos y analgésicos',
            cantidad: 1,
            precio_unitario: 15000,
            descuento: 0,
            subtotal: 15000,
          },
        ],
      },
    },
  });

  console.log('✅ Factura 2 creada:', factura2.numero_factura);

  // Crear factura 3
  const factura3 = await prisma.factura.create({
    data: {
      centro_id: 1,
      paciente_id: 3,
      tutor_id: 3,
      usuario_id: 1,
      numero_factura: 'F-2025-003',
      tipo_documento: 'BOLETA',
      fecha_emision: new Date('2025-11-13'),
      subtotal: 16807,
      descuento: 0,
      iva: 3193,
      total: 20000,
      estado: 'PENDIENTE',
      items: {
        create: [
          {
            tipo_item: 'SERVICIO',
            descripcion: 'Desparasitación - Desparasitación interna y externa',
            cantidad: 1,
            precio_unitario: 12000,
            descuento: 0,
            subtotal: 12000,
          },
          {
            tipo_item: 'SERVICIO',
            descripcion: 'Control de peso - Pesaje y evaluación nutricional',
            cantidad: 1,
            precio_unitario: 8000,
            descuento: 0,
            subtotal: 8000,
          },
        ],
      },
    },
  });

  console.log('✅ Factura 3 creada:', factura3.numero_factura);

  // Crear factura 4 (vencida)
  const factura4 = await prisma.factura.create({
    data: {
      centro_id: 1,
      paciente_id: 4,
      tutor_id: 4,
      usuario_id: 2,
      numero_factura: 'F-2025-004',
      tipo_documento: 'BOLETA',
      fecha_emision: new Date('2025-10-15'),
      fecha_vencimiento: new Date('2025-11-01'),
      subtotal: 84034,
      descuento: 0,
      iva: 15966,
      total: 100000,
      estado: 'VENCIDA',
      items: {
        create: [
          {
            tipo_item: 'SERVICIO',
            descripcion: 'Hospitalización 3 días - Hospitalización con cuidados intensivos',
            cantidad: 3,
            precio_unitario: 25000,
            descuento: 0,
            subtotal: 75000,
          },
          {
            tipo_item: 'EXAMEN',
            descripcion: 'Exámenes de laboratorio - Hemograma completo y bioquímica',
            cantidad: 1,
            precio_unitario: 25000,
            descuento: 0,
            subtotal: 25000,
          },
        ],
      },
    },
  });

  console.log('✅ Factura 4 creada:', factura4.numero_factura);

  console.log('\n🎉 ¡Facturas de prueba creadas exitosamente!');
  console.log(`
📊 Resumen:
- Total facturas: 4
- Pagadas: 1 ($40,000)
- Pendientes: 2 ($80,000)
- Vencidas: 1 ($100,000)
- Total: $220,000
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
