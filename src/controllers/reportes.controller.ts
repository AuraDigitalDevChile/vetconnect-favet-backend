/**
 * Controlador de Reportes
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import excelGenerator from '../services/reportes/excel-generator.service';

const prisma = new PrismaClient();

/**
 * Reporte de reservas/citas
 * GET /api/reportes/reservas?formato=json|csv|excel&fecha_desde=...&fecha_hasta=...
 */
export const reporteReservas = async (req: Request, res: Response) => {
  try {
    const { formato = 'json', fecha_desde, fecha_hasta, centro_id, estado } = req.query;

    const where: any = {};

    if (centro_id) where.centro_id = parseInt(centro_id as string);
    if (estado) where.estado = estado;

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) where.fecha.gte = new Date(fecha_desde as string);
      if (fecha_hasta) where.fecha.lte = new Date(fecha_hasta as string);
    }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        paciente: {
          select: {
            numero_ficha: true,
            nombre: true,
            especie: true,
          },
        },
        tutor: {
          select: {
            nombre_completo: true,
            telefono: true,
          },
        },
        veterinario: {
          select: {
            nombre_completo: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
    });

    // Formatear datos
    const datos = citas.map((c) => ({
      fecha: c.fecha.toISOString().split('T')[0],
      hora: c.hora,
      paciente: c.paciente.nombre,
      ficha: c.paciente.numero_ficha,
      especie: c.paciente.especie,
      tutor: c.tutor.nombre_completo,
      telefono: c.tutor.telefono || '',
      veterinario: c.veterinario.nombre_completo,
      tipo: c.tipo,
      estado: c.estado,
      motivo: c.motivo || '',
    }));

    if (formato === 'csv') {
      const csv = excelGenerator.generarCSV(datos);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_reservas_${Date.now()}.csv"`);
      return res.send(csv);
    }

    if (formato === 'excel') {
      const buffer = excelGenerator.generar(datos, 'Reservas');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="reporte_reservas_${Date.now()}.xlsx"`);
      return res.send(buffer);
    }

    return res.json({
      success: true,
      data: datos,
      total: datos.length,
    });
  } catch (error: any) {
    console.error('Error en reporte de reservas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar reporte',
      message: error.message,
    });
  }
};

/**
 * Reporte de servicios por personal
 * GET /api/reportes/servicios-personal?formato=json|csv|excel&fecha_desde=...&veterinario_id=...
 */
export const reporteServiciosPersonal = async (req: Request, res: Response) => {
  try {
    const { formato = 'json', fecha_desde, fecha_hasta, veterinario_id } = req.query;

    const where: any = {};

    if (veterinario_id) where.veterinario_id = parseInt(veterinario_id as string);

    if (fecha_desde || fecha_hasta) {
      where.created_at = {};
      if (fecha_desde) where.created_at.gte = new Date(fecha_desde as string);
      if (fecha_hasta) where.created_at.lte = new Date(fecha_hasta as string);
    }

    const fichas = await prisma.fichaClinica.findMany({
      where,
      include: {
        paciente: {
          select: {
            numero_ficha: true,
            nombre: true,
          },
        },
        veterinario: {
          select: {
            nombre_completo: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const datos = fichas.map((f) => ({
      fecha: f.created_at.toISOString().split('T')[0],
      veterinario: f.veterinario?.nombre_completo || 'N/A',
      paciente: f.paciente?.nombre || 'N/A',
      ficha: f.paciente?.numero_ficha || 'N/A',
      motivo: f.motivo_consulta || '',
      diagnostico: f.diagnostico || '',
    }));

    if (formato === 'csv') {
      const csv = excelGenerator.generarCSV(datos);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="servicios_personal_${Date.now()}.csv"`);
      return res.send(csv);
    }

    if (formato === 'excel') {
      const buffer = excelGenerator.generar(datos, 'Servicios');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="servicios_personal_${Date.now()}.xlsx"`);
      return res.send(buffer);
    }

    return res.json({
      success: true,
      data: datos,
      total: datos.length,
    });
  } catch (error: any) {
    console.error('Error en reporte de servicios:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar reporte',
      message: error.message,
    });
  }
};

/**
 * Libro de ventas
 * GET /api/reportes/libro-ventas?formato=json|csv|excel&fecha_desde=...
 */
export const libroVentas = async (req: Request, res: Response) => {
  try {
    const { formato = 'json', fecha_desde, fecha_hasta, centro_id } = req.query;

    const where: any = {};

    if (centro_id) where.centro_id = parseInt(centro_id as string);

    if (fecha_desde || fecha_hasta) {
      where.fecha_emision = {};
      if (fecha_desde) where.fecha_emision.gte = new Date(fecha_desde as string);
      if (fecha_hasta) where.fecha_emision.lte = new Date(fecha_hasta as string);
    }

    const facturas = await prisma.factura.findMany({
      where,
      include: {
        tutor: {
          select: {
            nombre_completo: true,
            rut: true,
          },
        },
      },
      orderBy: { fecha_emision: 'desc' },
    });

    const datos = facturas.map((f) => ({
      fecha: f.fecha_emision.toISOString().split('T')[0],
      tipo_documento: f.tipo_documento,
      numero: f.numero_factura,
      folio_sii: f.folio_sii || '',
      cliente: f.tutor?.nombre_completo || 'N/A',
      rut_cliente: f.tutor?.rut || '',
      subtotal: Number(f.subtotal),
      iva: Number(f.iva),
      total: Number(f.total),
      estado: f.estado,
      metodo_pago: f.metodo_pago || '',
    }));

    if (formato === 'csv') {
      const csv = excelGenerator.generarCSV(datos);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="libro_ventas_${Date.now()}.csv"`);
      return res.send(csv);
    }

    if (formato === 'excel') {
      const buffer = excelGenerator.generar(datos, 'Libro Ventas');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="libro_ventas_${Date.now()}.xlsx"`);
      return res.send(buffer);
    }

    return res.json({
      success: true,
      data: datos,
      total: datos.length,
      resumen: {
        total_facturas: datos.length,
        total_ventas: datos.reduce((sum, f) => sum + f.total, 0),
      },
    });
  } catch (error: any) {
    console.error('Error en libro de ventas:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar libro de ventas',
      message: error.message,
    });
  }
};

/**
 * Movimientos de inventario
 * GET /api/reportes/movimientos-inventario?formato=json|csv|excel&fecha_desde=...
 */
export const movimientosInventario = async (req: Request, res: Response) => {
  try {
    const { formato = 'json', fecha_desde, fecha_hasta, inventario_id } = req.query;

    const where: any = {};

    if (inventario_id) where.inventario_id = parseInt(inventario_id as string);

    if (fecha_desde || fecha_hasta) {
      where.fecha_movimiento = {};
      if (fecha_desde) where.fecha_movimiento.gte = new Date(fecha_desde as string);
      if (fecha_hasta) where.fecha_movimiento.lte = new Date(fecha_hasta as string);
    }

    const movimientos = await prisma.movimientoInventario.findMany({
      where,
      include: {
        inventario: {
          select: {
            sku_interno: true,
            nombre: true,
            categoria: true,
          },
        },
        usuario: {
          select: {
            nombre_completo: true,
          },
        },
      },
      orderBy: { fecha_movimiento: 'desc' },
    });

    const datos = movimientos.map((m) => ({
      fecha: m.fecha_movimiento.toISOString().split('T')[0],
      sku: m.inventario.sku_interno,
      producto: m.inventario.nombre,
      categoria: m.inventario.categoria,
      tipo_movimiento: m.tipo,
      cantidad: m.cantidad,
      origen: m.origen || '',
      usuario: m.usuario.nombre_completo,
      observaciones: m.observaciones || '',
    }));

    if (formato === 'csv') {
      const csv = excelGenerator.generarCSV(datos);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="movimientos_inventario_${Date.now()}.csv"`);
      return res.send(csv);
    }

    if (formato === 'excel') {
      const buffer = excelGenerator.generar(datos, 'Movimientos');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="movimientos_inventario_${Date.now()}.xlsx"`);
      return res.send(buffer);
    }

    return res.json({
      success: true,
      data: datos,
      total: datos.length,
    });
  } catch (error: any) {
    console.error('Error en reporte de movimientos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar reporte',
      message: error.message,
    });
  }
};

/**
 * Stock actual
 * GET /api/reportes/stock-actual?formato=json|csv|excel
 */
export const stockActual = async (req: Request, res: Response) => {
  try {
    const { formato = 'json', centro_id, categoria, stock_bajo } = req.query;

    const where: any = { activo: true };

    if (centro_id) where.centro_id = parseInt(centro_id as string);
    if (categoria) where.categoria = categoria;
    if (stock_bajo === 'true') {
      where.stock_actual = {
        lte: prisma.inventario.fields.stock_minimo,
      };
    }

    const items = await prisma.inventario.findMany({
      where,
      include: {
        centro: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    const datos = items.map((i) => ({
      sku: i.sku_interno,
      codigo_barras: i.codigo_barras || '',
      nombre: i.nombre,
      categoria: i.categoria,
      stock_actual: i.stock_actual,
      stock_minimo: i.stock_minimo,
      unidad: i.unidad_medida,
      precio_compra: Number(i.precio_compra),
      precio_venta: Number(i.precio_venta),
      valor_stock: i.stock_actual * Number(i.precio_venta),
      centro: i.centro.nombre,
      es_farmaco: i.es_farmaco ? 'Sí' : 'No',
      fecha_vencimiento: i.fecha_vencimiento ? i.fecha_vencimiento.toISOString().split('T')[0] : '',
    }));

    if (formato === 'csv') {
      const csv = excelGenerator.generarCSV(datos);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="stock_actual_${Date.now()}.csv"`);
      return res.send(csv);
    }

    if (formato === 'excel') {
      const buffer = excelGenerator.generar(datos, 'Stock');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="stock_actual_${Date.now()}.xlsx"`);
      return res.send(buffer);
    }

    return res.json({
      success: true,
      data: datos,
      total: datos.length,
      resumen: {
        valor_total_stock: datos.reduce((sum, i) => sum + i.valor_stock, 0),
        items_stock_bajo: datos.filter((i) => i.stock_actual <= i.stock_minimo).length,
      },
    });
  } catch (error: any) {
    console.error('Error en reporte de stock:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar reporte de stock',
      message: error.message,
    });
  }
};

/**
 * Pacientes día hospital
 * GET /api/reportes/pacientes-hospital?formato=json|csv|excel&fecha=...
 */
export const pacientesDiaHospital = async (req: Request, res: Response) => {
  try {
    const { formato = 'json', fecha, centro_id } = req.query;

    const where: any = { estado: 'ACTIVA' };

    if (centro_id) where.centro_id = parseInt(centro_id as string);

    if (fecha) {
      const fechaBuscar = new Date(fecha as string);
      where.fecha_ingreso = {
        lte: fechaBuscar,
      };
    }

    const hospitalizaciones = await prisma.hospitalizacion.findMany({
      where,
      include: {
        paciente: {
          select: {
            numero_ficha: true,
            nombre: true,
            especie: true,
          },
        },
        veterinario: {
          select: {
            nombre_completo: true,
          },
        },
      },
      orderBy: { fecha_ingreso: 'desc' },
    });

    const datos = hospitalizaciones.map((h) => ({
      paciente: h.paciente.nombre,
      ficha: h.paciente.numero_ficha,
      especie: h.paciente.especie,
      fecha_ingreso: h.fecha_ingreso.toISOString().split('T')[0],
      dias_hospitalizacion: h.dias_hospitalizado || Math.ceil(
        (new Date().getTime() - h.fecha_ingreso.getTime()) / (1000 * 60 * 60 * 24)
      ),
      diagnostico: h.diagnostico || '',
      gravedad: 'N/A',
      jaula: h.jaula || '',
      veterinario: h.veterinario.nombre_completo,
      estado: h.estado,
    }));

    if (formato === 'csv') {
      const csv = excelGenerator.generarCSV(datos);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="pacientes_hospital_${Date.now()}.csv"`);
      return res.send(csv);
    }

    if (formato === 'excel') {
      const buffer = excelGenerator.generar(datos, 'Hospitalizados');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="pacientes_hospital_${Date.now()}.xlsx"`);
      return res.send(buffer);
    }

    return res.json({
      success: true,
      data: datos,
      total: datos.length,
    });
  } catch (error: any) {
    console.error('Error en reporte de hospitalizados:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar reporte',
      message: error.message,
    });
  }
};

/**
 * Dashboard - Estadísticas principales
 * GET /api/reportes/dashboard?centro_id=...
 */
export const reporteDashboard = async (req: Request, res: Response) => {
  try {
    const { centro_id } = req.query;

    const whereCenter: any = centro_id ? { centro_id: parseInt(centro_id as string) } : {};

    // Obtener fecha de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Primer día del mes actual
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      totalPacientes,
      citasHoy,
      hospitalizadosActivos,
      stockCritico,
      facturasDelMes,
    ] = await Promise.all([
      // Total pacientes activos
      prisma.paciente.count({
        where: { ...whereCenter, activo: true }
      }),

      // Citas de hoy
      prisma.cita.count({
        where: {
          ...whereCenter,
          fecha: {
            gte: hoy,
            lt: manana,
          },
          estado: { in: ['PROGRAMADA', 'CONFIRMADA', 'EN_CURSO'] },
        },
      }),

      // Pacientes hospitalizados activos
      prisma.hospitalizacion.count({
        where: {
          estado: 'ACTIVA',
          ...(centro_id ? { centro_id: parseInt(centro_id as string) } : {}),
        },
      }),

      // Items con stock crítico
      prisma.inventario.findMany({
        where: {
          ...whereCenter,
          activo: true,
        },
        select: {
          stock_actual: true,
          stock_minimo: true,
        },
      }).then(criticos => {
        return criticos.filter(item => item.stock_actual <= item.stock_minimo).length;
      }),

      // Facturación del mes
      prisma.factura.aggregate({
        where: {
          ...whereCenter,
          fecha_emision: {
            gte: primerDiaMes,
          },
          estado: { not: 'ANULADA' },
        },
        _sum: {
          total: true,
        },
        _count: true,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        pacientes_activos: totalPacientes,
        citas_hoy: citasHoy,
        pacientes_hospitalizados: hospitalizadosActivos,
        items_stock_critico: stockCritico,
        facturacion_mes: {
          total: facturasDelMes._sum.total || 0,
          cantidad: facturasDelMes._count,
        },
      },
    });
  } catch (error: any) {
    console.error('Error en reporte dashboard:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar dashboard',
      message: error.message,
    });
  }
};
