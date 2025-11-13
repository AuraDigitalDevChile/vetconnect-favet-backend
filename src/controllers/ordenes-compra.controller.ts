/**
 * Controlador de Órdenes de Compra
 */

import { Request, Response } from 'express';
import { PrismaClient, EstadoOrdenCompra } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validación schemas
const itemOrdenSchema = z.object({
  inventario_id: z.number().int().positive(),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().positive(),
});

const crearOrdenSchema = z.object({
  centro_id: z.number().int().positive(),
  proveedor_id: z.number().int().positive(),
  usuario_id: z.number().int().positive(),
  items: z.array(itemOrdenSchema).min(1),
  observaciones: z.string().optional(),
});

/**
 * Listar órdenes de compra
 */
export const listar = async (req: Request, res: Response) => {
  try {
    const { centro_id, proveedor_id, estado, limit = '50', offset = '0' } = req.query;

    const where: any = {};

    if (centro_id) where.centro_id = parseInt(centro_id as string);
    if (proveedor_id) where.proveedor_id = parseInt(proveedor_id as string);
    if (estado) where.estado = estado as EstadoOrdenCompra;

    const [ordenes, total] = await Promise.all([
      prisma.ordenCompra.findMany({
        where,
        include: {
          proveedor: {
            select: {
              id: true,
              rut: true,
              razon_social: true,
            },
          },
          centro: {
            select: {
              id: true,
              nombre: true,
            },
          },
          usuario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.ordenCompra.count({ where }),
    ]);

    res.json({
      success: true,
      data: ordenes,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    console.error('Error al listar órdenes de compra:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener órdenes de compra',
      message: error.message,
    });
  }
};

/**
 * Obtener una orden de compra por ID
 */
export const obtener = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orden = await prisma.ordenCompra.findUnique({
      where: { id: parseInt(id) },
      include: {
        proveedor: true,
        centro: true,
        usuario: true,
        items: {
          include: {
            inventario: {
              select: {
                id: true,
                sku_interno: true,
                nombre: true,
                unidad_medida: true,
                unidad_compra: true,
                factor_conversion: true,
              },
            },
          },
        },
      },
    });

    if (!orden) {
      return res.status(404).json({
        success: false,
        error: 'Orden de compra no encontrada',
      });
    }

    res.json({
      success: true,
      data: orden,
    });
  } catch (error: any) {
    console.error('Error al obtener orden de compra:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener orden de compra',
      message: error.message,
    });
  }
};

/**
 * Crear nueva orden de compra
 */
export const crear = async (req: Request, res: Response) => {
  try {
    const datos = crearOrdenSchema.parse(req.body);

    // Calcular totales
    let subtotal = 0;
    const itemsData = [];

    for (const item of datos.items) {
      const itemSubtotal = item.cantidad * item.precio_unitario;
      subtotal += itemSubtotal;

      itemsData.push({
        inventario_id: item.inventario_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: itemSubtotal,
      });
    }

    const iva = subtotal * 0.19; // IVA 19%
    const total = subtotal + iva;

    // Generar número de orden único
    const numeroOrden = `OC-${Date.now()}`;

    // Crear orden con items en una transacción
    const orden = await prisma.ordenCompra.create({
      data: {
        centro_id: datos.centro_id,
        proveedor_id: datos.proveedor_id,
        usuario_id: datos.usuario_id,
        numero_orden: numeroOrden,
        subtotal,
        iva,
        total,
        observaciones: datos.observaciones,
        estado: 'BORRADOR',
        items: {
          create: itemsData,
        },
      },
      include: {
        proveedor: true,
        items: {
          include: {
            inventario: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Orden de compra creada exitosamente',
      data: orden,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de orden de compra inválidos',
        details: error.errors,
      });
    }

    console.error('Error al crear orden de compra:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear orden de compra',
      message: error.message,
    });
  }
};

/**
 * Cambiar estado de orden de compra
 */
export const cambiarEstado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar el nuevo estado',
      });
    }

    const orden = await prisma.ordenCompra.update({
      where: { id: parseInt(id) },
      data: { estado },
    });

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: orden,
    });
  } catch (error: any) {
    console.error('Error al cambiar estado:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al cambiar estado',
      message: error.message,
    });
  }
};

/**
 * Recibir orden de compra (actualiza inventario)
 */
export const recibirOrden = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { usuario_id } = req.body;

    const orden = await prisma.ordenCompra.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            inventario: true,
          },
        },
      },
    });

    if (!orden) {
      return res.status(404).json({
        success: false,
        error: 'Orden de compra no encontrada',
      });
    }

    if (orden.estado === EstadoOrdenCompra.RECIBIDA) {
      return res.status(400).json({
        success: false,
        error: 'Esta orden ya fue recibida',
      });
    }

    // Actualizar inventario y crear movimientos en una transacción
    await prisma.$transaction(async (tx) => {
      for (const item of orden.items) {
        // Calcular cantidad en unidad de venta
        const factorConversion = item.inventario.factor_conversion || 1;
        const cantidadVenta = item.cantidad * factorConversion;

        // Actualizar stock
        await tx.inventario.update({
          where: { id: item.inventario_id },
          data: {
            stock_actual: {
              increment: cantidadVenta,
            },
          },
        });

        // Registrar movimiento
        await tx.movimientoInventario.create({
          data: {
            inventario_id: item.inventario_id,
            usuario_id: usuario_id || orden.usuario_id,
            tipo: 'INGRESO_COMPRA',
            cantidad: cantidadVenta,
            origen: `Orden de compra ${orden.numero_orden}`,
            observaciones: `Recepción de OC. Cantidad comprada: ${item.cantidad} ${item.inventario.unidad_compra || 'unidades'}`,
          },
        });
      }

      // Actualizar estado de orden
      await tx.ordenCompra.update({
        where: { id: parseInt(id) },
        data: {
          estado: EstadoOrdenCompra.RECIBIDA,
          fecha_recepcion: new Date(),
        },
      });
    });

    res.json({
      success: true,
      message: 'Orden recibida e inventario actualizado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al recibir orden:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al recibir orden',
      message: error.message,
    });
  }
};

/**
 * Eliminar orden de compra
 */
export const eliminar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const orden = await prisma.ordenCompra.findUnique({
      where: { id: parseInt(id) },
    });

    if (!orden) {
      return res.status(404).json({
        success: false,
        error: 'Orden de compra no encontrada',
      });
    }

    if (orden.estado === EstadoOrdenCompra.RECIBIDA) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar una orden que ya fue recibida',
      });
    }

    await prisma.ordenCompra.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'Orden de compra eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar orden:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar orden',
      message: error.message,
    });
  }
};
