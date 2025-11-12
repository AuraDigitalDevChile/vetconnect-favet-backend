/**
 * Controlador de Pacientes
 * CRUD completo + funcionalidades especiales
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { ApiResponseUtils } from '../utils/api-response.utils';

// ==========================================
// ESQUEMAS DE VALIDACIÓN
// ==========================================

const crearPacienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  especie: z.enum(['CANINO', 'FELINO', 'EXOTICO', 'EQUINO', 'BOVINO', 'OTRO']),
  raza: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  sexo: z.enum(['MACHO', 'HEMBRA']),
  estado_reproductivo: z.enum(['ENTERO', 'CASTRADO', 'ESTERILIZADO']).optional(),
  tamanio: z.enum(['PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE']).optional(),
  caracter: z.enum(['DOCIL', 'NERVIOSO', 'AGRESIVO', 'MIEDOSO']).optional(),
  numero_chip: z.string().optional(),
  peso_actual: z.number().positive().optional(),
  habitat: z.string().optional(),
  tipo_alimentacion: z.string().optional(),
  alergias: z.string().optional(),
  observaciones: z.string().optional(),
  foto_url: z.string().url().optional(),
  centro_id: z.number().int().positive(),
  tutor_id: z.number().int().positive(),
});

const actualizarPacienteSchema = crearPacienteSchema.partial();

const buscarSchema = z.object({
  query: z.string().min(1),
  centro_id: z.string().optional(),
  especie: z.enum(['CANINO', 'FELINO', 'EXOTICO', 'EQUINO', 'BOVINO', 'OTRO']).optional(),
});

export class PacientesController {
  /**
   * GET /api/pacientes
   * Listar todos los pacientes con filtros
   */
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const { centro_id, especie, tutor_id, activo, page = '1', limit = '20' } = req.query;

      // Construir filtros
      const where: any = {};

      if (centro_id) where.centro_id = parseInt(centro_id as string);
      if (especie) where.especie = especie;
      if (tutor_id) where.tutor_id = parseInt(tutor_id as string);
      if (activo !== undefined) where.activo = activo === 'true';

      // Paginación
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Consulta
      const [pacientes, total] = await Promise.all([
        prisma.paciente.findMany({
          where,
          include: {
            tutor: {
              select: {
                id: true,
                nombre_completo: true,
                rut: true,
                telefono: true,
                email: true,
              },
            },
            centro: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.paciente.count({ where }),
      ]);

      ApiResponseUtils.success(res, {
        pacientes,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error al listar pacientes:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener pacientes');
    }
  }

  /**
   * GET /api/pacientes/:id
   * Obtener detalle de un paciente
   */
  static async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const paciente = await prisma.paciente.findUnique({
        where: { id: parseInt(id) },
        include: {
          tutor: true,
          centro: true,
          registros_peso: {
            orderBy: { fecha: 'desc' },
            take: 10,
          },
          vacunas: {
            orderBy: { fecha_aplicacion: 'desc' },
          },
          fichas_clinicas: {
            orderBy: { fecha_atencion: 'desc' },
            take: 5,
            include: {
              veterinario: {
                select: {
                  nombre_completo: true,
                  rut: true,
                },
              },
            },
          },
        },
      });

      if (!paciente) {
        ApiResponseUtils.notFound(res, 'Paciente no encontrado');
        return;
      }

      ApiResponseUtils.success(res, paciente);
    } catch (error) {
      console.error('Error al obtener paciente:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener paciente');
    }
  }

  /**
   * POST /api/pacientes
   * Crear nuevo paciente
   */
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos
      const result = crearPacienteSchema.safeParse(req.body);
      if (!result.success) {
        ApiResponseUtils.validationError(res, result.error.errors[0].message);
        return;
      }

      const data = result.data;

      // Verificar que el centro existe
      const centro = await prisma.centro.findUnique({
        where: { id: data.centro_id },
      });

      if (!centro) {
        ApiResponseUtils.notFound(res, 'Centro no encontrado');
        return;
      }

      // Verificar que el tutor existe
      const tutor = await prisma.tutor.findUnique({
        where: { id: data.tutor_id },
      });

      if (!tutor) {
        ApiResponseUtils.notFound(res, 'Tutor no encontrado');
        return;
      }

      // Generar número de ficha único consecutivo por centro
      const ultimoPaciente = await prisma.paciente.findFirst({
        where: { centro_id: data.centro_id },
        orderBy: { numero_ficha: 'desc' },
      });

      const numeroFicha = ultimoPaciente ? ultimoPaciente.numero_ficha + 1 : 1;

      // Crear paciente
      const paciente = await prisma.paciente.create({
        data: {
          ...data,
          numero_ficha: numeroFicha,
        },
        include: {
          tutor: true,
          centro: true,
        },
      });

      // Si se proporciona peso, crear registro inicial
      if (data.peso_actual) {
        await prisma.registro_peso.create({
          data: {
            paciente_id: paciente.id,
            peso: data.peso_actual,
            fecha: new Date(),
            observaciones: 'Peso inicial al crear paciente',
          },
        });
      }

      ApiResponseUtils.created(res, paciente, 'Paciente creado exitosamente');
    } catch (error) {
      console.error('Error al crear paciente:', error);
      ApiResponseUtils.serverError(res, 'Error al crear paciente');
    }
  }

  /**
   * PUT /api/pacientes/:id
   * Actualizar paciente
   */
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validar datos
      const result = actualizarPacienteSchema.safeParse(req.body);
      if (!result.success) {
        ApiResponseUtils.validationError(res, result.error.errors[0].message);
        return;
      }

      const data = result.data;

      // Verificar que existe
      const pacienteExistente = await prisma.paciente.findUnique({
        where: { id: parseInt(id) },
      });

      if (!pacienteExistente) {
        ApiResponseUtils.notFound(res, 'Paciente no encontrado');
        return;
      }

      // Si está fallecido, no permitir actualización
      if (pacienteExistente.fallecido) {
        ApiResponseUtils.badRequest(res, 'No se puede actualizar un paciente fallecido');
        return;
      }

      // Actualizar
      const paciente = await prisma.paciente.update({
        where: { id: parseInt(id) },
        data,
        include: {
          tutor: true,
          centro: true,
        },
      });

      // Si se actualizó el peso, crear registro
      if (data.peso_actual && data.peso_actual !== pacienteExistente.peso_actual) {
        await prisma.registro_peso.create({
          data: {
            paciente_id: paciente.id,
            peso: data.peso_actual,
            fecha: new Date(),
            observaciones: 'Actualización de peso',
          },
        });
      }

      ApiResponseUtils.success(res, paciente, 'Paciente actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar paciente:', error);
      ApiResponseUtils.serverError(res, 'Error al actualizar paciente');
    }
  }

  /**
   * DELETE /api/pacientes/:id
   * Eliminar paciente (soft delete)
   */
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar que existe
      const paciente = await prisma.paciente.findUnique({
        where: { id: parseInt(id) },
      });

      if (!paciente) {
        ApiResponseUtils.notFound(res, 'Paciente no encontrado');
        return;
      }

      // Soft delete
      await prisma.paciente.update({
        where: { id: parseInt(id) },
        data: { activo: false },
      });

      ApiResponseUtils.success(res, null, 'Paciente eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      ApiResponseUtils.serverError(res, 'Error al eliminar paciente');
    }
  }

  /**
   * PATCH /api/pacientes/:id/fallecido
   * Marcar paciente como fallecido
   * Bloquea automáticamente notificaciones y nuevas citas
   */
  static async marcarFallecido(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { fecha_fallecimiento, causa_fallecimiento } = req.body;

      // Verificar que existe
      const paciente = await prisma.paciente.findUnique({
        where: { id: parseInt(id) },
      });

      if (!paciente) {
        ApiResponseUtils.notFound(res, 'Paciente no encontrado');
        return;
      }

      if (paciente.fallecido) {
        ApiResponseUtils.badRequest(res, 'El paciente ya está marcado como fallecido');
        return;
      }

      // Marcar como fallecido
      const pacienteActualizado = await prisma.paciente.update({
        where: { id: parseInt(id) },
        data: {
          fallecido: true,
          fecha_fallecimiento: fecha_fallecimiento ? new Date(fecha_fallecimiento) : new Date(),
          causa_fallecimiento,
          activo: false, // También desactivar
        },
      });

      // Cancelar todas las citas futuras
      await prisma.cita.updateMany({
        where: {
          paciente_id: parseInt(id),
          fecha_hora: { gte: new Date() },
          estado: { notIn: ['CANCELADA', 'COMPLETADA'] },
        },
        data: {
          estado: 'CANCELADA',
        },
      });

      ApiResponseUtils.success(
        res,
        pacienteActualizado,
        'Paciente marcado como fallecido. Se han cancelado todas las citas futuras.'
      );
    } catch (error) {
      console.error('Error al marcar paciente como fallecido:', error);
      ApiResponseUtils.serverError(res, 'Error al procesar solicitud');
    }
  }

  /**
   * GET /api/pacientes/buscar
   * Búsqueda avanzada de pacientes
   */
  static async buscar(req: Request, res: Response): Promise<void> {
    try {
      const result = buscarSchema.safeParse(req.query);
      if (!result.success) {
        ApiResponseUtils.validationError(res, result.error.errors[0].message);
        return;
      }

      const { query, centro_id, especie } = result.data;

      const where: any = {
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { numero_chip: { contains: query, mode: 'insensitive' } },
          { numero_ficha: isNaN(parseInt(query)) ? undefined : parseInt(query) },
        ].filter((condition) => condition !== undefined),
      };

      if (centro_id) where.centro_id = parseInt(centro_id);
      if (especie) where.especie = especie;

      const pacientes = await prisma.paciente.findMany({
        where,
        include: {
          tutor: {
            select: {
              nombre_completo: true,
              telefono: true,
            },
          },
          centro: {
            select: {
              nombre: true,
            },
          },
        },
        take: 20,
        orderBy: { nombre: 'asc' },
      });

      ApiResponseUtils.success(res, { pacientes });
    } catch (error) {
      console.error('Error al buscar pacientes:', error);
      ApiResponseUtils.serverError(res, 'Error al buscar pacientes');
    }
  }

  /**
   * GET /api/pacientes/:id/historial
   * Obtener historial médico completo del paciente
   */
  static async obtenerHistorial(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar que el paciente existe
      const paciente = await prisma.paciente.findUnique({
        where: { id: parseInt(id) },
        include: {
          tutor: true,
        },
      });

      if (!paciente) {
        ApiResponseUtils.notFound(res, 'Paciente no encontrado');
        return;
      }

      // Obtener todo el historial
      const [fichasClinicas, hospitalizaciones, cirugias, vacunas, registrosPeso] =
        await Promise.all([
          prisma.ficha_clinica.findMany({
            where: { paciente_id: parseInt(id) },
            include: {
              veterinario: {
                select: { nombre_completo: true },
              },
            },
            orderBy: { fecha_atencion: 'desc' },
          }),
          prisma.hospitalizacion.findMany({
            where: { paciente_id: parseInt(id) },
            include: {
              veterinario: {
                select: { nombre_completo: true },
              },
            },
            orderBy: { fecha_ingreso: 'desc' },
          }),
          prisma.cirugia.findMany({
            where: { paciente_id: parseInt(id) },
            include: {
              cirujano: {
                select: { nombre_completo: true },
              },
            },
            orderBy: { fecha: 'desc' },
          }),
          prisma.vacuna.findMany({
            where: { paciente_id: parseInt(id) },
            orderBy: { fecha_aplicacion: 'desc' },
          }),
          prisma.registro_peso.findMany({
            where: { paciente_id: parseInt(id) },
            orderBy: { fecha: 'desc' },
          }),
        ]);

      ApiResponseUtils.success(res, {
        paciente,
        historial: {
          fichas_clinicas: fichasClinicas,
          hospitalizaciones,
          cirugias,
          vacunas,
          registros_peso: registrosPeso,
        },
      });
    } catch (error) {
      console.error('Error al obtener historial:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener historial médico');
    }
  }
}
