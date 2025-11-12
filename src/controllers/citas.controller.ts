/**
 * Controlador de Citas
 *
 * Endpoints:
 * - GET /api/citas - Listar citas con filtros y paginación
 * - GET /api/citas/:id - Obtener detalle de una cita
 * - POST /api/citas - Crear nueva cita
 * - PUT /api/citas/:id - Actualizar cita
 * - DELETE /api/citas/:id - Cancelar cita
 * - PATCH /api/citas/:id/confirmar - Confirmar cita
 * - PATCH /api/citas/:id/estado - Cambiar estado de cita
 * - GET /api/citas/disponibilidad - Verificar disponibilidad de horarios
 * - GET /api/citas/veterinario/:veterinarioId - Citas de un veterinario
 * - GET /api/citas/paciente/:pacienteId - Citas de un paciente
 */

import { Request, Response } from 'express';
import { PrismaClient, TipoCita, EstadoCita } from '@prisma/client';
import { z } from 'zod';
import { ApiResponseUtils } from '../utils/api-response.utils';

const prisma = new PrismaClient();

// ===== VALIDACIONES CON ZOD =====

const citaSchema = z.object({
  centro_id: z.number().int().positive(),
  paciente_id: z.number().int().positive(),
  tutor_id: z.number().int().positive(),
  veterinario_id: z.number().int().positive(),
  box_id: z.number().int().positive().optional().nullable(),
  tipo: z.enum([
    'CONSULTA_GENERAL',
    'CONTROL',
    'VACUNACION',
    'CIRUGIA',
    'EMERGENCIA',
    'TELEMEDICINA',
  ]),
  fecha: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Fecha inválida',
  }),
  hora: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Hora inválida (formato HH:MM)',
  }),
  duracion_minutos: z.number().int().min(15).max(240).default(30),
  motivo: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

const citaUpdateSchema = citaSchema.partial();

