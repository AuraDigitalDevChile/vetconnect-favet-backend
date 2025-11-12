/**
 * Utilidad para respuestas API estandarizadas
 * (Patrón que retorna objetos en lugar de Response)
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

export class ApiResponseUtil {
  /**
   * Respuesta exitosa (retorna objeto)
   */
  static success<T>(data: T, message?: string, meta?: ApiResponse['meta']): ApiResponse<T>;
  /**
   * Respuesta exitosa (envía response)
   */
  static success<T>(res: Response, statusCode: number, message: string, data: T): Response;
  /**
   * Implementación
   */
  static success<T>(
    dataOrRes: T | Response,
    messageOrStatusCode?: string | number,
    metaOrMessage?: ApiResponse['meta'] | string,
    dataIfRes?: T
  ): ApiResponse<T> | Response {
    // Si el primer parámetro es Response (tiene método .json)
    if (typeof (dataOrRes as any).json === 'function') {
      const res = dataOrRes as Response;
      const statusCode = messageOrStatusCode as number;
      const message = metaOrMessage as string;
      const data = dataIfRes as T;

      return res.status(statusCode).json({
        success: true,
        message,
        data,
      });
    }

    // Patrón original que retorna objeto
    return {
      success: true,
      data: dataOrRes as T,
      message: messageOrStatusCode as string,
      meta: metaOrMessage as ApiResponse['meta'],
    };
  }

  /**
   * Respuesta de error (retorna objeto)
   */
  static error(message: string, details?: any): ApiResponse;
  /**
   * Respuesta de error (envía response)
   */
  static error(res: Response, statusCode: number, message: string, details?: any): Response;
  /**
   * Implementación
   */
  static error(
    messageOrRes: string | Response,
    detailsOrStatusCode?: any | number,
    messageIfRes?: string,
    detailsIfRes?: any
  ): ApiResponse | Response {
    // Si el primer parámetro es Response
    if (typeof (messageOrRes as any).json === 'function') {
      const res = messageOrRes as Response;
      const statusCode = detailsOrStatusCode as number;
      const message = messageIfRes as string;
      const details = detailsIfRes;

      return res.status(statusCode).json({
        success: false,
        error: message,
        ...(details && { details }),
      });
    }

    // Patrón original que retorna objeto
    return {
      success: false,
      error: messageOrRes as string,
      ...(detailsOrStatusCode && { data: detailsOrStatusCode }),
    };
  }
}
