/**
 * Controlador de Caja
 */

import { Request, Response } from 'express';
import { PrismaClient, MetodoPago } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validación schemas
const abrirCajaSchema = z.object({
  centro_id: z.number().int().positive(),
  usuario_id: z.number().int().positive(),
  monto_inicial: z.number().positive(),
  observaciones: z.string().optional(),
});

const cerrarCajaSchema = z.object({
  monto_real: z.number().positive(),
  observaciones: z.string().optional(),
});

const registrarMovimientoSchema = z.object({
  caja_id: z.number().int().positive(),
  tipo: z.enum(['INGRESO', 'EGRESO']),
  monto: z.number().positive(),
  concepto: z.string().max(300),
  metodo_pago: z.nativeEnum(MetodoPago).optional(),
  observaciones: z.string().optional(),
});

/**
 * Obtener caja activa del usuario
 */
export const obtenerCajaActiva = async (req: Request, res: Response) => {
  try {
    const { usuario_id, centro_id } = req.query;

    if (!usuario_id) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar el ID del usuario',
      });
    }

    const where: any = {
      usuario_id: parseInt(usuario_id as string),
      cerrada: false,
    };

    if (centro_id) {
      where.centro_id = parseInt(centro_id as string);
    }

    const caja = await prisma.caja.findFirst({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre_completo: true,
          },
        },
        centro: {
          select: {
            id: true,
            nombre: true,
          },
        },
        _count: {
          select: {
            movimientos: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({
      success: true,
      data: caja,
    });
  } catch (error: any) {
    console.error('Error al obtener caja activa:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener caja activa',
      message: error.message,
    });
  }
};

/**
 * Abrir nueva caja
 */
export const abrirCaja = async (req: Request, res: Response) => {
  try {
    const datos = abrirCajaSchema.parse(req.body);

    // Verificar que no haya una caja abierta para este usuario
    const cajaExistente = await prisma.caja.findFirst({
      where: {
        usuario_id: datos.usuario_id,
        cerrada: false,
      },
    });

    if (cajaExistente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una caja abierta para este usuario',
        caja_id: cajaExistente.id,
      });
    }

    const caja = await prisma.caja.create({
      data: {
        centro_id: datos.centro_id,
        usuario_id: datos.usuario_id,
        monto_inicial: datos.monto_inicial,
        observaciones: datos.observaciones,
        cerrada: false,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre_completo: true,
          },
        },
        centro: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Caja abierta exitosamente',
      data: caja,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de caja inválidos',
        details: error.errors,
      });
    }

    console.error('Error al abrir caja:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al abrir caja',
      message: error.message,
    });
  }
};

/**
 * Cerrar caja (cuadratura)
 */
export const cerrarCaja = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const datos = cerrarCajaSchema.parse(req.body);

    const caja = await prisma.caja.findUnique({
      where: { id: parseInt(id) },
    });

    if (!caja) {
      return res.status(404).json({
        success: false,
        error: 'Caja no encontrada',
      });
    }

    if (caja.cerrada) {
      return res.status(400).json({
        success: false,
        error: 'Esta caja ya está cerrada',
      });
    }

    // Calcular monto esperado
    const montoEsperado = parseFloat(caja.monto_inicial.toString()) +
      parseFloat(caja.total_ingresos.toString()) -
      parseFloat(caja.total_egresos.toString());

    const diferencia = datos.monto_real - montoEsperado;

    // Cerrar caja
    const cajaActualizada = await prisma.caja.update({
      where: { id: parseInt(id) },
      data: {
        fecha_cierre: new Date(),
        monto_esperado: montoEsperado,
        monto_real: datos.monto_real,
        diferencia,
        observaciones: datos.observaciones,
        cerrada: true,
      },
      include: {
        usuario: true,
        movimientos: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    return res.json({
      success: true,
      message: 'Caja cerrada exitosamente',
      data: {
        ...cajaActualizada,
        cuadratura: {
          monto_inicial: caja.monto_inicial,
          total_ingresos: caja.total_ingresos,
          total_egresos: caja.total_egresos,
          monto_esperado: montoEsperado,
          monto_real: datos.monto_real,
          diferencia,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.errors,
      });
    }

    console.error('Error al cerrar caja:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al cerrar caja',
      message: error.message,
    });
  }
};

/**
 * Registrar movimiento de caja
 */
export const registrarMovimiento = async (req: Request, res: Response) => {
  try {
    const datos = registrarMovimientoSchema.parse(req.body);

    const caja = await prisma.caja.findUnique({
      where: { id: datos.caja_id },
    });

    if (!caja) {
      return res.status(404).json({
        success: false,
        error: 'Caja no encontrada',
      });
    }

    if (caja.cerrada) {
      return res.status(400).json({
        success: false,
        error: 'No se pueden registrar movimientos en una caja cerrada',
      });
    }

    // Crear movimiento y actualizar totales en una transacción
    await prisma.$transaction(async (tx) => {
      // Crear movimiento
      await tx.movimientoCaja.create({
        data: {
          caja_id: datos.caja_id,
          tipo: datos.tipo,
          monto: datos.monto,
          concepto: datos.concepto,
          metodo_pago: datos.metodo_pago,
          observaciones: datos.observaciones,
        },
      });

      // Actualizar totales de caja
      if (datos.tipo === 'INGRESO') {
        await tx.caja.update({
          where: { id: datos.caja_id },
          data: {
            total_ingresos: {
              increment: datos.monto,
            },
          },
        });
      } else {
        await tx.caja.update({
          where: { id: datos.caja_id },
          data: {
            total_egresos: {
              increment: datos.monto,
            },
          },
        });
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Movimiento registrado exitosamente',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de movimiento inválidos',
        details: error.errors,
      });
    }

    console.error('Error al registrar movimiento:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al registrar movimiento',
      message: error.message,
    });
  }
};

/**
 * Obtener movimientos de una caja
 */
export const obtenerMovimientos = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '100', offset = '0' } = req.query;

    const movimientos = await prisma.movimientoCaja.findMany({
      where: { caja_id: parseInt(id) },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: movimientos,
    });
  } catch (error: any) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener movimientos',
      message: error.message,
    });
  }
};

/**
 * Listar cajas (historial)
 */
export const listar = async (req: Request, res: Response) => {
  try {
    const { centro_id, usuario_id, limit = '50', offset = '0' } = req.query;

    const where: any = {};

    if (centro_id) where.centro_id = parseInt(centro_id as string);
    if (usuario_id) where.usuario_id = parseInt(usuario_id as string);

    const [cajas, total] = await Promise.all([
      prisma.caja.findMany({
        where,
        include: {
          usuario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
          centro: {
            select: {
              id: true,
              nombre: true,
            },
          },
          _count: {
            select: {
              movimientos: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.caja.count({ where }),
    ]);

    res.json({
      success: true,
      data: cajas,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    console.error('Error al listar cajas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener cajas',
      message: error.message,
    });
  }
};
