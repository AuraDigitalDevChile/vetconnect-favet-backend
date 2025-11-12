/**
 * Controlador de Hospitalizaciones
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponseUtil } from '../utils/api-response.util';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schemas de validación
const hospitalizacionSchema = z.object({
  centro_id: z.number().int().positive(),
  paciente_id: z.number().int().positive(),
  tutor_id: z.number().int().positive(),
  veterinario_id: z.number().int().positive(),
  box_id: z.number().int().positive().optional().nullable(),
  fecha_ingreso: z.string().datetime().optional(),
  jaula: z.string().max(100).optional().nullable(),
  ubicacion: z.string().max(200).optional().nullable(),
  condicion: z.enum(['LEVE', 'MODERADA', 'GRAVE', 'CRITICA']),
  prediagnostico: z.string().optional().nullable(),
  diagnostico: z.string().optional().nullable(),
  tratamiento_general: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

const actualizarHospitalizacionSchema = z.object({
  box_id: z.number().int().positive().optional().nullable(),
  jaula: z.string().max(100).optional().nullable(),
  ubicacion: z.string().max(200).optional().nullable(),
  condicion: z.enum(['LEVE', 'MODERADA', 'GRAVE', 'CRITICA']).optional(),
  prediagnostico: z.string().optional().nullable(),
  diagnostico: z.string().optional().nullable(),
  tratamiento_general: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

const darAltaSchema = z.object({
  fecha_alta: z.string().datetime().optional(),
  estado: z.enum(['ALTA', 'TRANSFERIDO', 'FALLECIDO']),
  diagnostico: z.string().optional(),
  observaciones: z.string().optional(),
});

const evolucionSchema = z.object({
  usuario: z.string().min(1).max(200),
  descripcion: z.string().min(1),
  fecha_registro: z.string().datetime().optional(),
});

const signosVitalesSchema = z.object({
  temperatura: z.number().min(30).max(45).optional().nullable(),
  frecuencia_cardiaca: z.number().int().min(0).max(300).optional().nullable(),
  frecuencia_respiratoria: z.number().int().min(0).max(200).optional().nullable(),
  presion_arterial_media: z.number().int().min(0).max(250).optional().nullable(),
  spo2: z.number().int().min(0).max(100).optional().nullable(),
  observaciones: z.string().optional().nullable(),
  fecha_registro: z.string().datetime().optional(),
});

const tratamientoSchema = z.object({
  medicamento: z.string().min(1).max(200),
  presentacion: z.string().max(100).optional().nullable(),
  concentracion: z.string().max(100).optional().nullable(),
  dosis: z.string().min(1).max(200),
  via_administracion: z.string().min(1).max(100),
  frecuencia_horas: z.number().int().min(1),
  fecha_inicio: z.string().datetime(),
  fecha_fin: z.string().datetime().optional().nullable(),
  responsable: z.string().max(200).optional().nullable(),
  cobrar: z.boolean().optional(),
  observaciones: z.string().optional().nullable(),
});

const epicrisisSchema = z.object({
  gravedad: z.enum(['LEVE', 'MODERADA', 'GRAVE', 'CRITICA']),
  prediagnosticos: z.string().min(1),
  tratamientos_aplicados: z.string().min(1),
  examenes_recomendados: z.string().optional().nullable(),
  tratamientos_recomendados: z.string().optional().nullable(),
  observaciones_especiales: z.string().optional().nullable(),
  archivo_pdf_url: z.string().max(500).optional().nullable(),
});

export class HospitalizacionesController {
  /**
   * Listar hospitalizaciones con filtros
   */
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        centro_id,
        paciente_id,
        veterinario_id,
        estado,
        fecha_desde,
        fecha_hasta,
        condicion,
        page = '1',
        limit = '50',
      } = req.query;

      const where: any = {};

      if (centro_id) where.centro_id = Number(centro_id);
      if (paciente_id) where.paciente_id = Number(paciente_id);
      if (veterinario_id) where.veterinario_id = Number(veterinario_id);
      if (estado) where.estado = estado as string;
      if (condicion) where.condicion = condicion as string;

      if (fecha_desde || fecha_hasta) {
        where.fecha_ingreso = {};
        if (fecha_desde) where.fecha_ingreso.gte = new Date(fecha_desde as string);
        if (fecha_hasta) where.fecha_ingreso.lte = new Date(fecha_hasta as string);
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const [hospitalizaciones, total] = await Promise.all([
        prisma.hospitalizacion.findMany({
          where,
          include: {
            centro: { select: { id: true, nombre: true } },
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
              },
            },
            box: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
              },
            },
            evoluciones: {
              orderBy: { fecha_registro: 'desc' },
              take: 1,
            },
            signos_vitales: {
              orderBy: { fecha_registro: 'desc' },
              take: 1,
            },
            tratamientos: {
              where: {
                OR: [
                  { fecha_fin: null },
                  { fecha_fin: { gte: new Date() } },
                ],
              },
              orderBy: { fecha_inicio: 'desc' },
            },
          },
          orderBy: [
            { estado: 'asc' }, // ACTIVA primero
            { fecha_ingreso: 'desc' },
          ],
          skip,
          take: limitNum,
        }),
        prisma.hospitalizacion.count({ where }),
      ]);

      // Calcular días hospitalizado para cada hospitalización activa
      const hospitalizacionesConDias = hospitalizaciones.map((hosp) => {
        let dias_hospitalizado = hosp.dias_hospitalizado;
        if (hosp.estado === 'ACTIVA' && hosp.fecha_ingreso) {
          const fechaIngreso = new Date(hosp.fecha_ingreso);
          const hoy = new Date();
          dias_hospitalizado = Math.ceil(
            (hoy.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
          );
        }
        return {
          ...hosp,
          dias_hospitalizado,
        };
      });

      ApiResponseUtil.success(res, 200, 'Hospitalizaciones obtenidas correctamente', {
        hospitalizaciones: hospitalizacionesConDias,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.listar:', error);
      ApiResponseUtil.error(res, 500, 'Error al obtener hospitalizaciones', error.message);
    }
  }

  /**
   * Obtener una hospitalización por ID con todos sus detalles
   */
  static async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const hospitalizacion = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
        include: {
          centro: { select: { id: true, nombre: true } },
          paciente: {
            select: {
              id: true,
              nombre: true,
              especie: true,
              raza: true,
              sexo: true,
              edad_estimada_anios: true,
              peso_kg: true,
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
            },
          },
          box: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
            },
          },
          evoluciones: {
            orderBy: { fecha_registro: 'desc' },
          },
          signos_vitales: {
            orderBy: { fecha_registro: 'desc' },
          },
          tratamientos: {
            include: {
              aplicaciones: {
                orderBy: { fecha_hora_programada: 'desc' },
              },
            },
            orderBy: { fecha_inicio: 'desc' },
          },
          examenes: {
            orderBy: { fecha_solicitud: 'desc' },
          },
          epicrisis: true,
        },
      });

      if (!hospitalizacion) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      // Calcular días hospitalizado
      let dias_hospitalizado = hospitalizacion.dias_hospitalizado;
      if (hospitalizacion.estado === 'ACTIVA' && hospitalizacion.fecha_ingreso) {
        const fechaIngreso = new Date(hospitalizacion.fecha_ingreso);
        const hoy = new Date();
        dias_hospitalizado = Math.ceil(
          (hoy.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      ApiResponseUtil.success(res, 200, 'Hospitalización obtenida correctamente', {
        hospitalizacion: {
          ...hospitalizacion,
          dias_hospitalizado,
        },
      });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.obtener:', error);
      ApiResponseUtil.error(res, 500, 'Error al obtener hospitalización', error.message);
    }
  }

  /**
   * Crear una nueva hospitalización
   */
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = hospitalizacionSchema.parse(req.body);

      // Validar que el paciente existe y obtener su información
      const paciente = await prisma.paciente.findUnique({
        where: { id: validatedData.paciente_id },
        include: { tutor: true },
      });

      if (!paciente) {
        ApiResponseUtil.error(res, 404, 'Paciente no encontrado');
        return;
      }

      // Verificar que el paciente no tenga otra hospitalización activa
      const hospitalizacionActiva = await prisma.hospitalizacion.findFirst({
        where: {
          paciente_id: validatedData.paciente_id,
          estado: 'ACTIVA',
        },
      });

      if (hospitalizacionActiva) {
        ApiResponseUtil.error(
          res,
          400,
          'El paciente ya tiene una hospitalización activa',
          `Hospitalización ID: ${hospitalizacionActiva.id}`
        );
        return;
      }

      // Si se proporciona un box, verificar su disponibilidad
      if (validatedData.box_id) {
        const box = await prisma.box.findUnique({
          where: { id: validatedData.box_id },
        });

        if (!box) {
          ApiResponseUtil.error(res, 404, 'Box no encontrado');
          return;
        }

        // Box availability check removed - field doesn't exist in schema
      }

      const hospitalizacion = await prisma.hospitalizacion.create({
        data: {
          ...validatedData,
          fecha_ingreso: validatedData.fecha_ingreso
            ? new Date(validatedData.fecha_ingreso)
            : new Date(),
        },
        include: {
          centro: { select: { id: true, nombre: true } },
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
            },
          },
          box: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      // Box assignment - availability tracking removed

      ApiResponseUtil.success(res, 201, 'Hospitalización creada exitosamente', {
        hospitalizacion,
      });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.crear:', error);
      if (error instanceof z.ZodError) {
        ApiResponseUtil.error(res, 400, 'Datos inválidos', error.errors);
        return;
      }
      ApiResponseUtil.error(res, 500, 'Error al crear hospitalización', error.message);
    }
  }

  /**
   * Actualizar una hospitalización
   */
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = actualizarHospitalizacionSchema.parse(req.body);

      const hospitalizacionExistente = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
      });

      if (!hospitalizacionExistente) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      if (hospitalizacionExistente.estado !== 'ACTIVA') {
        ApiResponseUtil.error(res, 400, 'No se puede actualizar una hospitalización no activa');
        return;
      }

      // Si se cambia el box, verificar disponibilidad
      if (validatedData.box_id && validatedData.box_id !== hospitalizacionExistente.box_id) {
        const box = await prisma.box.findUnique({
          where: { id: validatedData.box_id },
        });

        if (!box) {
          ApiResponseUtil.error(res, 404, 'Box no encontrado');
          return;
        }

        // Box availability check removed - field doesn't exist in schema

        // Box re-assignment - availability tracking removed
      }

      const hospitalizacion = await prisma.hospitalizacion.update({
        where: { id: Number(id) },
        data: validatedData,
        include: {
          centro: { select: { id: true, nombre: true } },
          paciente: {
            select: {
              id: true,
              nombre: true,
              especie: true,
              raza: true,
            },
          },
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
          box: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      ApiResponseUtil.success(res, 200, 'Hospitalización actualizada exitosamente', {
        hospitalizacion,
      });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.actualizar:', error);
      if (error instanceof z.ZodError) {
        ApiResponseUtil.error(res, 400, 'Datos inválidos', error.errors);
        return;
      }
      ApiResponseUtil.error(res, 500, 'Error al actualizar hospitalización', error.message);
    }
  }

  /**
   * Dar de alta una hospitalización
   */
  static async darAlta(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = darAltaSchema.parse(req.body);

      const hospitalizacionExistente = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
      });

      if (!hospitalizacionExistente) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      if (hospitalizacionExistente.estado !== 'ACTIVA') {
        ApiResponseUtil.error(res, 400, 'La hospitalización ya no está activa');
        return;
      }

      // Calcular días de hospitalización
      const fechaIngreso = new Date(hospitalizacionExistente.fecha_ingreso);
      const fechaAlta = validatedData.fecha_alta ? new Date(validatedData.fecha_alta) : new Date();
      const dias_hospitalizado = Math.ceil(
        (fechaAlta.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24)
      );

      const updateData: any = {
        estado: validatedData.estado,
        fecha_alta: fechaAlta,
        dias_hospitalizado,
      };

      if (validatedData.diagnostico) {
        updateData.diagnostico = validatedData.diagnostico;
      }

      if (validatedData.observaciones) {
        updateData.observaciones = validatedData.observaciones;
      }

      const hospitalizacion = await prisma.hospitalizacion.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          centro: { select: { id: true, nombre: true } },
          paciente: {
            select: {
              id: true,
              nombre: true,
              especie: true,
            },
          },
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
        },
      });

      // Box release - availability tracking removed

      ApiResponseUtil.success(res, 200, 'Hospitalización dada de alta exitosamente', {
        hospitalizacion,
      });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.darAlta:', error);
      if (error instanceof z.ZodError) {
        ApiResponseUtil.error(res, 400, 'Datos inválidos', error.errors);
        return;
      }
      ApiResponseUtil.error(res, 500, 'Error al dar de alta hospitalización', error.message);
    }
  }

  /**
   * Eliminar una hospitalización (solo si no está activa)
   */
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const hospitalizacion = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
      });

      if (!hospitalizacion) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      if (hospitalizacion.estado === 'ACTIVA') {
        ApiResponseUtil.error(
          res,
          400,
          'No se puede eliminar una hospitalización activa. Debe darla de alta primero.'
        );
        return;
      }

      await prisma.hospitalizacion.delete({
        where: { id: Number(id) },
      });

      ApiResponseUtil.success(res, 200, 'Hospitalización eliminada exitosamente');
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.eliminar:', error);
      ApiResponseUtil.error(res, 500, 'Error al eliminar hospitalización', error.message);
    }
  }

  /**
   * Agregar evolución/control
   */
  static async agregarEvolucion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = evolucionSchema.parse(req.body);

      const hospitalizacion = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
      });

      if (!hospitalizacion) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      if (hospitalizacion.estado !== 'ACTIVA') {
        ApiResponseUtil.error(res, 400, 'No se puede agregar evolución a una hospitalización no activa');
        return;
      }

      const evolucion = await prisma.evolucion.create({
        data: {
          hospitalizacion_id: Number(id),
          usuario: validatedData.usuario,
          descripcion: validatedData.descripcion,
          fecha_registro: validatedData.fecha_registro
            ? new Date(validatedData.fecha_registro)
            : new Date(),
        },
      });

      ApiResponseUtil.success(res, 201, 'Evolución agregada exitosamente', { evolucion });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.agregarEvolucion:', error);
      if (error instanceof z.ZodError) {
        ApiResponseUtil.error(res, 400, 'Datos inválidos', error.errors);
        return;
      }
      ApiResponseUtil.error(res, 500, 'Error al agregar evolución', error.message);
    }
  }

  /**
   * Listar evoluciones de una hospitalización
   */
  static async listarEvoluciones(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const hospitalizacion = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
      });

      if (!hospitalizacion) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      const evoluciones = await prisma.evolucion.findMany({
        where: { hospitalizacion_id: Number(id) },
        orderBy: { fecha_registro: 'desc' },
      });

      ApiResponseUtil.success(res, 200, 'Evoluciones obtenidas correctamente', { evoluciones });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.listarEvoluciones:', error);
      ApiResponseUtil.error(res, 500, 'Error al obtener evoluciones', error.message);
    }
  }

  /**
   * Eliminar evolución
   */
  static async eliminarEvolucion(req: Request, res: Response): Promise<void> {
    try {
      const { hospitalizacionId, evolucionId } = req.params;

      const evolucion = await prisma.evolucion.findFirst({
        where: {
          id: Number(evolucionId),
          hospitalizacion_id: Number(hospitalizacionId),
        },
      });

      if (!evolucion) {
        ApiResponseUtil.error(res, 404, 'Evolución no encontrada');
        return;
      }

      await prisma.evolucion.delete({
        where: { id: Number(evolucionId) },
      });

      ApiResponseUtil.success(res, 200, 'Evolución eliminada exitosamente');
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.eliminarEvolucion:', error);
      ApiResponseUtil.error(res, 500, 'Error al eliminar evolución', error.message);
    }
  }

  /**
   * Agregar signos vitales
   */
  static async agregarSignosVitales(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = signosVitalesSchema.parse(req.body);

      const hospitalizacion = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
      });

      if (!hospitalizacion) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      if (hospitalizacion.estado !== 'ACTIVA') {
        ApiResponseUtil.error(
          res,
          400,
          'No se pueden agregar signos vitales a una hospitalización no activa'
        );
        return;
      }

      const signosVitales = await prisma.signosVitales.create({
        data: {
          hospitalizacion_id: Number(id),
          temperatura: validatedData.temperatura,
          frecuencia_cardiaca: validatedData.frecuencia_cardiaca,
          frecuencia_respiratoria: validatedData.frecuencia_respiratoria,
          presion_arterial_media: validatedData.presion_arterial_media,
          spo2: validatedData.spo2,
          observaciones: validatedData.observaciones,
          fecha_registro: validatedData.fecha_registro
            ? new Date(validatedData.fecha_registro)
            : new Date(),
        },
      });

      ApiResponseUtil.success(res, 201, 'Signos vitales agregados exitosamente', { signosVitales });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.agregarSignosVitales:', error);
      if (error instanceof z.ZodError) {
        ApiResponseUtil.error(res, 400, 'Datos inválidos', error.errors);
        return;
      }
      ApiResponseUtil.error(res, 500, 'Error al agregar signos vitales', error.message);
    }
  }

  /**
   * Listar signos vitales de una hospitalización
   */
  static async listarSignosVitales(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const hospitalizacion = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
      });

      if (!hospitalizacion) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      const signosVitales = await prisma.signosVitales.findMany({
        where: { hospitalizacion_id: Number(id) },
        orderBy: { fecha_registro: 'desc' },
      });

      ApiResponseUtil.success(res, 200, 'Signos vitales obtenidos correctamente', { signosVitales });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.listarSignosVitales:', error);
      ApiResponseUtil.error(res, 500, 'Error al obtener signos vitales', error.message);
    }
  }

  /**
   * Eliminar registro de signos vitales
   */
  static async eliminarSignosVitales(req: Request, res: Response): Promise<void> {
    try {
      const { hospitalizacionId, signosId } = req.params;

      const signos = await prisma.signosVitales.findFirst({
        where: {
          id: Number(signosId),
          hospitalizacion_id: Number(hospitalizacionId),
        },
      });

      if (!signos) {
        ApiResponseUtil.error(res, 404, 'Registro de signos vitales no encontrado');
        return;
      }

      await prisma.signosVitales.delete({
        where: { id: Number(signosId) },
      });

      ApiResponseUtil.success(res, 200, 'Registro de signos vitales eliminado exitosamente');
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.eliminarSignosVitales:', error);
      ApiResponseUtil.error(res, 500, 'Error al eliminar signos vitales', error.message);
    }
  }

  /**
   * Agregar tratamiento
   */
  static async agregarTratamiento(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = tratamientoSchema.parse(req.body);

      const hospitalizacion = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
      });

      if (!hospitalizacion) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      if (hospitalizacion.estado !== 'ACTIVA') {
        ApiResponseUtil.error(res, 400, 'No se puede agregar tratamiento a una hospitalización no activa');
        return;
      }

      const tratamiento = await prisma.tratamiento.create({
        data: {
          hospitalizacion_id: Number(id),
          medicamento: validatedData.medicamento,
          presentacion: validatedData.presentacion,
          concentracion: validatedData.concentracion,
          dosis: validatedData.dosis,
          via_administracion: validatedData.via_administracion,
          frecuencia_horas: validatedData.frecuencia_horas,
          fecha_inicio: new Date(validatedData.fecha_inicio),
          fecha_fin: validatedData.fecha_fin ? new Date(validatedData.fecha_fin) : null,
          responsable: validatedData.responsable,
          cobrar: validatedData.cobrar ?? true,
          observaciones: validatedData.observaciones,
        },
      });

      ApiResponseUtil.success(res, 201, 'Tratamiento agregado exitosamente', { tratamiento });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.agregarTratamiento:', error);
      if (error instanceof z.ZodError) {
        ApiResponseUtil.error(res, 400, 'Datos inválidos', error.errors);
        return;
      }
      ApiResponseUtil.error(res, 500, 'Error al agregar tratamiento', error.message);
    }
  }

  /**
   * Listar tratamientos de una hospitalización
   */
  static async listarTratamientos(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { activo } = req.query;

      const hospitalizacion = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
      });

      if (!hospitalizacion) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      const where: any = { hospitalizacion_id: Number(id) };

      // Filtrar solo tratamientos activos si se solicita
      if (activo === 'true') {
        where.OR = [{ fecha_fin: null }, { fecha_fin: { gte: new Date() } }];
      }

      const tratamientos = await prisma.tratamiento.findMany({
        where,
        include: {
          aplicaciones: {
            orderBy: { fecha_hora_programada: 'desc' },
            take: 5,
          },
        },
        orderBy: { fecha_inicio: 'desc' },
      });

      ApiResponseUtil.success(res, 200, 'Tratamientos obtenidos correctamente', { tratamientos });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.listarTratamientos:', error);
      ApiResponseUtil.error(res, 500, 'Error al obtener tratamientos', error.message);
    }
  }

  /**
   * Actualizar tratamiento
   */
  static async actualizarTratamiento(req: Request, res: Response): Promise<void> {
    try {
      const { hospitalizacionId, tratamientoId } = req.params;
      const validatedData = tratamientoSchema.partial().parse(req.body);

      const tratamiento = await prisma.tratamiento.findFirst({
        where: {
          id: Number(tratamientoId),
          hospitalizacion_id: Number(hospitalizacionId),
        },
      });

      if (!tratamiento) {
        ApiResponseUtil.error(res, 404, 'Tratamiento no encontrado');
        return;
      }

      const updateData: any = {};
      if (validatedData.medicamento) updateData.medicamento = validatedData.medicamento;
      if (validatedData.presentacion !== undefined)
        updateData.presentacion = validatedData.presentacion;
      if (validatedData.concentracion !== undefined)
        updateData.concentracion = validatedData.concentracion;
      if (validatedData.dosis) updateData.dosis = validatedData.dosis;
      if (validatedData.via_administracion)
        updateData.via_administracion = validatedData.via_administracion;
      if (validatedData.frecuencia_horas)
        updateData.frecuencia_horas = validatedData.frecuencia_horas;
      if (validatedData.fecha_inicio)
        updateData.fecha_inicio = new Date(validatedData.fecha_inicio);
      if (validatedData.fecha_fin !== undefined)
        updateData.fecha_fin = validatedData.fecha_fin ? new Date(validatedData.fecha_fin) : null;
      if (validatedData.responsable !== undefined)
        updateData.responsable = validatedData.responsable;
      if (validatedData.cobrar !== undefined) updateData.cobrar = validatedData.cobrar;
      if (validatedData.observaciones !== undefined)
        updateData.observaciones = validatedData.observaciones;

      const tratamientoActualizado = await prisma.tratamiento.update({
        where: { id: Number(tratamientoId) },
        data: updateData,
      });

      ApiResponseUtil.success(res, 200, 'Tratamiento actualizado exitosamente', {
        tratamiento: tratamientoActualizado,
      });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.actualizarTratamiento:', error);
      if (error instanceof z.ZodError) {
        ApiResponseUtil.error(res, 400, 'Datos inválidos', error.errors);
        return;
      }
      ApiResponseUtil.error(res, 500, 'Error al actualizar tratamiento', error.message);
    }
  }

  /**
   * Eliminar tratamiento
   */
  static async eliminarTratamiento(req: Request, res: Response): Promise<void> {
    try {
      const { hospitalizacionId, tratamientoId } = req.params;

      const tratamiento = await prisma.tratamiento.findFirst({
        where: {
          id: Number(tratamientoId),
          hospitalizacion_id: Number(hospitalizacionId),
        },
      });

      if (!tratamiento) {
        ApiResponseUtil.error(res, 404, 'Tratamiento no encontrado');
        return;
      }

      await prisma.tratamiento.delete({
        where: { id: Number(tratamientoId) },
      });

      ApiResponseUtil.success(res, 200, 'Tratamiento eliminado exitosamente');
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.eliminarTratamiento:', error);
      ApiResponseUtil.error(res, 500, 'Error al eliminar tratamiento', error.message);
    }
  }

  /**
   * Crear/actualizar epicrisis
   */
  static async guardarEpicrisis(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = epicrisisSchema.parse(req.body);

      const hospitalizacion = await prisma.hospitalizacion.findUnique({
        where: { id: Number(id) },
        include: { epicrisis: true },
      });

      if (!hospitalizacion) {
        ApiResponseUtil.error(res, 404, 'Hospitalización no encontrada');
        return;
      }

      if (hospitalizacion.estado === 'ACTIVA') {
        ApiResponseUtil.error(
          res,
          400,
          'No se puede crear epicrisis de una hospitalización activa. Debe darla de alta primero.'
        );
        return;
      }

      let epicrisis;

      if (hospitalizacion.epicrisis) {
        // Actualizar epicrisis existente
        epicrisis = await prisma.epicrisis.update({
          where: { hospitalizacion_id: Number(id) },
          data: validatedData,
        });
      } else {
        // Crear nueva epicrisis
        epicrisis = await prisma.epicrisis.create({
          data: {
            hospitalizacion_id: Number(id),
            ...validatedData,
          },
        });
      }

      ApiResponseUtil.success(
        res,
        hospitalizacion.epicrisis ? 200 : 201,
        hospitalizacion.epicrisis ? 'Epicrisis actualizada exitosamente' : 'Epicrisis creada exitosamente',
        { epicrisis }
      );
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.guardarEpicrisis:', error);
      if (error instanceof z.ZodError) {
        ApiResponseUtil.error(res, 400, 'Datos inválidos', error.errors);
        return;
      }
      ApiResponseUtil.error(res, 500, 'Error al guardar epicrisis', error.message);
    }
  }

  /**
   * Obtener epicrisis
   */
  static async obtenerEpicrisis(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const epicrisis = await prisma.epicrisis.findUnique({
        where: { hospitalizacion_id: Number(id) },
        include: {
          hospitalizacion: {
            include: {
              paciente: {
                select: {
                  id: true,
                  nombre: true,
                  especie: true,
                  raza: true,
                },
              },
              veterinario: {
                select: {
                  id: true,
                  nombre_completo: true,
                },
              },
            },
          },
        },
      });

      if (!epicrisis) {
        ApiResponseUtil.error(res, 404, 'Epicrisis no encontrada');
        return;
      }

      ApiResponseUtil.success(res, 200, 'Epicrisis obtenida correctamente', { epicrisis });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.obtenerEpicrisis:', error);
      ApiResponseUtil.error(res, 500, 'Error al obtener epicrisis', error.message);
    }
  }

  /**
   * Obtener historial de hospitalizaciones de un paciente
   */
  static async historialPaciente(req: Request, res: Response): Promise<void> {
    try {
      const { pacienteId } = req.params;

      const hospitalizaciones = await prisma.hospitalizacion.findMany({
        where: { paciente_id: Number(pacienteId) },
        include: {
          centro: { select: { id: true, nombre: true } },
          veterinario: {
            select: {
              id: true,
              nombre_completo: true,
            },
          },
          box: {
            select: {
              id: true,
              nombre: true,
            },
          },
          evoluciones: {
            orderBy: { fecha_registro: 'desc' },
            take: 1,
          },
          epicrisis: true,
        },
        orderBy: { fecha_ingreso: 'desc' },
      });

      ApiResponseUtil.success(res, 200, 'Historial de hospitalizaciones obtenido correctamente', {
        hospitalizaciones,
      });
    } catch (error: any) {
      console.error('Error en HospitalizacionesController.historialPaciente:', error);
      ApiResponseUtil.error(res, 500, 'Error al obtener historial de hospitalizaciones', error.message);
    }
  }
}
