/**
 * Controlador de Boletas Electrónicas SII
 * Maneja las solicitudes HTTP para generación y consulta de boletas
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import boletaService from '../services/sii/boleta.service';
import integrationService from '../services/sii/integration.service';
import configService from '../services/sii/config.service';
import signatureService from '../services/sii/signature.service';
import { ApiResponseUtil } from '../utils/api-response.util';

/**
 * Schema de validación para generar boleta demo
 */
const generarBoletaDemoSchema = z.object({
  factura_id: z.number().int().positive().optional(),
  centro_id: z.number().int().positive(),
  receptor: z
    .object({
      rut: z.string().optional(),
      razonSocial: z.string().optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        nombre: z.string().min(1).max(300),
        descripcion: z.string().max(500).optional(),
        cantidad: z.number().positive(),
        precioUnitario: z.number().positive(),
        descuentoPct: z.number().min(0).max(100).optional(),
      })
    )
    .min(1)
    .max(60), // Máximo 60 líneas de detalle según SII
  ambiente: z.enum(['certificacion', 'produccion']).optional(),
});

/**
 * POST /api/boleta/demo
 * Genera y envía una boleta electrónica de prueba
 */
export async function generarBoletaDemo(req: Request, res: Response): Promise<Response> {
  try {
    // Validar request
    const validatedData = generarBoletaDemoSchema.parse(req.body);

    // Generar boleta
    const resultado = await boletaService.generarBoletaDemo(validatedData);

    if (!resultado.success) {
      return ApiResponseUtil.error(res, 400, resultado.mensaje, { error: resultado.error });
    }

    return ApiResponseUtil.success(res, 201, resultado.mensaje, resultado.data);
  } catch (error: any) {
    console.error('[BoletaController] Error al generar boleta:', error);

    if (error instanceof z.ZodError) {
      return ApiResponseUtil.error(res, 400, 'Datos de entrada inválidos', {
        errores: error.errors,
      });
    }

    return ApiResponseUtil.error(res, 500, 'Error al generar boleta electrónica', {
      error: error.message,
    });
  }
}

/**
 * GET /api/boleta/status/:trackId
 * Consulta el estado de una boleta en el SII
 */
export async function consultarEstado(req: Request, res: Response): Promise<Response> {
  try {
    const { trackId } = req.params;

    if (!trackId) {
      return ApiResponseUtil.error(res, 400, 'Track ID es requerido');
    }

    const resultado = await boletaService.consultarEstado(trackId);

    if (!resultado.success) {
      return ApiResponseUtil.error(res, 404, resultado.mensaje, { error: resultado.error });
    }

    return ApiResponseUtil.success(res, 200, resultado.mensaje, resultado.data);
  } catch (error: any) {
    console.error('[BoletaController] Error al consultar estado:', error);
    return ApiResponseUtil.error(res, 500, 'Error al consultar estado de boleta', {
      error: error.message,
    });
  }
}

/**
 * GET /api/boleta/config
 * Obtiene la configuración actual del SII
 */
export async function obtenerConfiguracion(_req: Request, res: Response): Promise<Response> {
  try {
    const config = configService.getConfig();
    const validation = configService.validateConfig();

    return ApiResponseUtil.success(res, 200, 'Configuración del SII', {
      mode: config.mode,
      environment: config.environment,
      emisor: {
        rut: config.rutEmpresa,
        razonSocial: config.razonSocial,
        giro: config.giro,
      },
      configuracion_valida: validation.valid,
      errores: validation.errors,
    });
  } catch (error: any) {
    console.error('[BoletaController] Error al obtener configuración:', error);
    return ApiResponseUtil.error(res, 500, 'Error al obtener configuración', {
      error: error.message,
    });
  }
}

/**
 * GET /api/boleta/test-connection
 * Prueba la conexión con el SII
 */
export async function testConexion(_req: Request, res: Response): Promise<Response> {
  try {
    const resultado = await integrationService.testConnection();

    return ApiResponseUtil.success(res, 200, resultado.mensaje, {
      conectado: resultado.success,
      modo: configService.getConfig().mode,
      ambiente: configService.getConfig().environment,
    });
  } catch (error: any) {
    console.error('[BoletaController] Error al probar conexión:', error);
    return ApiResponseUtil.error(res, 500, 'Error al probar conexión con el SII', {
      error: error.message,
    });
  }
}

/**
 * GET /api/boleta/certificate-info
 * Obtiene información del certificado digital
 */
export async function obtenerInfoCertificado(_req: Request, res: Response): Promise<Response> {
  try {
    const info = await signatureService.getCertificateInfo();

    if (!info) {
      return ApiResponseUtil.error(res, 404, 'No se pudo obtener información del certificado');
    }

    return ApiResponseUtil.success(res, 200, 'Información del certificado digital', info);
  } catch (error: any) {
    console.error('[BoletaController] Error al obtener info del certificado:', error);
    return ApiResponseUtil.error(res, 500, 'Error al obtener información del certificado', {
      error: error.message,
    });
  }
}
