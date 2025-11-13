/**
 * CONTROLLER DE RECETAS MÉDICAS
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Listar recetas
 */
export const listar = async (req: Request, res: Response) => {
  try {
    const { paciente_id, ficha_id, page = 1, limit = 10 } = req.query;

    const where: any = {};
    if (paciente_id) where.paciente_id = parseInt(paciente_id as string);
    if (ficha_id) where.ficha_id = parseInt(ficha_id as string);

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [recetas, total] = await Promise.all([
      prisma.receta.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          ficha_clinica: {
            select: {
              fecha_consulta: true,
              paciente: { select: { nombre: true } }
            }
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.receta.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        recetas,
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
 * Obtener receta por ID
 */
export const obtener = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const receta = await prisma.receta.findUnique({
      where: { id: parseInt(id) },
      include: {
        ficha_clinica: {
          include: {
            paciente: true,
          }
        },
      },
    });

    if (!receta) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }

    return res.json({ success: true, data: receta });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Crear receta
 */
export const crear = async (req: Request, res: Response) => {
  try {
    const { ficha_clinica_id, contenido, archivo_pdf_url } = req.body;

    const receta = await prisma.receta.create({
      data: {
        ficha_clinica: { connect: { id: ficha_clinica_id } },
        contenido,
        archivo_pdf_url,
      },
    });

    res.status(201).json({ success: true, data: receta });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Actualizar receta
 */
export const actualizar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contenido, archivo_pdf_url } = req.body;

    const receta = await prisma.receta.update({
      where: { id: parseInt(id) },
      data: {
        contenido,
        archivo_pdf_url,
      },
    });

    res.json({ success: true, data: receta });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