const estadoCitaSchema = z.object({
  estado: z.enum(['PROGRAMADA', 'CONFIRMADA', 'EN_CURSO', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO']),
  motivo_cancelacion: z.string().optional(),
});

// ===== CONTROLADOR =====

export class CitasController {
  /**
   * GET /api/citas
   * Listar citas con filtros y paginación
   */
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        centro_id,
        veterinario_id,
        paciente_id,
        tutor_id,
        fecha,
        estado,
        tipo,
        page = '1',
        limit = '50',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Construir filtros
      const where: any = {};

      if (centro_id) where.centro_id = parseInt(centro_id as string);
      if (veterinario_id) where.veterinario_id = parseInt(veterinario_id as string);
      if (paciente_id) where.paciente_id = parseInt(paciente_id as string);
      if (tutor_id) where.tutor_id = parseInt(tutor_id as string);
      if (estado) where.estado = estado as EstadoCita;
      if (tipo) where.tipo = tipo as TipoCita;

      // Filtro por fecha
      if (fecha) {
        const fechaInicio = new Date(fecha as string);
        fechaInicio.setHours(0, 0, 0, 0);
        const fechaFin = new Date(fecha as string);
        fechaFin.setHours(23, 59, 59, 999);

        where.fecha = {
          gte: fechaInicio,
          lte: fechaFin,
        };
      }

      // Consultar citas
      const [citas, total] = await Promise.all([
        prisma.cita.findMany({
          where,
          include: {
            paciente: {
              select: {
                id: true,
                nombre: true,
                especie: true,
                raza: true,
                numero_ficha: true,
              },
            },
            tutor: {
              select: {
                id: true,
                nombre_completo: true,
                rut: true,
                telefono: true,
                email: true,
              },
            },
            veterinario: {
              select: {
                id: true,
                nombre_completo: true,
                email: true,
              },
            },
            box: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
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
          orderBy: [
            { fecha: 'asc' },
            { hora: 'asc' },
          ],
          skip,
          take: limitNum,
        }),
        prisma.cita.count({ where }),
      ]);

      ApiResponseUtils.success(res, {
        citas,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error('Error al listar citas:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener citas');
    }
  }

  /**
   * GET /api/citas/:id
   * Obtener detalle de una cita
   */
  static async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cita = await prisma.cita.findUnique({
        where: { id: parseInt(id) },
        include: {
          paciente: {
            include: {
              tutor: true,
            },
          },
          tutor: true,
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
              telefono: true,
              rol: true,
            },
          },
          box: true,
          centro: true,
          ficha_clinica: {
            select: {
              id: true,
              numero_ficha_clinica: true,
              diagnostico: true,
              estado: true,
              created_at: true,
            },
          },
        },
      });

      if (!cita) {
        ApiResponseUtils.notFound(res, 'Cita no encontrada');
        return;
      }

      ApiResponseUtils.success(res, cita);
    } catch (error: any) {
      console.error('Error al obtener cita:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener detalle de cita');
    }
  }

  /**
   * POST /api/citas
   * Crear nueva cita
   */
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos
      const validacion = citaSchema.safeParse(req.body);

      if (!validacion.success) {
        ApiResponseUtils.validationError(res, validacion.error.errors);
        return;
      }

      const data = validacion.data;

      // Verificar que el paciente existe y está activo
      const paciente = await prisma.paciente.findUnique({
        where: { id: data.paciente_id },
      });

      if (!paciente || !paciente.activo) {
        ApiResponseUtils.badRequest(res, 'Paciente no encontrado o inactivo');
        return;
      }

      if (paciente.fallecido) {
        ApiResponseUtils.badRequest(res, 'No se pueden agendar citas para pacientes fallecidos');
        return;
      }

      // Verificar que el veterinario existe y está activo
      const veterinario = await prisma.usuario.findUnique({
        where: { id: data.veterinario_id },
      });

      if (!veterinario || !veterinario.activo) {
        ApiResponseUtils.badRequest(res, 'Veterinario no encontrado o inactivo');
        return;
      }

      // Verificar disponibilidad de horario
      const fechaCita = new Date(data.fecha);
      fechaCita.setHours(0, 0, 0, 0);

      const [horaHH, horaMM] = data.hora.split(':').map(Number);
      const fechaHoraInicio = new Date(fechaCita);
      fechaHoraInicio.setHours(horaHH, horaMM, 0, 0);

      const fechaHoraFin = new Date(fechaHoraInicio);
      fechaHoraFin.setMinutes(fechaHoraFin.getMinutes() + data.duracion_minutos);

      // Buscar conflictos de horario para el veterinario
      const conflictos = await prisma.cita.findMany({
        where: {
          veterinario_id: data.veterinario_id,
          fecha: fechaCita,
          estado: {
            notIn: ['CANCELADA', 'NO_ASISTIO'],
          },
        },
      });

      // Verificar solapamiento de horarios
      for (const conflicto of conflictos) {
        const [confHH, confMM] = conflicto.hora.split(':').map(Number);
        const confInicio = new Date(conflicto.fecha);
        confInicio.setHours(confHH, confMM, 0, 0);
        const confFin = new Date(confInicio);
        confFin.setMinutes(confFin.getMinutes() + conflicto.duracion_minutos);

        // Verificar solapamiento
        if (
          (fechaHoraInicio >= confInicio && fechaHoraInicio < confFin) ||
          (fechaHoraFin > confInicio && fechaHoraFin <= confFin) ||
          (fechaHoraInicio <= confInicio && fechaHoraFin >= confFin)
        ) {
          ApiResponseUtils.badRequest(
            res,
            `El veterinario ya tiene una cita programada a las ${conflicto.hora}. Por favor seleccione otro horario.`
          );
          return;
        }
      }

      // Crear cita
      const cita = await prisma.cita.create({
        data: {
          centro_id: data.centro_id,
          paciente_id: data.paciente_id,
          tutor_id: data.tutor_id,
          veterinario_id: data.veterinario_id,
          box_id: data.box_id || null,
          tipo: data.tipo,
          fecha: fechaCita,
          hora: data.hora,
          duracion_minutos: data.duracion_minutos,
          motivo: data.motivo || null,
          observaciones: data.observaciones || null,
          estado: 'PROGRAMADA',
        },
        include: {
          paciente: true,
          tutor: true,
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          box: true,
          centro: true,
        },
      });

      ApiResponseUtils.success(res, cita, 'Cita creada exitosamente', 201);
    } catch (error: any) {
      console.error('Error al crear cita:', error);
      ApiResponseUtils.serverError(res, 'Error al crear cita');
    }
  }

  /**
   * PUT /api/citas/:id
   * Actualizar cita
   */
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar que la cita existe
      const citaExistente = await prisma.cita.findUnique({
        where: { id: parseInt(id) },
      });

      if (!citaExistente) {
        ApiResponseUtils.notFound(res, 'Cita no encontrada');
        return;
      }

      // No permitir modificar citas canceladas o completadas
      if (['CANCELADA', 'COMPLETADA', 'NO_ASISTIO'].includes(citaExistente.estado)) {
        ApiResponseUtils.badRequest(
          res,
          `No se puede modificar una cita en estado ${citaExistente.estado}`
        );
        return;
      }

      // Validar datos
      const validacion = citaUpdateSchema.safeParse(req.body);

      if (!validacion.success) {
        ApiResponseUtils.validationError(res, validacion.error.errors);
        return;
      }

      const data = validacion.data;

      // Si cambia fecha/hora/veterinario, verificar disponibilidad
      if (data.fecha || data.hora || data.veterinario_id) {
        const veterinarioId = data.veterinario_id || citaExistente.veterinario_id;
        const fechaCita = data.fecha ? new Date(data.fecha) : citaExistente.fecha;
        fechaCita.setHours(0, 0, 0, 0);
        const hora = data.hora || citaExistente.hora;
        const duracion = data.duracion_minutos || citaExistente.duracion_minutos;

        const [horaHH, horaMM] = hora.split(':').map(Number);
        const fechaHoraInicio = new Date(fechaCita);
        fechaHoraInicio.setHours(horaHH, horaMM, 0, 0);

        const fechaHoraFin = new Date(fechaHoraInicio);
        fechaHoraFin.setMinutes(fechaHoraFin.getMinutes() + duracion);

        // Buscar conflictos (excluyendo la cita actual)
        const conflictos = await prisma.cita.findMany({
          where: {
            id: { not: parseInt(id) },
            veterinario_id: veterinarioId,
            fecha: fechaCita,
            estado: {
              notIn: ['CANCELADA', 'NO_ASISTIO'],
            },
          },
        });

        // Verificar solapamiento
        for (const conflicto of conflictos) {
          const [confHH, confMM] = conflicto.hora.split(':').map(Number);
          const confInicio = new Date(conflicto.fecha);
          confInicio.setHours(confHH, confMM, 0, 0);
          const confFin = new Date(confInicio);
          confFin.setMinutes(confFin.getMinutes() + conflicto.duracion_minutos);

          if (
            (fechaHoraInicio >= confInicio && fechaHoraInicio < confFin) ||
            (fechaHoraFin > confInicio && fechaHoraFin <= confFin) ||
            (fechaHoraInicio <= confInicio && fechaHoraFin >= confFin)
          ) {
            ApiResponseUtils.badRequest(
              res,
              `El veterinario ya tiene una cita programada a las ${conflicto.hora}`
            );
            return;
          }
        }
      }

      // Actualizar cita
      const updateData: any = {};

      if (data.veterinario_id) updateData.veterinario_id = data.veterinario_id;
      if (data.box_id !== undefined) updateData.box_id = data.box_id;
      if (data.tipo) updateData.tipo = data.tipo;
      if (data.fecha) {
        const fechaCita = new Date(data.fecha);
        fechaCita.setHours(0, 0, 0, 0);
        updateData.fecha = fechaCita;
      }
      if (data.hora) updateData.hora = data.hora;
      if (data.duracion_minutos) updateData.duracion_minutos = data.duracion_minutos;
      if (data.motivo !== undefined) updateData.motivo = data.motivo;
      if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

      const citaActualizada = await prisma.cita.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          paciente: true,
          tutor: true,
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          box: true,
          centro: true,
        },
      });

      ApiResponseUtils.success(res, citaActualizada, 'Cita actualizada exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar cita:', error);
      ApiResponseUtils.serverError(res, 'Error al actualizar cita');
    }
  }

  /**
   * DELETE /api/citas/:id
   * Cancelar cita (no se elimina, se cambia estado a CANCELADA)
   */
  static async cancelar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { motivo_cancelacion } = req.body;

      const cita = await prisma.cita.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cita) {
        ApiResponseUtils.notFound(res, 'Cita no encontrada');
        return;
      }

      if (cita.estado === 'CANCELADA') {
        ApiResponseUtils.badRequest(res, 'La cita ya está cancelada');
        return;
      }

      if (cita.estado === 'COMPLETADA') {
        ApiResponseUtils.badRequest(res, 'No se puede cancelar una cita completada');
        return;
      }

      // Actualizar estado
      const citaCancelada = await prisma.cita.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'CANCELADA',
          observaciones: motivo_cancelacion
            ? `CANCELADA: ${motivo_cancelacion}\n${cita.observaciones || ''}`
            : cita.observaciones,
        },
        include: {
          paciente: true,
          tutor: true,
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
        },
      });

      ApiResponseUtils.success(res, citaCancelada, 'Cita cancelada exitosamente');
    } catch (error: any) {
      console.error('Error al cancelar cita:', error);
      ApiResponseUtils.serverError(res, 'Error al cancelar cita');
    }
  }

  /**
   * PATCH /api/citas/:id/confirmar
   * Confirmar cita
   */
  static async confirmar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cita = await prisma.cita.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cita) {
        ApiResponseUtils.notFound(res, 'Cita no encontrada');
        return;
      }

      if (cita.estado !== 'PROGRAMADA') {
        ApiResponseUtils.badRequest(res, 'Solo se pueden confirmar citas en estado PROGRAMADA');
        return;
      }

      const citaConfirmada = await prisma.cita.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'CONFIRMADA',
          confirmada: true,
          fecha_confirmacion: new Date(),
        },
        include: {
          paciente: true,
          tutor: true,
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
        },
      });

      ApiResponseUtils.success(res, citaConfirmada, 'Cita confirmada exitosamente');
    } catch (error: any) {
      console.error('Error al confirmar cita:', error);
      ApiResponseUtils.serverError(res, 'Error al confirmar cita');
    }
  }

  /**
   * PATCH /api/citas/:id/estado
   * Cambiar estado de cita
   */
  static async cambiarEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const validacion = estadoCitaSchema.safeParse(req.body);

      if (!validacion.success) {
        ApiResponseUtils.validationError(res, validacion.error.errors);
        return;
      }

      const { estado, motivo_cancelacion } = validacion.data;

      const cita = await prisma.cita.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cita) {
        ApiResponseUtils.notFound(res, 'Cita no encontrada');
        return;
      }

      const updateData: any = { estado };

      // Si se confirma la cita
      if (estado === 'CONFIRMADA' && !cita.confirmada) {
        updateData.confirmada = true;
        updateData.fecha_confirmacion = new Date();
      }

      // Si se cancela, agregar motivo
      if (estado === 'CANCELADA' && motivo_cancelacion) {
        updateData.observaciones = `CANCELADA: ${motivo_cancelacion}\n${cita.observaciones || ''}`;
      }

      const citaActualizada = await prisma.cita.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          paciente: true,
          tutor: true,
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
        },
      });

      ApiResponseUtils.success(res, citaActualizada, 'Estado de cita actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al cambiar estado de cita:', error);
      ApiResponseUtils.serverError(res, 'Error al actualizar estado de cita');
    }
  }

  /**
   * GET /api/citas/disponibilidad
   * Verificar disponibilidad de horarios para un veterinario en una fecha
   */
  static async verificarDisponibilidad(req: Request, res: Response): Promise<void> {
    try {
      const { veterinario_id, fecha, duracion_minutos = '30' } = req.query;

      if (!veterinario_id || !fecha) {
        ApiResponseUtils.badRequest(res, 'Se requiere veterinario_id y fecha');
        return;
      }

      const fechaCita = new Date(fecha as string);
      fechaCita.setHours(0, 0, 0, 0);

      const duracion = parseInt(duracion_minutos as string);

      // Obtener todas las citas del veterinario en esa fecha
      const citas = await prisma.cita.findMany({
        where: {
          veterinario_id: parseInt(veterinario_id as string),
          fecha: fechaCita,
          estado: {
            notIn: ['CANCELADA', 'NO_ASISTIO'],
          },
        },
        orderBy: {
          hora: 'asc',
        },
        select: {
          hora: true,
          duracion_minutos: true,
        },
      });

      // Generar horarios disponibles (8:00 a 18:00 por defecto)
      const horariosDisponibles: string[] = [];
      const horaInicio = 8;
      const horaFin = 18;
      const intervalo = 30; // minutos

      for (let h = horaInicio; h < horaFin; h++) {
        for (let m = 0; m < 60; m += intervalo) {
          const hora = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

          // Verificar si este horario está disponible
          const [horaHH, horaMM] = hora.split(':').map(Number);
          const propuestaInicio = new Date(fechaCita);
          propuestaInicio.setHours(horaHH, horaMM, 0, 0);
          const propuestaFin = new Date(propuestaInicio);
          propuestaFin.setMinutes(propuestaFin.getMinutes() + duracion);

          // Verificar solapamiento con citas existentes
          let disponible = true;

          for (const cita of citas) {
            const [citaHH, citaMM] = cita.hora.split(':').map(Number);
            const citaInicio = new Date(fechaCita);
            citaInicio.setHours(citaHH, citaMM, 0, 0);
            const citaFin = new Date(citaInicio);
            citaFin.setMinutes(citaFin.getMinutes() + cita.duracion_minutos);

            if (
              (propuestaInicio >= citaInicio && propuestaInicio < citaFin) ||
              (propuestaFin > citaInicio && propuestaFin <= citaFin) ||
              (propuestaInicio <= citaInicio && propuestaFin >= citaFin)
            ) {
              disponible = false;
              break;
            }
          }

          if (disponible) {
            horariosDisponibles.push(hora);
          }
        }
      }

      ApiResponseUtils.success(res, {
        fecha: fecha,
        veterinario_id: parseInt(veterinario_id as string),
        duracion_minutos: duracion,
        horarios_disponibles: horariosDisponibles,
        citas_existentes: citas.length,
      });
    } catch (error: any) {
      console.error('Error al verificar disponibilidad:', error);
      ApiResponseUtils.serverError(res, 'Error al verificar disponibilidad');
    }
  }

  /**
   * GET /api/citas/veterinario/:veterinarioId
   * Obtener citas de un veterinario
   */
  static async citasPorVeterinario(req: Request, res: Response): Promise<void> {
    try {
      const { veterinarioId } = req.params;
      const { fecha_desde, fecha_hasta, estado } = req.query;

      const where: any = {
        veterinario_id: parseInt(veterinarioId),
      };

      if (estado) {
        where.estado = estado as EstadoCita;
      }

      // Filtro de rango de fechas
      if (fecha_desde || fecha_hasta) {
        where.fecha = {};
        if (fecha_desde) {
          const inicio = new Date(fecha_desde as string);
          inicio.setHours(0, 0, 0, 0);
          where.fecha.gte = inicio;
        }
        if (fecha_hasta) {
          const fin = new Date(fecha_hasta as string);
          fin.setHours(23, 59, 59, 999);
          where.fecha.lte = fin;
        }
      }

      const citas = await prisma.cita.findMany({
        where,
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              especie: true,
              raza: true,
              numero_ficha: true,
            },
          },
          tutor: {
            select: {
              id: true,
              nombre_completo: true,
              telefono: true,
            },
          },
          box: true,
        },
        orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      });

      ApiResponseUtils.success(res, { citas, total: citas.length });
    } catch (error: any) {
      console.error('Error al obtener citas del veterinario:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener citas del veterinario');
    }
  }

  /**
   * GET /api/citas/paciente/:pacienteId
   * Obtener citas de un paciente
   */
  static async citasPorPaciente(req: Request, res: Response): Promise<void> {
    try {
      const { pacienteId } = req.params;
      const { estado } = req.query;

      const where: any = {
        paciente_id: parseInt(pacienteId),
      };

      if (estado) {
        where.estado = estado as EstadoCita;
      }

      const citas = await prisma.cita.findMany({
        where,
        include: {
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
          box: true,
          centro: true,
          ficha_clinica: {
            select: {
              id: true,
              numero_ficha_clinica: true,
              diagnostico: true,
            },
          },
        },
        orderBy: [{ fecha: 'desc' }, { hora: 'desc' }],
      });

      ApiResponseUtils.success(res, { citas, total: citas.length });
    } catch (error: any) {
      console.error('Error al obtener citas del paciente:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener citas del paciente');
    }
  }
}
