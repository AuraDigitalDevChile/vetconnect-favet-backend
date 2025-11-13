/**
 * CONTROLLER DE BOXES / CANILES / PABELLONES
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Listar boxes
 */
export const listar = async (req: Request, res: Response) => {
  try {
    const { centro_id, tipo, activo, page = 1, limit = 50 } = req.query;

    const where: any = {};
    if (centro_id) where.centro_id = parseInt(centro_id as string);
    if (tipo) where.tipo = tipo as string;
    if (activo !== undefined) where.activo = activo === 'true';

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [boxes, total] = await Promise.all([
      prisma.box.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          _count: {
            select: {
              hospitalizaciones: true,
              cirugias: true,
            },
          },
        },
        orderBy: { nombre: 'asc' },
      }),
      prisma.box.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        boxes,
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
 * Obtener box por ID
 */
export const obtener = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const box = await prisma.box.findUnique({
      where: { id: parseInt(id) },
      include: {
        hospitalizaciones: {
          where: { estado: 'ACTIVA' },
          include: {
            paciente: { select: { nombre: true } },
          },
        },
        cirugias: {
          where: { estado: 'EN_CURSO' },
          include: {
            paciente: { select: { nombre: true } },
          },
        },
      },
    });

    if (!box) {
      return res.status(404).json({ success: false, message: 'Box no encontrado' });
    }

    res.json({ success: true, data: box });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Crear box
 */
export const crear = async (req: Request, res: Response) => {
  try {
    const { centro_id, nombre, tipo, capacidad } = req.body;

    const box = await prisma.box.create({
      data: {
        centro: { connect: { id: centro_id } },
        nombre,
        tipo, // PABELLON, CANIL, BOX, etc.
        capacidad: capacidad || 1,
        activo: true,
      },
    });

    res.status(201).json({ success: true, data: box });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Actualizar box
 */
export const actualizar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, capacidad, activo } = req.body;

    const box = await prisma.box.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        tipo,
        capacidad,
        activo,
      },
    });

    res.json({ success: true, data: box });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Verificar disponibilidad de boxes
 */
export const verificarDisponibilidad = async (req: Request, res: Response) => {
  try {
    const { centro_id, tipo } = req.query;

    const where: any = {
      centro_id: parseInt(centro_id as string),
      activo: true,
    };
    if (tipo) where.tipo = tipo as string;

    const boxes = await prisma.box.findMany({
      where,
      include: {
        hospitalizaciones: {
          where: { estado: 'ACTIVA' },
        },
        cirugias: {
          where: { estado: 'EN_CURSO' },
        },
      },
    });

    const disponibilidad = boxes.map(box => ({
      id: box.id,
      nombre: box.nombre,
      tipo: box.tipo,
      capacidad: box.capacidad,
      ocupados: box.hospitalizaciones.length + box.cirugias.length,
      disponible: (box.capacidad - (box.hospitalizaciones.length + box.cirugias.length)) > 0,
    }));

    res.json({ success: true, data: disponibilidad });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
