/**
 * Controlador de Inventario
 * Gestión completa de inventario, stock y movimientos
 */

import { Request, Response } from 'express';
import { PrismaClient, CategoriaInventario, TipoMovimientoInventario } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validación schemas
const crearInventarioSchema = z.object({
  centro_id: z.number().int().positive(),
  sku_interno: z.string().max(100),
  codigo_barras: z.string().max(100).optional(),
  nombre: z.string().max(300),
  categoria: z.nativeEnum(CategoriaInventario),
  descripcion: z.string().optional(),
  unidad_medida: z.string().max(50),
  unidad_compra: z.string().max(50).optional(),
  factor_conversion: z.number().int().default(1),
  stock_actual: z.number().int().default(0),
  stock_minimo: z.number().int().default(0),
  precio_compra: z.number(),
  precio_venta: z.number(),
  es_farmaco: z.boolean().default(false),
  presentacion: z.string().max(200).optional(),
  concentracion: z.string().max(200).optional(),
  volumen: z.string().max(100).optional(),
  es_multidosis: z.boolean().default(false),
  fecha_vencimiento: z.string().optional(),
  lote: z.string().max(100).optional(),
});

const actualizarInventarioSchema = crearInventarioSchema.partial();

const movimientoInventarioSchema = z.object({
  inventario_id: z.number().int().positive(),
  usuario_id: z.number().int().positive(),
  tipo: z.nativeEnum(TipoMovimientoInventario),
  cantidad: z.number().int(),
  origen: z.string().max(200).optional(),
  observaciones: z.string().optional(),
});

/**
 * Listar inventario con filtros
 */
export const listar = async (req: Request, res: Response) => {
  try {
    const {
      centro_id,
      categoria,
      buscar,
      stock_bajo,
      activo,
      limit = '50',
      offset = '0',
    } = req.query;

    const where: any = {};

    if (centro_id) where.centro_id = parseInt(centro_id as string);
    if (categoria) where.categoria = categoria as CategoriaInventario;
    if (activo !== undefined) where.activo = activo === 'true';

    // Filtro de stock bajo
    if (stock_bajo === 'true') {
      where.OR = [
        { stock_actual: { lte: prisma.inventario.fields.stock_minimo } },
      ];
    }

    // Búsqueda por nombre, SKU o código de barras
    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar as string, mode: 'insensitive' } },
        { sku_interno: { contains: buscar as string, mode: 'insensitive' } },
        { codigo_barras: { contains: buscar as string, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.inventario.findMany({
        where,
        include: {
          centro: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
          _count: {
            select: {
              movimientos: true,
            },
          },
        },
        orderBy: { nombre: 'asc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.inventario.count({ where }),
    ]);

    // Identificar items con stock bajo
    const itemsConAlerta = items.map(item => ({
      ...item,
      stock_bajo: item.stock_actual <= item.stock_minimo,
    }));

    res.json({
      success: true,
      data: itemsConAlerta,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    console.error('Error al listar inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener inventario',
      message: error.message,
    });
  }
};

/**
 * Obtener un item de inventario por ID
 */
export const obtener = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventario.findUnique({
      where: { id: parseInt(id) },
      include: {
        centro: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
        movimientos: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre_completo: true,
              },
            },
          },
          orderBy: { fecha_movimiento: 'desc' },
          take: 20, // Últimos 20 movimientos
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item de inventario no encontrado',
      });
    }

    res.json({
      success: true,
      data: {
        ...item,
        stock_bajo: item.stock_actual <= item.stock_minimo,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener item de inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener item de inventario',
      message: error.message,
    });
  }
};

/**
 * Crear nuevo item de inventario
 */
