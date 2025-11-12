/**
 * Utilidades para respuestas API estandarizadas (Express)
 */

import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export class ApiResponseUtils {
  /**
   * Respuesta exitosa
   */
  static success<T>(res: Response, data: T, message?: string, meta?: ApiResponse['meta']) {
    return res.json({
      success: true,
      data,
      message,
      meta,
    });
  }

  /**
   * Respuesta de error
   */
  static error(res: Response, message: string, statusCode: number = 400) {
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  /**
   * Error de validación
   */
  static validationError(res: Response, message: string) {
    return this.error(res, message, 422);
  }

  /**
   * No autorizado
   */
  static unauthorized(res: Response, message: string = 'No autorizado') {
    return this.error(res, message, 401);
  }

  /**
   * Prohibido
   */
  static forbidden(res: Response, message: string = 'Acceso prohibido') {
    return this.error(res, message, 403);
  }

  /**
   * No encontrado
   */
  static notFound(res: Response, message: string = 'Recurso no encontrado') {
    return this.error(res, message, 404);
  }

  /**
   * Error del servidor
   */
  static serverError(res: Response, message: string = 'Error interno del servidor') {
    return this.error(res, message, 500);
  }

  /**
   * Solicitud inválida
   */
  static badRequest(res: Response, message: string = 'Solicitud inválida') {
    return this.error(res, message, 400);
  }

  /**
   * Creado exitosamente
   */
  static created<T>(res: Response, data: T, message?: string) {
    return res.status(201).json({
      success: true,
      data,
      message: message || 'Creado exitosamente',
    });
  }

  /**
   * Sin contenido (para DELETE exitoso)
   */
  static noContent(res: Response) {
    return res.status(204).send();
  }
}
