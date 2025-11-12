/**
 * Middleware de Autenticación y Autorización (Express)
 */

import { Request, Response, NextFunction } from 'express';
import { AuthUtils, JwtPayload } from '../utils/auth.utils';
import { ApiResponseUtils } from '../utils/api-response.utils';
import { RolUsuario } from '@prisma/client';

// Extender el tipo Request de Express para incluir user
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware para verificar autenticación JWT
 */
export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      ApiResponseUtils.unauthorized(res, 'Token no proporcionado');
      return;
    }

    const payload = AuthUtils.verifyToken(token);

    if (!payload) {
      ApiResponseUtils.unauthorized(res, 'Token inválido o expirado');
      return;
    }

    // Agregar usuario al request
    req.user = payload;
    next();
  } catch (error: any) {
    console.error('Error en authMiddleware:', error);
    ApiResponseUtils.unauthorized(res, 'Error de autenticación');
  }
};

/**
 * Middleware para verificar roles específicos
 * Uso: authorize('ADMIN', 'VETERINARIO')
 */
export const authorize = (...allowedRoles: RolUsuario[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        ApiResponseUtils.unauthorized(res, 'Usuario no autenticado');
        return;
      }

      if (!AuthUtils.hasRole(req.user.rol, allowedRoles)) {
        ApiResponseUtils.forbidden(res, 'No tienes permisos para acceder a este recurso');
        return;
      }

      next();
    } catch (error: any) {
      console.error('Error en authorize:', error);
      ApiResponseUtils.forbidden(res, 'Error de autorización');
    }
  };
};

/**
 * Middleware para verificar que el usuario pertenece al centro correcto
 */
export const verifyCentro = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      ApiResponseUtils.unauthorized(res, 'Usuario no autenticado');
      return;
    }

    const centroId = parseInt(req.params.centroId || req.body.centro_id || req.query.centro_id as string);

    if (!centroId) {
      next(); // No hay centroId para verificar, continuar
      return;
    }

    // Admin puede acceder a todos los centros
    if (req.user.rol === 'ADMIN') {
      next();
      return;
    }

    // Verificar que el usuario pertenece al centro
    if (req.user.centroId !== centroId) {
      ApiResponseUtils.forbidden(res, 'No tienes acceso a este centro');
      return;
    }

    next();
  } catch (error: any) {
    console.error('Error en verifyCentro:', error);
    ApiResponseUtils.forbidden(res, 'Error de autorización');
  }
};

export default authMiddleware;
