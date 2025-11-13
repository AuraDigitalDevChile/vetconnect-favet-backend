/**
 * CONTROLLER DE CONVENIOS
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Listar convenios
 */
export const listar = async (req: Request, res: Response) => {
  try {
    const { centro_id, activo, page = 1, limit = 10 } = req.query;

    const where: any = {};
    if (centro_id) where.centro_id = parseInt(centro_id as string);
    if (activo !== undefined) where.activo = activo === 'true';

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [convenios, total] = await Promise.all([
      prisma.convenio.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          _count: {
            select: { pacientes: true },
          },
        },
        orderBy: { nombre: 'asc' },
      }),
      prisma.convenio.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        convenios,
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
 * Obtener convenio por ID
 */
export const obtener = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const convenio = await prisma.convenio.findUnique({
      where: { id: parseInt(id) },
      include: {
        pacientes: {
          include: {
            paciente: { select: { nombre: true, numero_ficha: true } },
          },
        },
      },
    });

    if (!convenio) {
      return res.status(404).json({ success: false, message: 'Convenio no encontrado' });
    }

    res.json({ success: true, data: convenio });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Crear convenio
 */
export const crear = async (req: Request, res: Response) => {
  try {
    const { centro_id, nombre, descripcion, descuento_porcentaje, fecha_inicio, fecha_fin } = req.body;

    const convenio = await prisma.convenio.create({
      data: {
        centro: { connect: { id: centro_id } },
        nombre,
        descripcion,
        descuento_porcentaje,
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : undefined,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : undefined,
        activo: true,
      },
    });

    res.status(201).json({ success: true, data: convenio });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Actualizar convenio
 */
export const actualizar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, descuento_porcentaje, fecha_inicio, fecha_fin, activo } = req.body;

    const convenio = await prisma.convenio.update({
      where: { id: parseInt(id) },
      data: {
        nombre,
        descripcion,
        descuento_porcentaje,
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : undefined,
        fecha_fin: fecha_fin ? new Date(fecha_fin) : undefined,
        activo,
      },
    });

    res.json({ success: true, data: convenio });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Asignar paciente a convenio
 */
export const asignarPaciente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paciente_id } = req.body;

    const asignacion = await prisma.convenioPaciente.create({
      data: {
        convenio: { connect: { id: parseInt(id) } },
        paciente: { connect: { id: paciente_id } },
      },
    });

    res.status(201).json({ success: true, data: asignacion });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Remover paciente de convenio
 */
export const removerPaciente = async (req: Request, res: Response) => {
  try {
    const { id, paciente_id } = req.params;

    await prisma.convenioPaciente.deleteMany({
      where: {
        convenio_id: parseInt(id),
        paciente_id: parseInt(paciente_id),
      },
    });

    res.json({ success: true, message: 'Paciente removido del convenio' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
