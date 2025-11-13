/**
 * Controlador de Facturación
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponseUtil } from '../utils/api-response.util';
import { generarBoletaHTML, calcularEdad } from '../utils/boleta.utils';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schemas de validación
const itemFacturaSchema = z.object({
  tipo_item: z.string().min(1).max(50),
  descripcion: z.string().min(1).max(500),
  cantidad: z.number().int().positive(),
  precio_unitario: z.number().positive(),
  descuento: z.number().min(0).max(100).default(0),
  subtotal: z.number().positive(),
});

const facturaSchema = z.object({
  centro_id: z.number().int().positive(),
  paciente_id: z.number().int().positive(),
  tutor_id: z.number().int().positive(),
  usuario_id: z.number().int().positive(),
  numero_factura: z.string().min(1).max(50),
  tipo_documento: z.enum(['BOLETA', 'FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO']),
  fecha_vencimiento: z.string().datetime().optional().nullable(),
  subtotal: z.number().positive(),
  descuento: z.number().min(0).default(0),
  iva: z.number().min(0).default(0),
  total: z.number().positive(),
  metodo_pago: z.enum(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'CHEQUE']).optional().nullable(),
  estado: z.enum(['PENDIENTE', 'PAGADA', 'ANULADA', 'VENCIDA']).default('PENDIENTE'),
  observaciones: z.string().optional().nullable(),
  folio_sii: z.string().max(50).optional().nullable(),
  items: z.array(itemFacturaSchema).min(1),
});

const actualizarFacturaSchema = z.object({
  fecha_vencimiento: z.string().datetime().optional().nullable(),
  metodo_pago: z.enum(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'CHEQUE']).optional().nullable(),
  estado: z.enum(['PENDIENTE', 'PAGADA', 'ANULADA', 'VENCIDA']).optional(),
  observaciones: z.string().optional().nullable(),
  folio_sii: z.string().max(50).optional().nullable(),
});

const cambiarEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'PAGADA', 'ANULADA', 'VENCIDA']),
  metodo_pago: z.enum(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'CHEQUE']).optional(),
  fecha_pago: z.string().datetime().optional(),
});

// Schema específico para POS (con paciente y tutor opcionales)
const posVentaSchema = z.object({
  centro_id: z.number().int().positive(),
  paciente_id: z.number().int().positive().optional(),
  tutor_id: z.number().int().positive().optional(),
  usuario_id: z.number().int().positive(),
  numero_factura: z.string().min(1).max(50),
  tipo_documento: z.enum(['BOLETA', 'FACTURA']),
  fecha_vencimiento: z.string().datetime().optional().nullable(),
  subtotal: z.number().positive(),
  descuento: z.number().min(0).default(0),
  iva: z.number().min(0).default(0),
  total: z.number().positive(),
  metodo_pago: z.enum(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA']),
  estado: z.enum(['PENDIENTE', 'PAGADA']).default('PAGADA'),
  observaciones: z.string().optional().nullable(),
  folio_sii: z.string().max(50).optional().nullable(),
  items: z.array(itemFacturaSchema).min(1),
});

export class FacturacionController {
  /**
   * Listar facturas con filtros
   */
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        centro_id,
        paciente_id,
        tutor_id,
        usuario_id,
        estado,
        tipo_documento,
        fecha_desde,
        fecha_hasta,
        numero_factura,
        page = '1',
        limit = '20',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (centro_id) where.centro_id = parseInt(centro_id as string);
      if (paciente_id) where.paciente_id = parseInt(paciente_id as string);
      if (tutor_id) where.tutor_id = parseInt(tutor_id as string);
      if (usuario_id) where.usuario_id = parseInt(usuario_id as string);
      if (estado) where.estado = estado;
      if (tipo_documento) where.tipo_documento = tipo_documento;
      if (numero_factura) where.numero_factura = { contains: numero_factura as string };

      if (fecha_desde && fecha_hasta) {
        where.fecha_emision = {
          gte: new Date(fecha_desde as string),
          lte: new Date(fecha_hasta as string),
        };
      } else if (fecha_desde) {
        where.fecha_emision = { gte: new Date(fecha_desde as string) };
      } else if (fecha_hasta) {
        where.fecha_emision = { lte: new Date(fecha_hasta as string) };
      }

      const [facturas, total] = await Promise.all([
        prisma.factura.findMany({
          where,
          include: {
            centro: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                rut: true,
              },
            },
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
            usuario: {
              select: {
                id: true,
                nombre_completo: true,
                email: true,
              },
            },
            items: {
              select: {
                id: true,
                tipo_item: true,
                descripcion: true,
                cantidad: true,
                precio_unitario: true,
                descuento: true,
                subtotal: true,
              },
            },
          },
          orderBy: { fecha_emision: 'desc' },
          skip,
          take: limitNum,
        }),
        prisma.factura.count({ where }),
      ]);

      res.json(
        ApiResponseUtil.success({
          facturas,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        })
      );
    } catch (error: any) {
      console.error('Error al listar facturas:', error);
      res.status(500).json(ApiResponseUtil.error('Error al listar facturas', error.message));
    }
  }

  /**
   * Obtener detalle de una factura
   */
  static async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const factura = await prisma.factura.findUnique({
        where: { id: parseInt(id) },
        include: {
          centro: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              rut: true,
              direccion: true,
              telefono: true,
              email: true,
            },
          },
          paciente: {
            select: {
              id: true,
              nombre: true,
              especie: true,
              raza: true,
              numero_ficha: true,
              sexo: true,
              fecha_nacimiento: true,
              peso_kg: true,
            },
          },
          tutor: {
            select: {
              id: true,
              nombre_completo: true,
              rut: true,
              direccion: true,
              telefono: true,
              email: true,
            },
          },
          usuario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
              rol: true,
            },
          },
          items: {
            select: {
              id: true,
              tipo_item: true,
              descripcion: true,
              cantidad: true,
              precio_unitario: true,
              descuento: true,
              subtotal: true,
            },
            orderBy: { id: 'asc' },
          },
        },
      });

      if (!factura) {
        res.status(404).json(ApiResponseUtil.error('Factura no encontrada'));
        return;
      }

      res.json(ApiResponseUtil.success(factura));
    } catch (error: any) {
      console.error('Error al obtener factura:', error);
      res.status(500).json(ApiResponseUtil.error('Error al obtener factura', error.message));
    }
  }

  /**
   * Crear nueva factura con items
   */
  static async crear(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = facturaSchema.parse(req.body);

      // Verificar que el número de factura no exista
      const facturaExistente = await prisma.factura.findUnique({
        where: { numero_factura: validatedData.numero_factura },
      });

      if (facturaExistente) {
        res.status(400).json(ApiResponseUtil.error('El número de factura ya existe'));
        return;
      }

      // Verificar que existan las entidades relacionadas
      const [centro, paciente, tutor, usuario] = await Promise.all([
        prisma.centro.findUnique({ where: { id: validatedData.centro_id } }),
        prisma.paciente.findUnique({ where: { id: validatedData.paciente_id } }),
        prisma.tutor.findUnique({ where: { id: validatedData.tutor_id } }),
        prisma.usuario.findUnique({ where: { id: validatedData.usuario_id } }),
      ]);

      if (!centro) {
        res.status(404).json(ApiResponseUtil.error('Centro no encontrado'));
        return;
      }
      if (!paciente) {
        res.status(404).json(ApiResponseUtil.error('Paciente no encontrado'));
        return;
      }
      if (!tutor) {
        res.status(404).json(ApiResponseUtil.error('Tutor no encontrado'));
        return;
      }
      if (!usuario) {
        res.status(404).json(ApiResponseUtil.error('Usuario no encontrado'));
        return;
      }

      // Crear factura con items
      const factura = await prisma.factura.create({
        data: {
          centro_id: validatedData.centro_id,
          paciente_id: validatedData.paciente_id,
          tutor_id: validatedData.tutor_id,
          usuario_id: validatedData.usuario_id,
          numero_factura: validatedData.numero_factura,
          tipo_documento: validatedData.tipo_documento,
          fecha_vencimiento: validatedData.fecha_vencimiento
            ? new Date(validatedData.fecha_vencimiento)
            : null,
          subtotal: validatedData.subtotal,
          descuento: validatedData.descuento,
          iva: validatedData.iva,
          total: validatedData.total,
          metodo_pago: validatedData.metodo_pago || null,
          estado: validatedData.estado,
          observaciones: validatedData.observaciones || null,
          folio_sii: validatedData.folio_sii || null,
          items: {
            create: validatedData.items.map((item) => ({
              tipo_item: item.tipo_item,
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              descuento: item.descuento,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          centro: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              rut: true,
            },
          },
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
          usuario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          items: true,
        },
      });

      res.status(201).json(ApiResponseUtil.success(factura, 'Factura creada exitosamente'));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponseUtil.error('Datos inválidos', error.errors));
        return;
      }
      console.error('Error al crear factura:', error);
      res.status(500).json(ApiResponseUtil.error('Error al crear factura', error.message));
    }
  }

  /**
   * Actualizar factura
   */
  static async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = actualizarFacturaSchema.parse(req.body);

      const facturaExistente = await prisma.factura.findUnique({
        where: { id: parseInt(id) },
      });

      if (!facturaExistente) {
        res.status(404).json(ApiResponseUtil.error('Factura no encontrada'));
        return;
      }

      // No permitir actualizar facturas anuladas
      if (facturaExistente.estado === 'ANULADA') {
        res.status(400).json(ApiResponseUtil.error('No se puede actualizar una factura anulada'));
        return;
      }

      const factura = await prisma.factura.update({
        where: { id: parseInt(id) },
        data: {
          fecha_vencimiento: validatedData.fecha_vencimiento
            ? new Date(validatedData.fecha_vencimiento)
            : undefined,
          metodo_pago: validatedData.metodo_pago,
          estado: validatedData.estado,
          observaciones: validatedData.observaciones,
          folio_sii: validatedData.folio_sii,
          fecha_pago:
            validatedData.estado === 'PAGADA' && !facturaExistente.fecha_pago
              ? new Date()
              : undefined,
        },
        include: {
          centro: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              rut: true,
            },
          },
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
          usuario: {
            select: {
              id: true,
              nombre_completo: true,
              email: true,
            },
          },
          items: true,
        },
      });

      res.json(ApiResponseUtil.success(factura, 'Factura actualizada exitosamente'));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponseUtil.error('Datos inválidos', error.errors));
        return;
      }
      console.error('Error al actualizar factura:', error);
      res.status(500).json(ApiResponseUtil.error('Error al actualizar factura', error.message));
    }
  }

  /**
   * Cambiar estado de factura
   */
  static async cambiarEstado(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = cambiarEstadoSchema.parse(req.body);

      const facturaExistente = await prisma.factura.findUnique({
        where: { id: parseInt(id) },
      });

      if (!facturaExistente) {
        res.status(404).json(ApiResponseUtil.error('Factura no encontrada'));
        return;
      }

      // No permitir cambios en facturas anuladas
      if (facturaExistente.estado === 'ANULADA') {
        res.status(400).json(ApiResponseUtil.error('No se puede modificar una factura anulada'));
        return;
      }

      const updateData: any = {
        estado: validatedData.estado,
      };

      // Si se marca como pagada, registrar fecha y método de pago
      if (validatedData.estado === 'PAGADA') {
        updateData.fecha_pago = validatedData.fecha_pago
          ? new Date(validatedData.fecha_pago)
          : new Date();
        if (validatedData.metodo_pago) {
          updateData.metodo_pago = validatedData.metodo_pago;
        }
      }

      const factura = await prisma.factura.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          centro: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              rut: true,
            },
          },
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
          items: true,
        },
      });

      res.json(ApiResponseUtil.success(factura, `Factura marcada como ${validatedData.estado}`));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponseUtil.error('Datos inválidos', error.errors));
        return;
      }
      console.error('Error al cambiar estado de factura:', error);
      res.status(500).json(ApiResponseUtil.error('Error al cambiar estado de factura', error.message));
    }
  }

  /**
   * Eliminar factura
   */
  static async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const factura = await prisma.factura.findUnique({
        where: { id: parseInt(id) },
      });

      if (!factura) {
        res.status(404).json(ApiResponseUtil.error('Factura no encontrada'));
        return;
      }

      // No permitir eliminar facturas pagadas
      if (factura.estado === 'PAGADA') {
        res.status(400).json(
          ApiResponseUtil.error('No se puede eliminar una factura pagada. Considere anularla.')
        );
        return;
      }

      await prisma.factura.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json(ApiResponseUtil.success(null, 'Factura eliminada exitosamente'));
    } catch (error: any) {
      console.error('Error al eliminar factura:', error);
      res.status(500).json(ApiResponseUtil.error('Error al eliminar factura', error.message));
    }
  }

  /**
   * Generar HTML de boleta/factura
   */
  static async generarBoletaHTML(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const factura = await prisma.factura.findUnique({
        where: { id: parseInt(id) },
        include: {
          centro: true,
          paciente: true,
          tutor: true,
          items: true,
        },
      });

      if (!factura) {
        res.status(404).json(ApiResponseUtil.error('Factura no encontrada'));
        return;
      }

      // Calcular edad del paciente
      const edadPaciente = factura.paciente?.fecha_nacimiento
        ? calcularEdad(factura.paciente.fecha_nacimiento)
        : 'N/A';

      // Preparar datos para la boleta
      const boletaData = {
        centroNombre: factura.centro.nombre,
        centroRut: factura.centro.rut || 'N/A',
        centroDireccion: factura.centro.direccion || 'N/A',
        centroTelefono: factura.centro.telefono || 'N/A',
        tutorNombre: factura.tutor?.nombre_completo || 'N/A',
        tutorDireccion: factura.tutor?.direccion || 'N/A',
        tutorTelefono: factura.tutor?.telefono || 'N/A',
        pacienteNombre: factura.paciente?.nombre || 'N/A',
        pacienteEspecie: factura.paciente?.especie || 'N/A',
        pacienteRaza: factura.paciente?.raza || 'N/A',
        pacienteEdad: edadPaciente,
        pacienteId: factura.paciente?.numero_ficha || 'N/A',
        numeroFactura: factura.numero_factura,
        tipoDocumento: factura.tipo_documento,
        fechaEmision: factura.fecha_emision.toLocaleDateString('es-CL', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        folioSII: factura.folio_sii || undefined,
        items: factura.items.map((item) => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: Number(item.precio_unitario),
          subtotal: Number(item.subtotal),
        })),
        subtotal: Number(factura.subtotal),
        descuento: Number(factura.descuento),
        iva: Number(factura.iva),
        total: Number(factura.total),
        observaciones: factura.observaciones || undefined,
      };

      const html = generarBoletaHTML(boletaData);

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (error: any) {
      console.error('Error al generar boleta HTML:', error);
      res.status(500).json(ApiResponseUtil.error('Error al generar boleta HTML', error.message));
    }
  }

  /**
   * Obtener estadísticas de facturación
   */
  static async estadisticas(req: Request, res: Response): Promise<void> {
    try {
      const { centro_id, fecha_desde, fecha_hasta } = req.query;

      const where: any = {};

      if (centro_id) where.centro_id = parseInt(centro_id as string);

      if (fecha_desde && fecha_hasta) {
        where.fecha_emision = {
          gte: new Date(fecha_desde as string),
          lte: new Date(fecha_hasta as string),
        };
      }

      const [
        totalFacturas,
        totalPagadas,
        totalPendientes,
        totalAnuladas,
        montoTotal,
        montoPagado,
        montoPendiente,
      ] = await Promise.all([
        prisma.factura.count({ where }),
        prisma.factura.count({ where: { ...where, estado: 'PAGADA' } }),
        prisma.factura.count({ where: { ...where, estado: 'PENDIENTE' } }),
        prisma.factura.count({ where: { ...where, estado: 'ANULADA' } }),
        prisma.factura.aggregate({
          where,
          _sum: { total: true },
        }),
        prisma.factura.aggregate({
          where: { ...where, estado: 'PAGADA' },
          _sum: { total: true },
        }),
        prisma.factura.aggregate({
          where: { ...where, estado: 'PENDIENTE' },
          _sum: { total: true },
        }),
      ]);

      const estadisticas = {
        total_facturas: totalFacturas,
        total_pagadas: totalPagadas,
        total_pendientes: totalPendientes,
        total_anuladas: totalAnuladas,
        monto_total: Number(montoTotal._sum.total || 0),
        monto_pagado: Number(montoPagado._sum.total || 0),
        monto_pendiente: Number(montoPendiente._sum.total || 0),
      };

      res.json(ApiResponseUtil.success(estadisticas));
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json(ApiResponseUtil.error('Error al obtener estadísticas', error.message));
    }
  }

  /**
   * Registrar venta desde POS
   * POST /api/facturacion/pos
   */
  static async registrarVentaPOS(req: Request, res: Response): Promise<void> {
    try {
      const datos = posVentaSchema.parse(req.body);

      // Crear factura con items en una transacción
      const factura = await prisma.$transaction(async (tx) => {
        // Construir data object dinámicamente para omitir campos opcionales cuando son undefined
        const facturaData: any = {
          centro: { connect: { id: datos.centro_id } },
          usuario: { connect: { id: datos.usuario_id } },
          numero_factura: datos.numero_factura,
          tipo_documento: datos.tipo_documento,
          fecha_vencimiento: datos.fecha_vencimiento ? new Date(datos.fecha_vencimiento) : null,
          subtotal: datos.subtotal,
          descuento: datos.descuento,
          iva: datos.iva,
          total: datos.total,
          metodo_pago: datos.metodo_pago,
          estado: datos.estado,
        };

        // Solo agregar paciente y tutor si están definidos
        if (datos.paciente_id) {
          facturaData.paciente = { connect: { id: datos.paciente_id } };
        }
        if (datos.tutor_id) {
          facturaData.tutor = { connect: { id: datos.tutor_id } };
        }
        if (datos.observaciones) {
          facturaData.observaciones = datos.observaciones;
        }
        if (datos.folio_sii) {
          facturaData.folio_sii = datos.folio_sii;
        }

        // Crear factura
        const nuevaFactura = await tx.factura.create({
          data: facturaData,
        });

        // Crear items
        await tx.itemFactura.createMany({
          data: datos.items.map((item) => ({
            factura_id: nuevaFactura.id,
            tipo_item: item.tipo_item,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            descuento: item.descuento,
            subtotal: item.subtotal,
          })),
        });

        // Si hay una caja activa y el pago está completo, registrar movimiento
        if (datos.metodo_pago && datos.estado === 'PAGADA') {
          const cajaActiva = await tx.caja.findFirst({
            where: {
              usuario_id: datos.usuario_id,
              cerrada: false,
            },
          });

          if (cajaActiva) {
            // Registrar movimiento en caja
            await tx.movimientoCaja.create({
              data: {
                caja_id: cajaActiva.id,
                tipo: 'INGRESO',
                monto: datos.total,
                concepto: `Venta ${datos.tipo_documento} ${datos.numero_factura}`,
                metodo_pago: datos.metodo_pago,
                observaciones: `Factura ID: ${nuevaFactura.id}`,
              },
            });

            // Actualizar total ingresos de caja
            await tx.caja.update({
              where: { id: cajaActiva.id },
              data: {
                total_ingresos: {
                  increment: datos.total,
                },
              },
            });
          }
        }

        // Descontar inventario si hay items de tipo PRODUCTO o INSUMO
        for (const item of datos.items) {
          if (item.tipo_item === 'PRODUCTO' || item.tipo_item === 'INSUMO') {
            // TODO: Buscar en inventario por descripción o agregar campo inventario_id
            // Por ahora solo registramos, sin descontar automáticamente
          }
        }

        return nuevaFactura;
      });

      // Obtener factura completa con relaciones
      const facturaCompleta = await prisma.factura.findUnique({
        where: { id: factura.id },
        include: {
          paciente: true,
          tutor: true,
          usuario: true,
          items: true,
        },
      });

      res.status(201).json(ApiResponseUtil.success(facturaCompleta, 'Venta registrada exitosamente'));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json(ApiResponseUtil.error('Datos de venta inválidos', error.errors));
        return;
      }

      console.error('Error al registrar venta POS:', error);
      res.status(500).json(ApiResponseUtil.error('Error al registrar venta', error.message));
    }
  }
}
