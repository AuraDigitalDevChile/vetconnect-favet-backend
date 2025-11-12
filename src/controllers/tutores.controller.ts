/**
 * Controlador de Tutores/Clientes
 * CRUD completo + validación RUT único + gestión pacientes
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { ApiResponseUtils } from '../utils/api-response.utils';

// ==========================================
// ESQUEMAS DE VALIDACIÓN
// ==========================================

const crearTutorSchema = z.object({
  rut: z.string().min(1, 'El RUT es requerido').max(20),
  nombre_completo: z.string().min(1, 'El nombre es requerido').max(200),
  telefono: z.string().min(1, 'El teléfono es requerido').max(20),
  email: z.string().email('Email inválido').max(150),
  direccion: z.string().max(500).optional(),
  comuna: z.string().max(100).optional(),
  ciudad: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
  telefono_alternativo: z.string().max(20).optional(),
  observaciones: z.string().optional(),
});

const actualizarTutorSchema = crearTutorSchema.partial().omit({ rut: true });

const buscarSchema = z.object({
  query: z.string().min(1),
});

export class TutoresController {
  /**
   * GET /api/tutores
   * Listar todos los tutores con filtros
   */
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { activo, page = '1', limit = '20' } = req.query;

      // Construir filtros
      const where: any = {};
      if (activo !== undefined) where.activo = activo === 'true';

      // Paginación
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Consulta
      const [tutores, total] = await Promise.all([
        prisma.tutor.findMany({
          where,
          include: {
            pacientes: {
              select: {
                id: true,
                nombre: true,
                especie: true,
                numero_ficha: true,
                activo: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.tutor.count({ where }),
      ]);

      ApiResponseUtils.success(res, {
        tutores,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error al listar tutores:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener tutores');
    }
  }

  /**
   * GET /api/tutores/:id
   * Obtener detalle de un tutor
   */
  static async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const tutor = await prisma.tutor.findUnique({
        where: { id: parseInt(id) },
        include: {
          pacientes: {
            include: {
              centro: {
                select: {
                  nombre: true,
                  codigo: true,
                },
              },
            },
          },
        },
      });

      if (!tutor) {
        ApiResponseUtils.notFound(res, 'Tutor no encontrado');
        return;
      }

      ApiResponseUtils.success(res, tutor);
    } catch (error) {
      console.error('Error al obtener tutor:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener tutor');
    }
  }

  /**
   * POST /api/tutores
   * Crear nuevo tutor
   * Valida que el RUT sea único
   */
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos
      const result = crearTutorSchema.safeParse(req.body);
      if (!result.success) {
        ApiResponseUtils.validationError(res, result.error.errors[0].message);
        return;
      }

      const data = result.data;

      // Verificar que el RUT no exista
      const tutorExistente = await prisma.tutor.findUnique({
        where: { rut: data.rut },
      });

      if (tutorExistente) {
        ApiResponseUtils.badRequest(
          res,
          `Ya existe un tutor registrado con el RUT ${data.rut}`
        );
        return;
      }

      // Crear tutor
      const tutor = await prisma.tutor.create({
        data,
      });

      ApiResponseUtils.created(res, tutor, 'Tutor creado exitosamente');
    } catch (error) {
      console.error('Error al crear tutor:', error);
      ApiResponseUtils.serverError(res, 'Error al crear tutor');
    }
  }

  /**
   * PUT /api/tutores/:id
   * Actualizar tutor
   */
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validar datos
      const result = actualizarTutorSchema.safeParse(req.body);
      if (!result.success) {
        ApiResponseUtils.validationError(res, result.error.errors[0].message);
        return;
      }

      const data = result.data;

      // Verificar que existe
      const tutorExistente = await prisma.tutor.findUnique({
        where: { id: parseInt(id) },
      });

      if (!tutorExistente) {
        ApiResponseUtils.notFound(res, 'Tutor no encontrado');
        return;
      }

      // Actualizar
      const tutor = await prisma.tutor.update({
        where: { id: parseInt(id) },
        data,
      });

      ApiResponseUtils.success(res, tutor, 'Tutor actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar tutor:', error);
      ApiResponseUtils.serverError(res, 'Error al actualizar tutor');
    }
  }

  /**
   * DELETE /api/tutores/:id
   * Eliminar tutor (soft delete)
   */
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar que existe
      const tutor = await prisma.tutor.findUnique({
        where: { id: parseInt(id) },
        include: {
          pacientes: true,
        },
      });

      if (!tutor) {
        ApiResponseUtils.notFound(res, 'Tutor no encontrado');
        return;
      }

      // Verificar si tiene pacientes activos
      const pacientesActivos = tutor.pacientes.filter((p) => p.activo);
      if (pacientesActivos.length > 0) {
        ApiResponseUtils.badRequest(
          res,
          `No se puede eliminar el tutor porque tiene ${pacientesActivos.length} paciente(s) activo(s)`
        );
        return;
      }

      // Soft delete
      await prisma.tutor.update({
        where: { id: parseInt(id) },
        data: { activo: false },
      });

      ApiResponseUtils.success(res, null, 'Tutor eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar tutor:', error);
      ApiResponseUtils.serverError(res, 'Error al eliminar tutor');
    }
  }

  /**
   * GET /api/tutores/buscar
   * Búsqueda avanzada de tutores
   */
  static async buscar(req: Request, res: Response): Promise<void> {
    try {
      const result = buscarSchema.safeParse(req.query);
      if (!result.success) {
        ApiResponseUtils.validationError(res, result.error.errors[0].message);
        return;
      }

      const { query } = result.data;

      const where: any = {
        OR: [
          { nombre_completo: { contains: query, mode: 'insensitive' } },
          { rut: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { telefono: { contains: query, mode: 'insensitive' } },
        ],
      };

      const tutores = await prisma.tutor.findMany({
        where,
        include: {
          pacientes: {
            select: {
              id: true,
              nombre: true,
              especie: true,
            },
          },
        },
        take: 20,
        orderBy: { nombre_completo: 'asc' },
      });

      ApiResponseUtils.success(res, { tutores });
    } catch (error) {
      console.error('Error al buscar tutores:', error);
      ApiResponseUtils.serverError(res, 'Error al buscar tutores');
    }
  }

  /**
   * GET /api/tutores/:id/pacientes
   * Obtener todos los pacientes de un tutor
   */
  static async obtenerPacientes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar que el tutor existe
      const tutor = await prisma.tutor.findUnique({
        where: { id: parseInt(id) },
      });

      if (!tutor) {
        ApiResponseUtils.notFound(res, 'Tutor no encontrado');
        return;
      }

      // Obtener pacientes
      const pacientes = await prisma.paciente.findMany({
        where: { tutor_id: parseInt(id) },
        include: {
          centro: {
            select: {
              nombre: true,
              codigo: true,
            },
          },
        },
        orderBy: { nombre: 'asc' },
      });

      ApiResponseUtils.success(res, {
        tutor: {
          id: tutor.id,
          nombre_completo: tutor.nombre_completo,
          rut: tutor.rut,
        },
        pacientes,
      });
    } catch (error) {
      console.error('Error al obtener pacientes del tutor:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener pacientes');
    }
  }

  /**
   * POST /api/tutores/:id/pacientes/:pacienteId
   * Asociar un paciente existente a un tutor (cambiar tutor)
   */
  static async asociarPaciente(req: Request, res: Response): Promise<void> {
    try {
      const { id, pacienteId } = req.params;

      // Verificar que el tutor existe
      const tutor = await prisma.tutor.findUnique({
        where: { id: parseInt(id) },
      });

      if (!tutor) {
        ApiResponseUtils.notFound(res, 'Tutor no encontrado');
        return;
      }

      // Verificar que el paciente existe
      const paciente = await prisma.paciente.findUnique({
        where: { id: parseInt(pacienteId) },
      });

      if (!paciente) {
        ApiResponseUtils.notFound(res, 'Paciente no encontrado');
        return;
      }

      // Asociar paciente a tutor
      const pacienteActualizado = await prisma.paciente.update({
        where: { id: parseInt(pacienteId) },
        data: { tutor_id: parseInt(id) },
        include: {
          tutor: true,
        },
      });

      ApiResponseUtils.success(
        res,
        pacienteActualizado,
        'Paciente asociado al tutor exitosamente'
      );
    } catch (error) {
      console.error('Error al asociar paciente:', error);
      ApiResponseUtils.serverError(res, 'Error al asociar paciente');
    }
  }

  /**
   * GET /api/tutores/verificar-rut/:rut
   * Verificar si un RUT ya existe (para prevenir duplicados)
   */
  static async verificarRut(req: Request, res: Response): Promise<void> {
    try {
      const { rut } = req.params;

      const tutor = await prisma.tutor.findUnique({
        where: { rut },
        select: {
          id: true,
          nombre_completo: true,
          rut: true,
          activo: true,
        },
      });

      if (tutor) {
        ApiResponseUtils.success(res, {
          existe: true,
          tutor,
        });
      } else {
        ApiResponseUtils.success(res, {
          existe: false,
        });
      }
    } catch (error) {
      console.error('Error al verificar RUT:', error);
      ApiResponseUtils.serverError(res, 'Error al verificar RUT');
    }
  }
}
