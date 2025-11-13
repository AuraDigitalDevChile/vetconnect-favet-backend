/**
 * Controlador de Proveedores
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validación schemas
const crearProveedorSchema = z.object({
  rut: z.string().max(20),
  razon_social: z.string().max(300),
  nombre_contacto: z.string().max(200).optional(),
  telefono: z.string().max(50).optional(),
  email: z.string().email().max(200).optional(),
  direccion: z.string().max(500).optional(),
  vendedor_asignado: z.string().max(200).optional(),
});

const actualizarProveedorSchema = crearProveedorSchema.partial();

/**
 * Listar proveedores
 */
export const listar = async (req: Request, res: Response) => {
  try {
    const { buscar, activo, limit = '50', offset = '0' } = req.query;

    const where: any = {};

    if (activo !== undefined) where.activo = activo === 'true';

    if (buscar) {
      where.OR = [
        { razon_social: { contains: buscar as string, mode: 'insensitive' } },
        { rut: { contains: buscar as string, mode: 'insensitive' } },
        { nombre_contacto: { contains: buscar as string, mode: 'insensitive' } },
      ];
    }

    const [proveedores, total] = await Promise.all([
      prisma.proveedor.findMany({
        where,
        include: {
          _count: {
            select: {
              ordenes_compra: true,
            },
          },
        },
        orderBy: { razon_social: 'asc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.proveedor.count({ where }),
    ]);

    res.json({
      success: true,
      data: proveedores,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    console.error('Error al listar proveedores:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener proveedores',
      message: error.message,
    });
  }
};

/**
 * Obtener un proveedor por ID
 */
export const obtener = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const proveedor = await prisma.proveedor.findUnique({
      where: { id: parseInt(id) },
      include: {
        ordenes_compra: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        error: 'Proveedor no encontrado',
      });
    }

    return res.json({
      success: true,
      data: proveedor,
    });
  } catch (error: any) {
    console.error('Error al obtener proveedor:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener proveedor',
      message: error.message,
    });
  }
};

/**
 * Crear nuevo proveedor
 */
export const crear = async (req: Request, res: Response) => {
  try {
    const datos = crearProveedorSchema.parse(req.body);

    // Verificar que el RUT no exista
    const rutExistente = await prisma.proveedor.findUnique({
      where: { rut: datos.rut },
    });

    if (rutExistente) {
      return res.status(400).json({
        success: false,
        error: 'El RUT ya está registrado',
      });
    }

    const proveedor = await prisma.proveedor.create({
      data: datos,
    });

    return res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: proveedor,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de proveedor inválidos',
        details: error.errors,
      });
    }

    console.error('Error al crear proveedor:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear proveedor',
      message: error.message,
    });
  }
};

/**
 * Actualizar proveedor
 */
export const actualizar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const datos = actualizarProveedorSchema.parse(req.body);

    const proveedorExistente = await prisma.proveedor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!proveedorExistente) {
      return res.status(404).json({
        success: false,
        error: 'Proveedor no encontrado',
      });
    }

    // Verificar RUT si se está actualizando
    if (datos.rut && datos.rut !== proveedorExistente.rut) {
      const rutExistente = await prisma.proveedor.findUnique({
        where: { rut: datos.rut },
      });

      if (rutExistente) {
        return res.status(400).json({
          success: false,
          error: 'El RUT ya está registrado',
        });
      }
    }

    const proveedor = await prisma.proveedor.update({
      where: { id: parseInt(id) },
      data: datos,
    });

    return res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: proveedor,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de proveedor inválidos',
        details: error.errors,
      });
    }

    console.error('Error al actualizar proveedor:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar proveedor',
      message: error.message,
    });
  }
};

/**
 * Eliminar proveedor (soft delete)
 */
export const eliminar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const proveedor = await prisma.proveedor.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            ordenes_compra: true,
          },
        },
      },
    });

    if (!proveedor) {
      return res.status(404).json({
        success: false,
        error: 'Proveedor no encontrado',
      });
    }

    // Verificar si tiene órdenes de compra activas
    if (proveedor._count.ordenes_compra > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar un proveedor con órdenes de compra asociadas',
      });
    }

    await prisma.proveedor.update({
      where: { id: parseInt(id) },
      data: { activo: false },
    });

    return res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente',
    });
  } catch (error: any) {
    console.error('Error al eliminar proveedor:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar proveedor',
      message: error.message,
    });
  }
};
