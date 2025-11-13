/**
 * CONTROLLER DE EXÁMENES
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Listar exámenes
 */
export const listar = async (req: Request, res: Response) => {
  try {
    const { paciente_id, ficha_id, estado, page = 1, limit = 10 } = req.query;

    const where: any = {};
    if (paciente_id) where.paciente_id = parseInt(paciente_id as string);
    if (ficha_id) where.ficha_id = parseInt(ficha_id as string);
    if (estado) where.estado = estado as string;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [examenes, total] = await Promise.all([
      prisma.examen.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          paciente: { select: { nombre: true } },
          ficha: { select: { fecha_consulta: true } },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.examen.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        examenes,
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
 * Obtener examen por ID
 */
export const obtener = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const examen = await prisma.examen.findUnique({
      where: { id: parseInt(id) },
      include: {
        paciente: true,
        ficha: true,
      },
    });

    if (!examen) {
      return res.status(404).json({ success: false, message: 'Examen no encontrado' });
    }

    res.json({ success: true, data: examen });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Crear examen (solicitud)
 */
export const crear = async (req: Request, res: Response) => {
  try {
    const { paciente_id, ficha_id, tipo_examen, descripcion, indicaciones } = req.body;

    const examen = await prisma.examen.create({
      data: {
        paciente: { connect: { id: paciente_id } },
        ficha: ficha_id ? { connect: { id: ficha_id } } : undefined,
        tipo_examen,
        descripcion,
        indicaciones,
        estado: 'PENDIENTE',
      },
    });

    res.status(201).json({ success: true, data: examen });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Cargar resultados del examen
 */
export const cargarResultados = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resultados, observaciones, archivo_url } = req.body;

    const examen = await prisma.examen.update({
      where: { id: parseInt(id) },
      data: {
        resultados,
        observaciones,
        archivo_url,
        estado: 'COMPLETADO',
        fecha_resultado: new Date(),
      },
    });

    res.json({ success: true, data: examen });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Actualizar estado del examen
 */
export const actualizarEstado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const examen = await prisma.examen.update({
      where: { id: parseInt(id) },
      data: { estado },
    });

    res.json({ success: true, data: examen });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