export const crear = async (req: Request, res: Response) => {
  try {
    const datos = crearInventarioSchema.parse(req.body);

    // Verificar que el SKU no exista
    const skuExistente = await prisma.inventario.findUnique({
      where: { sku_interno: datos.sku_interno },
    });

    if (skuExistente) {
      return res.status(400).json({
        success: false,
        error: 'El SKU interno ya existe en el sistema',
      });
    }

    // Verificar código de barras si se proporciona
    if (datos.codigo_barras) {
      const codigoExistente = await prisma.inventario.findUnique({
        where: { codigo_barras: datos.codigo_barras },
      });

      if (codigoExistente) {
        return res.status(400).json({
          success: false,
          error: 'El código de barras ya existe en el sistema',
        });
      }
    }

    const item = await prisma.inventario.create({
      data: {
        ...datos,
        fecha_vencimiento: datos.fecha_vencimiento ? new Date(datos.fecha_vencimiento) : null,
      },
      include: {
        centro: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Item de inventario creado exitosamente',
      data: item,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de inventario inválidos',
        details: error.errors,
      });
    }

    console.error('Error al crear item de inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear item de inventario',
      message: error.message,
    });
  }
};

/**
 * Actualizar item de inventario
 */
export const actualizar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const datos = actualizarInventarioSchema.parse(req.body);

    const itemExistente = await prisma.inventario.findUnique({
      where: { id: parseInt(id) },
    });

    if (!itemExistente) {
      return res.status(404).json({
        success: false,
        error: 'Item de inventario no encontrado',
      });
    }

    // Verificar SKU si se está actualizando
    if (datos.sku_interno && datos.sku_interno !== itemExistente.sku_interno) {
      const skuExistente = await prisma.inventario.findUnique({
        where: { sku_interno: datos.sku_interno },
      });

      if (skuExistente) {
        return res.status(400).json({
          success: false,
          error: 'El SKU interno ya existe en el sistema',
        });
      }
    }

    const item = await prisma.inventario.update({
      where: { id: parseInt(id) },
      data: {
        ...datos,
        fecha_vencimiento: datos.fecha_vencimiento ? new Date(datos.fecha_vencimiento) : undefined,
      },
      include: {
        centro: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Item de inventario actualizado exitosamente',
      data: item,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de inventario inválidos',
        details: error.errors,
      });
    }

    console.error('Error al actualizar item de inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar item de inventario',
      message: error.message,
    });
  }
};

/**
 * Eliminar item de inventario (soft delete)
 */
export const eliminar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventario.findUnique({
      where: { id: parseInt(id) },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item de inventario no encontrado',
      });
    }

    await prisma.inventario.update({
      where: { id: parseInt(id) },
      data: { activo: false },
    });

    res.json({
      success: true,
      message: 'Item de inventario eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar item de inventario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar item de inventario',
      message: error.message,
    });
  }
};

/**
 * Ajustar stock de inventario (registrar movimiento)
 */
