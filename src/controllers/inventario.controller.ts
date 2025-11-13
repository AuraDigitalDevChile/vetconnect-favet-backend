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
    return res.status(500).json({
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
    return res.status(500).json({
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
    return res.status(500).json({
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
    return res.status(500).json({
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
    const [movimiento] = await prisma.$transaction([
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
    return res.status(500).json({
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
    return res.status(500).json({
      success: false,
      error: 'Error al buscar precio',
      message: error.message,
    });
  }
};

/**
 * Descargar plantilla de inventario Excel
 * GET /api/inventario/descargar-plantilla
 */
export const descargarPlantilla = async (req: Request, res: Response) => {
  try {
    const ExcelJS = require('exceljs');

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario');

    // Definir columnas
    worksheet.columns = [
      { header: 'sku_interno', key: 'sku_interno', width: 15 },
      { header: 'codigo_barras', key: 'codigo_barras', width: 15 },
      { header: 'nombre', key: 'nombre', width: 30 },
      { header: 'categoria', key: 'categoria', width: 20 },
      { header: 'descripcion', key: 'descripcion', width: 40 },
      { header: 'unidad_medida', key: 'unidad_medida', width: 15 },
      { header: 'unidad_compra', key: 'unidad_compra', width: 15 },
      { header: 'factor_conversion', key: 'factor_conversion', width: 15 },
      { header: 'stock_actual', key: 'stock_actual', width: 12 },
      { header: 'stock_minimo', key: 'stock_minimo', width: 12 },
      { header: 'precio_compra', key: 'precio_compra', width: 15 },
      { header: 'precio_venta', key: 'precio_venta', width: 15 },
      { header: 'es_farmaco', key: 'es_farmaco', width: 12 },
      { header: 'presentacion', key: 'presentacion', width: 20 },
      { header: 'concentracion', key: 'concentracion', width: 20 },
      { header: 'volumen', key: 'volumen', width: 15 },
      { header: 'es_multidosis', key: 'es_multidosis', width: 12 },
      { header: 'lote', key: 'lote', width: 15 },
      { header: 'fecha_vencimiento', key: 'fecha_vencimiento', width: 18 },
    ];

    // Estilo del header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' },
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar filas de ejemplo
    worksheet.addRow({
      sku_interno: 'FARM-001',
      codigo_barras: '7891234567890',
      nombre: 'Vacuna Antirrábica',
      categoria: 'FARMACO',
      descripcion: 'Vacuna para prevenir la rabia',
      unidad_medida: 'ml',
      unidad_compra: 'caja',
      factor_conversion: 10,
      stock_actual: 50,
      stock_minimo: 10,
      precio_compra: 15000,
      precio_venta: 25000,
      es_farmaco: 'true',
      presentacion: 'Frasco 10ml',
      concentracion: '100mg/ml',
      volumen: '10ml',
      es_multidosis: 'false',
      lote: 'L2024-001',
      fecha_vencimiento: '2025-12-31',
    });

    worksheet.addRow({
      sku_interno: 'INSU-001',
      codigo_barras: '7891234567891',
      nombre: 'Jeringa 5ml',
      categoria: 'INSUMO',
      descripcion: 'Jeringa desechable',
      unidad_medida: 'unidad',
      unidad_compra: 'caja',
      factor_conversion: 100,
      stock_actual: 500,
      stock_minimo: 100,
      precio_compra: 50,
      precio_venta: 100,
      es_farmaco: 'false',
      presentacion: '5ml',
      concentracion: '',
      volumen: '',
      es_multidosis: 'false',
      lote: '',
      fecha_vencimiento: '',
    });

    // Agregar hoja de instrucciones
    const instruccionesSheet = workbook.addWorksheet('Instrucciones');
    instruccionesSheet.getColumn(1).width = 80;

    instruccionesSheet.addRow(['INSTRUCCIONES PARA CARGA MASIVA DE INVENTARIO']);
    instruccionesSheet.getRow(1).font = { bold: true, size: 14 };
    instruccionesSheet.addRow([]);
    instruccionesSheet.addRow(['Campos obligatorios:']);
    instruccionesSheet.addRow(['- sku_interno: Código único del producto (ej: FARM-001)']);
    instruccionesSheet.addRow(['- nombre: Nombre del producto']);
    instruccionesSheet.addRow(['- categoria: FARMACO, INSUMO, PRODUCTO_VENTA, SERVICIO, PROCEDIMIENTO']);
    instruccionesSheet.addRow(['- unidad_medida: ml, unidad, kg, etc.']);
    instruccionesSheet.addRow(['- precio_compra: Precio de compra en pesos']);
    instruccionesSheet.addRow(['- precio_venta: Precio de venta en pesos']);
    instruccionesSheet.addRow([]);
    instruccionesSheet.addRow(['Campos opcionales:']);
    instruccionesSheet.addRow(['- codigo_barras: Código de barras del producto']);
    instruccionesSheet.addRow(['- descripcion: Descripción detallada']);
    instruccionesSheet.addRow(['- stock_actual: Stock inicial (default: 0)']);
    instruccionesSheet.addRow(['- stock_minimo: Stock mínimo (default: 0)']);
    instruccionesSheet.addRow(['- es_farmaco: true o false (default: false)']);
    instruccionesSheet.addRow(['- fecha_vencimiento: Formato YYYY-MM-DD (ej: 2025-12-31)']);
    instruccionesSheet.addRow([]);
    instruccionesSheet.addRow(['IMPORTANTE:']);
    instruccionesSheet.addRow(['- No modifique los nombres de las columnas']);
    instruccionesSheet.addRow(['- Si el sku_interno ya existe, se actualizará el producto']);
    instruccionesSheet.addRow(['- Si el sku_interno no existe, se creará un producto nuevo']);
    instruccionesSheet.addRow(['- Los valores booleanos deben ser: true o false']);
    instruccionesSheet.addRow(['- Las fechas deben estar en formato: YYYY-MM-DD']);

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Configurar headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_inventario.xlsx');

    // Enviar archivo
    res.send(buffer);
  } catch (error: any) {
    console.error('Error al generar plantilla:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar plantilla',
      message: error.message,
    });
  }
};

/**
 * Carga masiva de inventario desde Excel/CSV
 * POST /api/inventario/carga-masiva
 */
export const cargaMasiva = async (req: Request & { file?: any }, res: Response) => {
  try {
    const ExcelJS = require('exceljs');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo',
      });
    }

    const { centro_id } = req.body;

    if (!centro_id) {
      return res.status(400).json({
        success: false,
        error: 'Debe proporcionar el ID del centro',
      });
    }

    // Leer archivo
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet('Inventario');

    if (!worksheet) {
      return res.status(400).json({
        success: false,
        error: 'El archivo no contiene una hoja llamada "Inventario"',
      });
    }

    const errores: Array<{ fila: number; errores: string[] }> = [];
    const itemsAgregados: any[] = [];
    const itemsActualizados: any[] = [];
    const itemsRechazados: any[] = [];

    // Procesar filas (saltar header)
    const rows: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar header
      rows.push({ row, rowNumber });
    });

    // Procesar cada fila
    for (const { row, rowNumber } of rows) {
      try {
        const rowData: any = {};
        worksheet.columns?.forEach((col: any, index: number) => {
          rowData[col.key] = row.getCell(index + 1).value;
        });

        // Validar campos obligatorios
        const erroresFila: string[] = [];

        if (!rowData.sku_interno) erroresFila.push('sku_interno es obligatorio');
        if (!rowData.nombre) erroresFila.push('nombre es obligatorio');
        if (!rowData.categoria) erroresFila.push('categoria es obligatoria');
        if (!rowData.unidad_medida) erroresFila.push('unidad_medida es obligatoria');
        if (rowData.precio_compra === undefined || rowData.precio_compra === null) {
          erroresFila.push('precio_compra es obligatorio');
        }
        if (rowData.precio_venta === undefined || rowData.precio_venta === null) {
          erroresFila.push('precio_venta es obligatorio');
        }

        if (erroresFila.length > 0) {
          errores.push({ fila: rowNumber, errores: erroresFila });
          itemsRechazados.push({ fila: rowNumber, datos: rowData, errores: erroresFila });
          continue;
        }

        // Verificar si el item existe
        const itemExistente = await prisma.inventario.findUnique({
          where: { sku_interno: rowData.sku_interno },
        });

        // Preparar datos
        const datos = {
          centro_id: parseInt(centro_id),
          sku_interno: rowData.sku_interno,
          codigo_barras: rowData.codigo_barras || null,
          nombre: rowData.nombre,
          categoria: rowData.categoria as CategoriaInventario,
          descripcion: rowData.descripcion || null,
          unidad_medida: rowData.unidad_medida,
          unidad_compra: rowData.unidad_compra || null,
          factor_conversion: rowData.factor_conversion ? parseInt(rowData.factor_conversion.toString()) : 1,
          stock_actual: rowData.stock_actual ? parseInt(rowData.stock_actual.toString()) : 0,
          stock_minimo: rowData.stock_minimo ? parseInt(rowData.stock_minimo.toString()) : 0,
          precio_compra: parseFloat(rowData.precio_compra.toString()),
          precio_venta: parseFloat(rowData.precio_venta.toString()),
          es_farmaco: rowData.es_farmaco === 'true' || rowData.es_farmaco === true,
          presentacion: rowData.presentacion || null,
          concentracion: rowData.concentracion || null,
          volumen: rowData.volumen || null,
          es_multidosis: rowData.es_multidosis === 'true' || rowData.es_multidosis === true,
          lote: rowData.lote || null,
          fecha_vencimiento: rowData.fecha_vencimiento ? new Date(rowData.fecha_vencimiento) : null,
        };

        if (itemExistente) {
          // Actualizar
          const itemActualizado = await prisma.inventario.update({
            where: { id: itemExistente.id },
            data: datos,
          });
          itemsActualizados.push(itemActualizado);
        } else {
          // Crear nuevo
          const itemNuevo = await prisma.inventario.create({
            data: datos,
          });
          itemsAgregados.push(itemNuevo);
        }
      } catch (error: any) {
        errores.push({
          fila: rowNumber,
          errores: [error.message || 'Error al procesar fila']
        });
        itemsRechazados.push({ fila: rowNumber, errores: [error.message] });
      }
    }

    // Respuesta
    res.json({
      success: true,
      message: 'Carga masiva completada',
      data: {
        total: rows.length,
        agregados: itemsAgregados.length,
        actualizados: itemsActualizados.length,
        rechazados: itemsRechazados.length,
        errores: errores,
        items_agregados: itemsAgregados,
        items_actualizados: itemsActualizados,
        items_rechazados: itemsRechazados,
      },
    });
  } catch (error: any) {
    console.error('Error en carga masiva:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al procesar carga masiva',
      message: error.message,
    });
  }
};
