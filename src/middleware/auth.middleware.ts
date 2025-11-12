/**
 * Middleware de Autenticación para Express
 */

import { Request, Response, NextFunction } from 'express';
import { AuthUtils, JwtPayload } from '../utils/auth.utils';
import { AppError } from './error.middleware';
import { RolUsuario } from '@prisma/client';

// Extender el tipo Request de Express para incluir user
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Middleware para verificar autenticación
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AppError('Token no proporcionado', 401);
    }

    const payload = AuthUtils.verifyToken(token);

    if (!payload) {
      throw new AppError('Token inválido o expirado', 401);
    }

    // Agregar usuario al request
    req.user = payload;
    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'No autorizado',
      });
    }
  }
};

/**
 * Middleware para verificar roles específicos
 */
export const authorize = (...allowedRoles: RolUsuario[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('Usuario no autenticado', 401);
      }

      if (!AuthUtils.hasRole(req.user.rol, allowedRoles)) {
        throw new AppError('No tienes permisos para acceder a este recurso', 403);
      }

      next();
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(403).json({
          success: false,
          error: 'Acceso prohibido',
        });
      }
    }
  };
};