export const ajustarStock = async (req: Request, res: Response) => {
  try {
    const datos = movimientoInventarioSchema.parse(req.body);

    const item = await prisma.inventario.findUnique({
      where: { id: datos.inventario_id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item de inventario no encontrado',
      });
    }

    // Calcular nuevo stock
    let nuevoStock = item.stock_actual;

    if (datos.tipo === 'INGRESO_COMPRA' || datos.tipo === 'AJUSTE_INVENTARIO') {
      nuevoStock += datos.cantidad;
    } else {
      nuevoStock -= datos.cantidad;
    }

    if (nuevoStock < 0) {
      return res.status(400).json({
        success: false,
        error: 'Stock insuficiente para realizar esta operación',
        stock_actual: item.stock_actual,
        cantidad_solicitada: datos.cantidad,
      });
    }

    // Crear movimiento y actualizar stock en una transacción
    const [movimiento, itemActualizado] = await prisma.$transaction([
      prisma.movimientoInventario.create({
        data: datos,
        include: {
          usuario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
          inventario: {
            select: {
              id: true,
              nombre: true,
              sku_interno: true,
            },
          },
        },
      }),
      prisma.inventario.update({
        where: { id: datos.inventario_id },
        data: { stock_actual: nuevoStock },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'Movimiento de inventario registrado exitosamente',
      data: {
        movimiento,
        stock_anterior: item.stock_actual,
        stock_nuevo: nuevoStock,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de movimiento inválidos',
        details: error.errors,
      });
    }

    console.error('Error al ajustar stock:', error);
    res.status(500).json({
      success: false,
      error: 'Error al ajustar stock',
      message: error.message,
    });
  }
};

/**
 * Obtener movimientos de un item
 */
export const obtenerMovimientos = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const [movimientos, total] = await Promise.all([
      prisma.movimientoInventario.findMany({
        where: { inventario_id: parseInt(id) },
        include: {
          usuario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
        },
        orderBy: { fecha_movimiento: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.movimientoInventario.count({
        where: { inventario_id: parseInt(id) },
      }),
    ]);

    res.json({
      success: true,
      data: movimientos,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
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
 * Obtener items con stock bajo
 */
export const obtenerStockBajo = async (req: Request, res: Response) => {
  try {
    const { centro_id } = req.query;

    const where: any = {
      activo: true,
    };

    if (centro_id) {
      where.centro_id = parseInt(centro_id as string);
    }

    const items = await prisma.inventario.findMany({
      where: {
        ...where,
        stock_actual: {
          lte: prisma.inventario.fields.stock_minimo,
        },
      },
      include: {
        centro: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { stock_actual: 'asc' },
    });

    res.json({
      success: true,
      data: items,
      total: items.length,
    });
  } catch (error: any) {
    console.error('Error al obtener stock bajo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener items con stock bajo',
      message: error.message,
    });
  }
};

/**
 * Estadísticas de inventario
 */
export const obtenerEstadisticas = async (req: Request, res: Response) => {
  try {
    const { centro_id } = req.query;

    const where: any = { activo: true };
    if (centro_id) where.centro_id = parseInt(centro_id as string);

    const [
      totalItems,
      totalFarmacos,
      totalInsumos,
      totalProductos,
      stockBajo,
      valorInventario,
    ] = await Promise.all([
      prisma.inventario.count({ where }),
      prisma.inventario.count({ where: { ...where, categoria: 'FARMACO' } }),
      prisma.inventario.count({ where: { ...where, categoria: 'INSUMO' } }),
      prisma.inventario.count({ where: { ...where, categoria: 'PRODUCTO_VENTA' } }),
      prisma.inventario.count({
        where: {
          ...where,
          stock_actual: {
            lte: prisma.inventario.fields.stock_minimo,
          },
        },
      }),
      prisma.inventario.aggregate({
        where,
        _sum: {
          stock_actual: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        total_items: totalItems,
        por_categoria: {
          farmacos: totalFarmacos,
          insumos: totalInsumos,
          productos_venta: totalProductos,
        },
        alertas: {
          stock_bajo: stockBajo,
        },
        stock_total: valorInventario._sum.stock_actual || 0,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas de inventario',
      message: error.message,
    });
  }
};

/**
 * Consultor de precios - Búsqueda por múltiples campos
 * GET /api/inventario/buscar-precio?q=...
 */
export const buscarPorPrecio = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar un término de búsqueda (q)',
      });
    }

    const busqueda = q as string;

    // Buscar en múltiples campos
    const items = await prisma.inventario.findMany({
      where: {
        activo: true,
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' } },
          { sku_interno: { contains: busqueda, mode: 'insensitive' } },
          { codigo_barras: { contains: busqueda, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        sku_interno: true,
        codigo_barras: true,
        nombre: true,
        categoria: true,
        precio_venta: true,
        stock_actual: true,
        stock_minimo: true,
        unidad_medida: true,
        descripcion: true,
        es_farmaco: true,
        presentacion: true,
      },
      take: 10, // Limitar a 10 resultados
    });

    res.json({
      success: true,
      data: items,
      total: items.length,
    });
  } catch (error: any) {
    console.error('Error en consultor de precios:', error);
    res.status(500).json({
      success: false,
      error: 'Error al buscar precio',
      message: error.message,
    });
  }
};
