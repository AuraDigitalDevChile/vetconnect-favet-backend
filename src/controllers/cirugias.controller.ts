/**
 * Controlador de Cirugías
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponseUtil } from '../utils/api-response.utils';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schemas de validación
const cirugiaSchema = z.object({
  centro_id: z.number().int().positive(),
  paciente_id: z.number().int().positive(),
  tutor_id: z.number().int().positive(),
  cirujano_id: z.number().int().positive(),
  anestesista_id: z.number().int().positive().optional().nullable(),
  asistente_id: z.number().int().positive().optional().nullable(),
  box_id: z.number().int().positive().optional().nullable(),
  procedimiento: z.string().min(1).max(300),
  descripcion: z.string().optional().nullable(),
  fecha: z.string().datetime(),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  duracion_minutos: z.number().int().min(0).optional().nullable(),
  sala: z.string().max(100).optional().nullable(),
  evaluacion_preanestesica: z.string().optional().nullable(),
  preanestesia: z.string().optional().nullable(),
  induccion: z.string().optional().nullable(),
  mantencion: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

const actualizarCirugiaSchema = z.object({
  anestesista_id: z.number().int().positive().optional().nullable(),
  asistente_id: z.number().int().positive().optional().nullable(),
  box_id: z.number().int().positive().optional().nullable(),
  procedimiento: z.string().min(1).max(300).optional(),
  descripcion: z.string().optional().nullable(),
  fecha: z.string().datetime().optional(),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  hora_fin: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  duracion_minutos: z.number().int().min(0).optional().nullable(),
  sala: z.string().max(100).optional().nullable(),
  evaluacion_preanestesica: z.string().optional().nullable(),
  preanestesia: z.string().optional().nullable(),
  induccion: z.string().optional().nullable(),
  mantencion: z.string().optional().nullable(),
  complicaciones: z.string().optional().nullable(),
  reporte_quirurgico: z.string().optional().nullable(),
  reporte_anestesico: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
  archivo_pdf_url: z.string().max(500).optional().nullable(),
});

const cambiarEstadoSchema = z.object({
  estado: z.enum(['PROGRAMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA', 'COMPLICACION']),
  motivo_cancelacion: z.string().optional(),
  complicaciones: z.string().optional(),
});

const signosVitalesSchema = z.object({
  fecha_hora: z.string().datetime().optional(),
  temperatura: z.string().optional().nullable(),
  frecuencia_cardiaca: z.number().int().min(0).max(300).optional().nullable(),
  frecuencia_respiratoria: z.number().int().min(0).max(200).optional().nullable(),
  presion_arterial_sistolica: z.number().int().min(0).max(300).optional().nullable(),
  presion_arterial_diastolica: z.number().int().min(0).max(200).optional().nullable(),
  spo2: z.number().int().min(0).max(100).optional().nullable(),
  peso_kg: z.string().optional().nullable(),
  nivel_conciencia: z.string().max(100).optional().nullable(),
  nivel_dolor: z.number().int().min(0).max(10).optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

const insumoUtilizadoSchema = z.object({
  inventario_id: z.number().int().positive(),
  cantidad: z.number().positive(),
  observaciones: z.string().optional().nullable(),
});

export class CirugiasController {
  /**
   * Listar cirugías con filtros
   */
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        centro_id,
        paciente_id,
        cirujano_id,
        estado,
        fecha_desde,
        fecha_hasta,
        page = '1',
        limit = '10',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (centro_id) where.centro_id = parseInt(centro_id as string);
      if (paciente_id) where.paciente_id = parseInt(paciente_id as string);
      if (cirujano_id) where.cirujano_id = parseInt(cirujano_id as string);
      if (estado) where.estado = estado;

      if (fecha_desde && fecha_hasta) {
        where.fecha = {
          gte: new Date(fecha_desde as string),
          lte: new Date(fecha_hasta as string),
        };
      } else if (fecha_desde) {
        where.fecha = { gte: new Date(fecha_desde as string) };
      } else if (fecha_hasta) {
        where.fecha = { lte: new Date(fecha_hasta as string) };
      }

      const [cirugias, total] = await Promise.all([
        prisma.cirugia.findMany({
          where,
          include: {
            paciente: {
              select: {
                id: true,
                nombre: true,
                especie: true,
                raza: true,
                numero_ficha: true,
                sexo: true,
                peso_kg: true,
              },
            },
            cirujano: {
              select: {
                id: true,
                nombre_completo: true,
                email: true,
              },
            },
            anestesista: {
              select: {
                id: true,
                nombre_completo: true,
                email: true,
              },
            },
            asistente: {
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
            box: {
              select: {
                id: true,
                nombre: true,
                tipo: true,
              },
            },
          },
          orderBy: { fecha: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.cirugia.count({ where }),
      ]);

      res.json(
        ApiResponseUtil.success({
          cirugias,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        })
      );
    } catch (error: any) {
      console.error('Error al listar cirugías:', error);
      res.status(500).json(ApiResponseUtil.error('Error al listar cirugías', error.message));
    }
  }

  /**
   * Obtener detalle de una cirugía
   */
  static async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cirugia = await prisma.cirugia.findUnique({
        where: { id: parseInt(id) },
        include: {
          paciente: {
            select: {
              id: true,
              nombre: true,
              especie: true,
              raza: true,
              numero_ficha: true,
              sexo: true,
              peso_kg: true,
              chip: true,
              tutor: {
                select: {
                  id: true,
                  nombre_completo: true,
                  telefono: true,
                  email: true,
                },
              },
            },
          },
          cirujano: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          anestesista: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          asistente: {
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
          box: {
            select: {
              id: true,
              nombre: true,
              tipo: true,
            },
          },
          signos_vitales: {
            orderBy: { fecha_hora: 'desc' },
          },
          insumos_utilizados: {
            include: {
              inventario: {
                select: {
                  id: true,
                  nombre: true,
                  sku: true,
                  categoria: true,
                },
              },
            },
          },
          examenes: {
            orderBy: { fecha_solicitud: 'desc' },
          },
        },
      });

      if (!cirugia) {
        res.status(404).json(ApiResponseUtil.error('Cirugía no encontrada'));
        return;
      }

      res.json(ApiResponseUtil.success(cirugia));
    } catch (error: any) {
      console.error('Error al obtener cirugía:', error);
      res.status(500).json(ApiResponseUtil.error('Error al obtener cirugía', error.message));
    }
  }

  /**
   * Crear nueva cirugía
   */
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = cirugiaSchema.parse(req.body);

      // Verificar que el paciente existe
      const paciente = await prisma.paciente.findUnique({
        where: { id: validatedData.paciente_id },
      });

      if (!paciente) {
        res.status(404).json(ApiResponseUtil.error('Paciente no encontrado'));
        return;
      }

      // Verificar que el cirujano existe
      const cirujano = await prisma.usuario.findUnique({
        where: { id: validatedData.cirujano_id },
      });

      if (!cirujano) {
        res.status(404).json(ApiResponseUtil.error('Cirujano no encontrado'));
        return;
      }

      const cirugia = await prisma.cirugia.create({
        data: {
          ...validatedData,
          fecha: new Date(validatedData.fecha),
        },
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
          cirujano: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          anestesista: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          asistente: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
        },
      });

      res.status(201).json(ApiResponseUtil.success(cirugia, 'Cirugía creada exitosamente'));
    } catch (error: any) {
      console.error('Error al crear cirugía:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponseUtil.error('Datos inválidos', error.errors));
        return;
      }
      res.status(500).json(ApiResponseUtil.error('Error al crear cirugía', error.message));
    }
  }

  /**
   * Actualizar cirugía
   */
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = actualizarCirugiaSchema.parse(req.body);

      const cirugiaExistente = await prisma.cirugia.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cirugiaExistente) {
        res.status(404).json(ApiResponseUtil.error('Cirugía no encontrada'));
        return;
      }

      const dataToUpdate: any = { ...validatedData };
      if (validatedData.fecha) {
        dataToUpdate.fecha = new Date(validatedData.fecha);
      }

      const cirugia = await prisma.cirugia.update({
        where: { id: parseInt(id) },
        data: dataToUpdate,
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
          cirujano: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          anestesista: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          asistente: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
        },
      });

      res.json(ApiResponseUtil.success(cirugia, 'Cirugía actualizada exitosamente'));
    } catch (error: any) {
      console.error('Error al actualizar cirugía:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponseUtil.error('Datos inválidos', error.errors));
        return;
      }
      res.status(500).json(ApiResponseUtil.error('Error al actualizar cirugía', error.message));
    }
  }

  /**
   * Cambiar estado de cirugía
   */
  static async cambiarEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = cambiarEstadoSchema.parse(req.body);

      const cirugiaExistente = await prisma.cirugia.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cirugiaExistente) {
        res.status(404).json(ApiResponseUtil.error('Cirugía no encontrada'));
        return;
      }

      const updateData: any = { estado: validatedData.estado };

      if (validatedData.estado === 'COMPLICACION' && validatedData.complicaciones) {
        updateData.complicaciones = validatedData.complicaciones;
      }

      const cirugia = await prisma.cirugia.update({
        where: { id: parseInt(id) },
        data: updateData,
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
          cirujano: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
        },
      });

      res.json(ApiResponseUtil.success(cirugia, 'Estado de cirugía actualizado exitosamente'));
    } catch (error: any) {
      console.error('Error al cambiar estado de cirugía:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponseUtil.error('Datos inválidos', error.errors));
        return;
      }
      res.status(500).json(ApiResponseUtil.error('Error al cambiar estado de cirugía', error.message));
    }
  }

  /**
   * Eliminar cirugía
   */
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cirugiaExistente = await prisma.cirugia.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cirugiaExistente) {
        res.status(404).json(ApiResponseUtil.error('Cirugía no encontrada'));
        return;
      }

      await prisma.cirugia.delete({
        where: { id: parseInt(id) },
      });

      res.json(ApiResponseUtil.success(null, 'Cirugía eliminada exitosamente'));
    } catch (error: any) {
      console.error('Error al eliminar cirugía:', error);
      res.status(500).json(ApiResponseUtil.error('Error al eliminar cirugía', error.message));
    }
  }

  /**
   * Obtener cirugías de un paciente
   */
  static async cirugiasPorPaciente(req: Request, res: Response): Promise<void> {
    try {
      const { pacienteId } = req.params;
      const { estado } = req.query;

      const where: any = { paciente_id: parseInt(pacienteId) };
      if (estado) where.estado = estado;

      const cirugias = await prisma.cirugia.findMany({
        where,
        include: {
          cirujano: {
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
        },
        orderBy: { fecha: 'desc' },
      });

      res.json(
        ApiResponseUtil.success({
          cirugias,
          total: cirugias.length,
        })
      );
    } catch (error: any) {
      console.error('Error al obtener cirugías del paciente:', error);
      res.status(500).json(ApiResponseUtil.error('Error al obtener cirugías del paciente', error.message));
    }
  }

  // ===== SIGNOS VITALES =====

  /**
   * Registrar signos vitales durante cirugía
   */
  static async registrarSignosVitales(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = signosVitalesSchema.parse(req.body);

      const cirugiaExistente = await prisma.cirugia.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cirugiaExistente) {
        res.status(404).json(ApiResponseUtil.error('Cirugía no encontrada'));
        return;
      }

      const signosVitales = await prisma.signosVitales.create({
        data: {
          cirugia_id: parseInt(id),
          fecha_hora: validatedData.fecha_hora ? new Date(validatedData.fecha_hora) : new Date(),
          temperatura: validatedData.temperatura,
          frecuencia_cardiaca: validatedData.frecuencia_cardiaca,
          frecuencia_respiratoria: validatedData.frecuencia_respiratoria,
          presion_arterial_sistolica: validatedData.presion_arterial_sistolica,
          presion_arterial_diastolica: validatedData.presion_arterial_diastolica,
          spo2: validatedData.spo2,
          peso_kg: validatedData.peso_kg,
          nivel_conciencia: validatedData.nivel_conciencia,
          nivel_dolor: validatedData.nivel_dolor,
          observaciones: validatedData.observaciones,
        },
      });

      res.status(201).json(ApiResponseUtil.success(signosVitales, 'Signos vitales registrados exitosamente'));
    } catch (error: any) {
      console.error('Error al registrar signos vitales:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponseUtil.error('Datos inválidos', error.errors));
        return;
      }
      res.status(500).json(ApiResponseUtil.error('Error al registrar signos vitales', error.message));
    }
  }

  /**
   * Obtener signos vitales de una cirugía
   */
  static async obtenerSignosVitales(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cirugiaExistente = await prisma.cirugia.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cirugiaExistente) {
        res.status(404).json(ApiResponseUtil.error('Cirugía no encontrada'));
        return;
      }

      const signosVitales = await prisma.signosVitales.findMany({
        where: { cirugia_id: parseInt(id) },
        orderBy: { fecha_hora: 'asc' },
      });

      res.json(ApiResponseUtil.success({ signos_vitales: signosVitales }));
    } catch (error: any) {
      console.error('Error al obtener signos vitales:', error);
      res.status(500).json(ApiResponseUtil.error('Error al obtener signos vitales', error.message));
    }
  }

  /**
   * Eliminar signos vitales
   */
  static async eliminarSignosVitales(req: Request, res: Response): Promise<void> {
    try {
      const { id, signosId } = req.params;

      const signosExistentes = await prisma.signosVitales.findFirst({
        where: {
          id: parseInt(signosId),
          cirugia_id: parseInt(id),
        },
      });

      if (!signosExistentes) {
        res.status(404).json(ApiResponseUtil.error('Signos vitales no encontrados'));
        return;
      }

      await prisma.signosVitales.delete({
        where: { id: parseInt(signosId) },
      });

      res.json(ApiResponseUtil.success(null, 'Signos vitales eliminados exitosamente'));
    } catch (error: any) {
      console.error('Error al eliminar signos vitales:', error);
      res.status(500).json(ApiResponseUtil.error('Error al eliminar signos vitales', error.message));
    }
  }

  // ===== INSUMOS UTILIZADOS =====

  /**
   * Registrar insumo utilizado en cirugía
   */
  static async registrarInsumo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = insumoUtilizadoSchema.parse(req.body);

      const cirugiaExistente = await prisma.cirugia.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cirugiaExistente) {
        res.status(404).json(ApiResponseUtil.error('Cirugía no encontrada'));
        return;
      }

      // Verificar que el insumo existe
      const inventario = await prisma.inventario.findUnique({
        where: { id: validatedData.inventario_id },
      });

      if (!inventario) {
        res.status(404).json(ApiResponseUtil.error('Insumo no encontrado en inventario'));
        return;
      }

      // Verificar stock disponible
      const stockDisponible = parseFloat(inventario.cantidad_disponible.toString());
      if (stockDisponible < validatedData.cantidad) {
        res.status(400).json(ApiResponseUtil.error('Stock insuficiente'));
        return;
      }

      // Registrar insumo utilizado y actualizar inventario
      const [insumoUtilizado] = await prisma.$transaction([
        prisma.insumoUtilizado.create({
          data: {
            cirugia_id: parseInt(id),
            inventario_id: validatedData.inventario_id,
            cantidad: validatedData.cantidad,
            observaciones: validatedData.observaciones,
          },
          include: {
            inventario: {
              select: {
                id: true,
                nombre: true,
                sku: true,
                categoria: true,
              },
            },
          },
        }),
        prisma.inventario.update({
          where: { id: validatedData.inventario_id },
          data: {
            cantidad_disponible: {
              decrement: validatedData.cantidad,
            },
          },
        }),
        prisma.movimientoInventario.create({
          data: {
            inventario_id: validatedData.inventario_id,
            tipo_movimiento: 'SALIDA_CONSUMO',
            cantidad: validatedData.cantidad,
            fecha_movimiento: new Date(),
            origen_destino: `Cirugía #${id}`,
            observaciones: validatedData.observaciones || 'Consumo en cirugía',
          },
        }),
      ]);

      res.status(201).json(ApiResponseUtil.success(insumoUtilizado, 'Insumo registrado exitosamente'));
    } catch (error: any) {
      console.error('Error al registrar insumo:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponseUtil.error('Datos inválidos', error.errors));
        return;
      }
      res.status(500).json(ApiResponseUtil.error('Error al registrar insumo', error.message));
    }
  }

  /**
   * Obtener insumos utilizados en una cirugía
   */
  static async obtenerInsumos(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cirugiaExistente = await prisma.cirugia.findUnique({
        where: { id: parseInt(id) },
      });

      if (!cirugiaExistente) {
        res.status(404).json(ApiResponseUtil.error('Cirugía no encontrada'));
        return;
      }

      const insumos = await prisma.insumoUtilizado.findMany({
        where: { cirugia_id: parseInt(id) },
        include: {
          inventario: {
            select: {
              id: true,
              nombre: true,
              sku: true,
              categoria: true,
              precio_venta: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      res.json(ApiResponseUtil.success({ insumos }));
    } catch (error: any) {
      console.error('Error al obtener insumos:', error);
      res.status(500).json(ApiResponseUtil.error('Error al obtener insumos', error.message));
    }
  }
}
