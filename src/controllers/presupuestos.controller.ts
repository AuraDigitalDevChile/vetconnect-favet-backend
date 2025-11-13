/**
 * CONTROLLER DE PRESUPUESTOS
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Listar presupuestos
 */
export const listar = async (req: Request, res: Response) => {
  try {
    const { centro_id, paciente_id, tutor_id, estado, page = 1, limit = 10 } = req.query;

    const where: any = {};
    if (centro_id) where.centro_id = parseInt(centro_id as string);
    if (paciente_id) where.paciente_id = parseInt(paciente_id as string);
    if (tutor_id) where.tutor_id = parseInt(tutor_id as string);
    if (estado) where.estado = estado as string;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [presupuestos, total] = await Promise.all([
      prisma.presupuesto.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          paciente: { select: { nombre: true } },
          tutor: { select: { nombre_completo: true } },
          usuario: { select: { nombre_completo: true } },
          items: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.presupuesto.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        presupuestos,
        pagination: {
          total,
          page: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Obtener presupuesto por ID
 */
export const obtener = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: parseInt(id) },
      include: {
        paciente: true,
        tutor: true,
        usuario: { select: { nombre_completo: true } },
        items: true,
      },
    });

    if (!presupuesto) {
      return res.status(404).json({ success: false, message: 'Presupuesto no encontrado' });
    }

    res.json({ success: true, data: presupuesto });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Crear presupuesto
 */
export const crear = async (req: Request, res: Response) => {
  try {
    const { centro_id, paciente_id, tutor_id, usuario_id, items, observaciones } = req.body;

    const presupuesto = await prisma.presupuesto.create({
      data: {
        centro: { connect: { id: centro_id } },
        paciente: { connect: { id: paciente_id } },
        tutor: tutor_id ? { connect: { id: tutor_id } } : undefined,
        usuario: { connect: { id: usuario_id } },
        observaciones,
        estado: 'PENDIENTE',
        items: {
          create: items.map((item: any) => ({
            tipo_item: item.tipo_item,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Calcular totales
    const subtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    await prisma.presupuesto.update({
      where: { id: presupuesto.id },
      data: { subtotal, iva, total },
    });

    res.status(201).json({ success: true, data: presupuesto });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Actualizar estado del presupuesto
 */
export const actualizarEstado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const presupuesto = await prisma.presupuesto.update({
      where: { id: parseInt(id) },
      data: { estado },
    });

    res.json({ success: true, data: presupuesto });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
