/**
 * Controlador de Fichas Clínicas
 *
 * Endpoints:
 * - GET /api/fichas - Listar fichas clínicas con filtros
 * - GET /api/fichas/:id - Obtener detalle de ficha clínica
 * - POST /api/fichas - Crear nueva ficha clínica
 * - PUT /api/fichas/:id - Actualizar ficha clínica
 * - DELETE /api/fichas/:id - Eliminar ficha clínica
 * - PATCH /api/fichas/:id/cerrar - Cerrar ficha clínica
 * - GET /api/fichas/paciente/:pacienteId - Historial médico del paciente
 *
 * Recetas:
 * - POST /api/fichas/:id/recetas - Agregar receta a ficha
 * - GET /api/fichas/:id/recetas - Listar recetas de ficha
 * - DELETE /api/fichas/:fichaId/recetas/:recetaId - Eliminar receta
 *
 * Exámenes:
 * - POST /api/fichas/:id/examenes - Agregar examen a ficha
 * - GET /api/fichas/:id/examenes - Listar exámenes de ficha
 * - PATCH /api/fichas/:fichaId/examenes/:examenId - Actualizar estado de examen
 * - DELETE /api/fichas/:fichaId/examenes/:examenId - Eliminar examen
 */

import { Request, Response } from 'express';
import { PrismaClient, EstadoFicha, TipoExamen, EstadoExamen } from '@prisma/client';
import { z } from 'zod';
import { ApiResponseUtils } from '../utils/api-response.utils';

const prisma = new PrismaClient();

// ===== VALIDACIONES CON ZOD =====

const fichaClinicaSchema = z.object({
  centro_id: z.number().int().positive(),
  paciente_id: z.number().int().positive(),
  tutor_id: z.number().int().positive(),
  veterinario_id: z.number().int().positive(),
  cita_id: z.number().int().positive().optional().nullable(),
  fecha_consulta: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Fecha inválida',
  }).optional(),
  motivo_consulta: z.string().min(1),
  duracion_sintomas: z.string().optional().nullable(),
  anamnesis_remota: z.string().optional().nullable(),
  anamnesis_actual: z.string().min(1),
  apetito: z.string().optional().nullable(),
  consumo_agua: z.string().optional().nullable(),
  defecacion: z.string().optional().nullable(),
  miccion: z.string().optional().nullable(),
  antecedentes: z.string().optional().nullable(),
  examen_fisico: z.string().optional().nullable(),
  temperatura: z.number().min(30).max(45).optional().nullable(),
  frecuencia_cardiaca: z.number().int().min(0).max(300).optional().nullable(),
  frecuencia_respiratoria: z.number().int().min(0).max(200).optional().nullable(),
  peso_kg: z.number().min(0).optional().nullable(),
  prediagnostico: z.string().optional().nullable(),
  diagnostico: z.string().optional().nullable(),
  tratamiento: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

const fichaUpdateSchema = fichaClinicaSchema.partial();

const recetaSchema = z.object({
  contenido: z.string().min(1),
  archivo_pdf_url: z.string().url().optional().nullable(),
});

const examenSchema = z.object({
  paciente_id: z.number().int().positive(),
  tipo: z.enum(['HEMOGRAMA', 'BIOQUIMICA', 'RADIOGRAFIA', 'ECOGRAFIA', 'ELECTROCARDIOGRAMA', 'OTRO']),
  nombre: z.string().min(1),
  descripcion: z.string().optional().nullable(),
  fecha_realizacion: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Fecha inválida',
  }).optional().nullable(),
  resultado_texto: z.string().optional().nullable(),
  resultado_archivo_url: z.string().url().optional().nullable(),
  precio: z.number().min(0).optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

const examenUpdateSchema = z.object({
  estado: z.enum(['SOLICITADO', 'EN_PROCESO', 'COMPLETADO', 'CANCELADO']).optional(),
  fecha_realizacion: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Fecha inválida',
  }).optional().nullable(),
  resultado_texto: z.string().optional().nullable(),
  resultado_archivo_url: z.string().url().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

// ===== CONTROLADOR =====

export class FichasController {
  /**
   * GET /api/fichas
   * Listar fichas clínicas con filtros
   */
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        centro_id,
        paciente_id,
        veterinario_id,
        tutor_id,
        fecha_desde,
        fecha_hasta,
        estado,
        page = '1',
        limit = '50',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Construir filtros
      const where: any = {};

