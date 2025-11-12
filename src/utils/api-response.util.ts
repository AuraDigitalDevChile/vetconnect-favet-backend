/**
 * Utilidad para respuestas API estandarizadas
 * (Patrón que retorna objetos en lugar de Response)
 */

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
   * Respuesta exitosa
   */
  static success<T>(data: T, message?: string, meta?: ApiResponse['meta']): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta,
    };
  }

  /**
   * Respuesta de error
   */
  static error(message: string, details?: any): ApiResponse {
    return {
      success: false,
      error: message,
      ...(details && { data: details }),
    };
  }
}