      if (centro_id) where.centro_id = parseInt(centro_id as string);
      if (paciente_id) where.paciente_id = parseInt(paciente_id as string);
      if (veterinario_id) where.veterinario_id = parseInt(veterinario_id as string);
      if (tutor_id) where.tutor_id = parseInt(tutor_id as string);
      if (estado) where.estado = estado as EstadoFicha;

      // Filtro por rango de fechas
      if (fecha_desde || fecha_hasta) {
        where.fecha_consulta = {};
        if (fecha_desde) {
          const inicio = new Date(fecha_desde as string);
          inicio.setHours(0, 0, 0, 0);
          where.fecha_consulta.gte = inicio;
        }
        if (fecha_hasta) {
          const fin = new Date(fecha_hasta as string);
          fin.setHours(23, 59, 59, 999);
          where.fecha_consulta.lte = fin;
        }
      }

      // Consultar fichas
      const [fichas, total] = await Promise.all([
        prisma.fichaClinica.findMany({
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
            veterinario: {
              select: {
                id: true,
                nombre_completo: true,
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
            cita: {
              select: {
                id: true,
                fecha: true,
                hora: true,
              },
            },
            examenes: {
              select: {
                id: true,
                tipo: true,
                nombre: true,
                estado: true,
              },
            },
            recetas: {
              select: {
                id: true,
                created_at: true,
              },
            },
          },
          orderBy: {
            fecha_consulta: 'desc',
          },
          skip,
          take: limitNum,
        }),
        prisma.fichaClinica.count({ where }),
      ]);

      ApiResponseUtils.success(res, {
        fichas,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error('Error al listar fichas:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener fichas clínicas');
    }
  }

  /**
   * GET /api/fichas/:id
   * Obtener detalle completo de ficha clínica
   */
  static async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const ficha = await prisma.fichaClinica.findUnique({
        where: { id: parseInt(id) },
        include: {
          paciente: {
            include: {
              tutor: true,
            },
          },
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
              telefono: true,
              rol: true,
            },
          },
          centro: true,
          cita: true,
          examenes: {
            orderBy: {
              fecha_solicitud: 'desc',
            },
          },
          recetas: {
            orderBy: {
              created_at: 'desc',
            },
          },
          insumos_utilizados: {
            include: {
              inventario: {
                select: {
                  nombre: true,
                  categoria: true,
                },
              },
            },
          },
        },
      });

      if (!ficha) {
        ApiResponseUtils.notFound(res, 'Ficha clínica no encontrada');
        return;
      }

      ApiResponseUtils.success(res, ficha);
    } catch (error: any) {
      console.error('Error al obtener ficha:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener detalle de ficha clínica');
    }
  }

  /**
   * POST /api/fichas
   * Crear nueva ficha clínica
   */
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos
      const validacion = fichaClinicaSchema.safeParse(req.body);

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
        ApiResponseUtils.badRequest(res, 'No se pueden crear fichas para pacientes fallecidos');
        return;
      }

      // Si hay peso, registrarlo
      const registroPesoData = data.peso_kg
        ? {
            create: {
              peso_kg: data.peso_kg,
              fecha_registro: data.fecha_consulta ? new Date(data.fecha_consulta) : new Date(),
              observaciones: 'Registro automático desde ficha clínica',
            },
          }
        : undefined;

      // Actualizar peso del paciente si se proporciona
      if (data.peso_kg) {
        await prisma.paciente.update({
          where: { id: data.paciente_id },
          data: { peso_kg: data.peso_kg },
        });
      }

      // Crear ficha
      const ficha = await prisma.fichaClinica.create({
        data: {
          centro_id: data.centro_id,
          paciente_id: data.paciente_id,
          tutor_id: data.tutor_id,
          veterinario_id: data.veterinario_id,
          cita_id: data.cita_id || null,
          fecha_consulta: data.fecha_consulta ? new Date(data.fecha_consulta) : new Date(),
          motivo_consulta: data.motivo_consulta,
          duracion_sintomas: data.duracion_sintomas || null,
          anamnesis_remota: data.anamnesis_remota || null,
          anamnesis_actual: data.anamnesis_actual,
          apetito: data.apetito || null,
          consumo_agua: data.consumo_agua || null,
          defecacion: data.defecacion || null,
          miccion: data.miccion || null,
          antecedentes: data.antecedentes || null,
          examen_fisico: data.examen_fisico || null,
          temperatura: data.temperatura || null,
          frecuencia_cardiaca: data.frecuencia_cardiaca || null,
          frecuencia_respiratoria: data.frecuencia_respiratoria || null,
          peso_kg: data.peso_kg || null,
          prediagnostico: data.prediagnostico || null,
          diagnostico: data.diagnostico || null,
          tratamiento: data.tratamiento || null,
          observaciones: data.observaciones || null,
          estado: 'EN_CURSO',
        },
        include: {
          paciente: true,
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          centro: true,
        },
      });

      // Crear registro de peso si hay
      if (registroPesoData) {
        await prisma.registroPeso.create({
          data: {
            paciente_id: data.paciente_id,
            peso_kg: data.peso_kg!,
            fecha_registro: data.fecha_consulta ? new Date(data.fecha_consulta) : new Date(),
            observaciones: 'Registro automático desde ficha clínica',
          },
        });
      }

      ApiResponseUtils.success(res, ficha, 'Ficha clínica creada exitosamente', 201);
    } catch (error: any) {
      console.error('Error al crear ficha:', error);
      ApiResponseUtils.serverError(res, 'Error al crear ficha clínica');
    }
  }

  /**
   * PUT /api/fichas/:id
   * Actualizar ficha clínica
   */
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Verificar que la ficha existe
      const fichaExistente = await prisma.fichaClinica.findUnique({
        where: { id: parseInt(id) },
      });

      if (!fichaExistente) {
        ApiResponseUtils.notFound(res, 'Ficha clínica no encontrada');
        return;
      }

      // No permitir modificar fichas cerradas
      if (fichaExistente.estado === 'CERRADA') {
        ApiResponseUtils.badRequest(res, 'No se puede modificar una ficha cerrada');
        return;
      }

      // Validar datos
      const validacion = fichaUpdateSchema.safeParse(req.body);

      if (!validacion.success) {
        ApiResponseUtils.validationError(res, validacion.error.errors);
        return;
      }

      const data = validacion.data;

      // Construir objeto de actualización
      const updateData: any = {};

      if (data.motivo_consulta) updateData.motivo_consulta = data.motivo_consulta;
      if (data.duracion_sintomas !== undefined) updateData.duracion_sintomas = data.duracion_sintomas;
      if (data.anamnesis_remota !== undefined) updateData.anamnesis_remota = data.anamnesis_remota;
      if (data.anamnesis_actual) updateData.anamnesis_actual = data.anamnesis_actual;
      if (data.apetito !== undefined) updateData.apetito = data.apetito;
      if (data.consumo_agua !== undefined) updateData.consumo_agua = data.consumo_agua;
      if (data.defecacion !== undefined) updateData.defecacion = data.defecacion;
      if (data.miccion !== undefined) updateData.miccion = data.miccion;
      if (data.antecedentes !== undefined) updateData.antecedentes = data.antecedentes;
      if (data.examen_fisico !== undefined) updateData.examen_fisico = data.examen_fisico;
      if (data.temperatura !== undefined) updateData.temperatura = data.temperatura;
      if (data.frecuencia_cardiaca !== undefined) updateData.frecuencia_cardiaca = data.frecuencia_cardiaca;
      if (data.frecuencia_respiratoria !== undefined) updateData.frecuencia_respiratoria = data.frecuencia_respiratoria;
      if (data.peso_kg !== undefined) updateData.peso_kg = data.peso_kg;
      if (data.prediagnostico !== undefined) updateData.prediagnostico = data.prediagnostico;
      if (data.diagnostico !== undefined) updateData.diagnostico = data.diagnostico;
      if (data.tratamiento !== undefined) updateData.tratamiento = data.tratamiento;
      if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

      const fichaActualizada = await prisma.fichaClinica.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          paciente: true,
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          centro: true,
          examenes: true,
          recetas: true,
        },
      });

      ApiResponseUtils.success(res, fichaActualizada, 'Ficha clínica actualizada exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar ficha:', error);
      ApiResponseUtils.serverError(res, 'Error al actualizar ficha clínica');
    }
  }

  /**
   * DELETE /api/fichas/:id
   * Eliminar ficha clínica
   */
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const ficha = await prisma.fichaClinica.findUnique({
        where: { id: parseInt(id) },
      });

      if (!ficha) {
        ApiResponseUtils.notFound(res, 'Ficha clínica no encontrada');
        return;
      }

      await prisma.fichaClinica.delete({
        where: { id: parseInt(id) },
      });

      ApiResponseUtils.success(res, null, 'Ficha clínica eliminada exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar ficha:', error);
      ApiResponseUtils.serverError(res, 'Error al eliminar ficha clínica');
    }
  }

  /**
   * PATCH /api/fichas/:id/cerrar
   * Cerrar ficha clínica
   */
  static async cerrar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const ficha = await prisma.fichaClinica.findUnique({
        where: { id: parseInt(id) },
      });

      if (!ficha) {
        ApiResponseUtils.notFound(res, 'Ficha clínica no encontrada');
        return;
      }

      if (ficha.estado === 'CERRADA') {
        ApiResponseUtils.badRequest(res, 'La ficha ya está cerrada');
        return;
      }

      const fichaCerrada = await prisma.fichaClinica.update({
        where: { id: parseInt(id) },
        data: {
          estado: 'CERRADA',
        },
        include: {
          paciente: true,
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
        },
      });

      ApiResponseUtils.success(res, fichaCerrada, 'Ficha clínica cerrada exitosamente');
    } catch (error: any) {
      console.error('Error al cerrar ficha:', error);
      ApiResponseUtils.serverError(res, 'Error al cerrar ficha clínica');
    }
  }

  /**
   * GET /api/fichas/paciente/:pacienteId
   * Obtener historial médico completo del paciente
   */
  static async historialPaciente(req: Request, res: Response): Promise<void> {
    try {
      const { pacienteId } = req.params;

      const fichas = await prisma.fichaClinica.findMany({
        where: {
          paciente_id: parseInt(pacienteId),
        },
        include: {
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
          centro: {
            select: {
              id: true,
              nombre: true,
            },
          },
          examenes: {
            select: {
              id: true,
              tipo: true,
              nombre: true,
              estado: true,
              fecha_realizacion: true,
            },
          },
          recetas: {
            select: {
              id: true,
              created_at: true,
            },
          },
        },
        orderBy: {
          fecha_consulta: 'desc',
        },
      });

      ApiResponseUtils.success(res, { fichas, total: fichas.length });
    } catch (error: any) {
      console.error('Error al obtener historial:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener historial médico');
    }
  }

  // ===== RECETAS =====

  /**
   * POST /api/fichas/:id/recetas
   * Agregar receta a ficha clínica
   */
  static async agregarReceta(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const ficha = await prisma.fichaClinica.findUnique({
        where: { id: parseInt(id) },
      });

      if (!ficha) {
        ApiResponseUtils.notFound(res, 'Ficha clínica no encontrada');
        return;
      }

      const validacion = recetaSchema.safeParse(req.body);

      if (!validacion.success) {
        ApiResponseUtils.validationError(res, validacion.error.errors);
        return;
      }

      const data = validacion.data;

      const receta = await prisma.receta.create({
        data: {
          ficha_clinica_id: parseInt(id),
          contenido: data.contenido,
          archivo_pdf_url: data.archivo_pdf_url || null,
        },
      });

      ApiResponseUtils.success(res, receta, 'Receta agregada exitosamente', 201);
    } catch (error: any) {
      console.error('Error al agregar receta:', error);
      ApiResponseUtils.serverError(res, 'Error al agregar receta');
    }
  }

  /**
   * GET /api/fichas/:id/recetas
   * Listar recetas de ficha clínica
   */
  static async listarRecetas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recetas = await prisma.receta.findMany({
        where: {
          ficha_clinica_id: parseInt(id),
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      ApiResponseUtils.success(res, { recetas, total: recetas.length });
    } catch (error: any) {
      console.error('Error al listar recetas:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener recetas');
    }
  }

  /**
   * DELETE /api/fichas/:fichaId/recetas/:recetaId
   * Eliminar receta
   */
  static async eliminarReceta(req: Request, res: Response): Promise<void> {
    try {
      const { fichaId, recetaId } = req.params;

      const receta = await prisma.receta.findUnique({
        where: { id: parseInt(recetaId) },
      });

      if (!receta || receta.ficha_clinica_id !== parseInt(fichaId)) {
        ApiResponseUtils.notFound(res, 'Receta no encontrada');
        return;
      }

      await prisma.receta.delete({
        where: { id: parseInt(recetaId) },
      });

      ApiResponseUtils.success(res, null, 'Receta eliminada exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar receta:', error);
      ApiResponseUtils.serverError(res, 'Error al eliminar receta');
    }
  }

  // ===== EXÁMENES =====

  /**
   * POST /api/fichas/:id/examenes
   * Agregar examen a ficha clínica
   */
  static async agregarExamen(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const ficha = await prisma.fichaClinica.findUnique({
        where: { id: parseInt(id) },
      });

      if (!ficha) {
        ApiResponseUtils.notFound(res, 'Ficha clínica no encontrada');
        return;
      }

      const validacion = examenSchema.safeParse(req.body);

      if (!validacion.success) {
        ApiResponseUtils.validationError(res, validacion.error.errors);
        return;
      }

      const data = validacion.data;

      const examen = await prisma.examen.create({
        data: {
          ficha_clinica_id: parseInt(id),
          paciente_id: data.paciente_id,
          tipo: data.tipo,
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          fecha_realizacion: data.fecha_realizacion ? new Date(data.fecha_realizacion) : null,
          estado: 'SOLICITADO',
          resultado_texto: data.resultado_texto || null,
          resultado_archivo_url: data.resultado_archivo_url || null,
          precio: data.precio || null,
          observaciones: data.observaciones || null,
        },
      });

      ApiResponseUtils.success(res, examen, 'Examen agregado exitosamente', 201);
    } catch (error: any) {
      console.error('Error al agregar examen:', error);
      ApiResponseUtils.serverError(res, 'Error al agregar examen');
    }
  }

  /**
   * GET /api/fichas/:id/examenes
   * Listar exámenes de ficha clínica
   */
  static async listarExamenes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const examenes = await prisma.examen.findMany({
        where: {
          ficha_clinica_id: parseInt(id),
        },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
        orderBy: {
          fecha_solicitud: 'desc',
        },
      });

      ApiResponseUtils.success(res, { examenes, total: examenes.length });
    } catch (error: any) {
      console.error('Error al listar exámenes:', error);
      ApiResponseUtils.serverError(res, 'Error al obtener exámenes');
    }
  }

  /**
   * PATCH /api/fichas/:fichaId/examenes/:examenId
   * Actualizar examen
   */
  static async actualizarExamen(req: Request, res: Response): Promise<void> {
    try {
      const { fichaId, examenId } = req.params;

      const examen = await prisma.examen.findUnique({
        where: { id: parseInt(examenId) },
      });

      if (!examen || examen.ficha_clinica_id !== parseInt(fichaId)) {
        ApiResponseUtils.notFound(res, 'Examen no encontrado');
        return;
      }

      const validacion = examenUpdateSchema.safeParse(req.body);

      if (!validacion.success) {
        ApiResponseUtils.validationError(res, validacion.error.errors);
        return;
      }

      const data = validacion.data;

      const updateData: any = {};

      if (data.estado) updateData.estado = data.estado;
      if (data.fecha_realizacion !== undefined) {
        updateData.fecha_realizacion = data.fecha_realizacion ? new Date(data.fecha_realizacion) : null;
      }
      if (data.resultado_texto !== undefined) updateData.resultado_texto = data.resultado_texto;
      if (data.resultado_archivo_url !== undefined) updateData.resultado_archivo_url = data.resultado_archivo_url;
      if (data.observaciones !== undefined) updateData.observaciones = data.observaciones;

      const examenActualizado = await prisma.examen.update({
        where: { id: parseInt(examenId) },
        data: updateData,
      });

      ApiResponseUtils.success(res, examenActualizado, 'Examen actualizado exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar examen:', error);
      ApiResponseUtils.serverError(res, 'Error al actualizar examen');
    }
  }

  /**
   * DELETE /api/fichas/:fichaId/examenes/:examenId
   * Eliminar examen
   */
  static async eliminarExamen(req: Request, res: Response): Promise<void> {
    try {
      const { fichaId, examenId } = req.params;

      const examen = await prisma.examen.findUnique({
        where: { id: parseInt(examenId) },
      });

      if (!examen || examen.ficha_clinica_id !== parseInt(fichaId)) {
        ApiResponseUtils.notFound(res, 'Examen no encontrado');
        return;
      }

      await prisma.examen.delete({
        where: { id: parseInt(examenId) },
      });

      ApiResponseUtils.success(res, null, 'Examen eliminado exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar examen:', error);
      ApiResponseUtils.serverError(res, 'Error al eliminar examen');
    }
  }
}
