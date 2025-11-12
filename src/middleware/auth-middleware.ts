/**
 * Middleware de Autenticación para API Routes
 */

import { NextRequest } from 'next/server';
import { AuthHelper, JwtPayload } from '@/lib/auth';
import { ApiResponseHelper } from '@/lib/api-response';
import { RolUsuario } from '@prisma/client';

export interface AuthenticatedRequest extends NextRequest {
  user?: JwtPayload;
}

/**
 * Middleware para verificar autenticación
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<Response>
): Promise<Response> {
  const authHeader = request.headers.get('authorization');
  const token = AuthHelper.extractTokenFromHeader(authHeader);

  if (!token) {
    return ApiResponseHelper.unauthorized('Token no proporcionado');
  }

  const payload = AuthHelper.verifyToken(token);

  if (!payload) {
    return ApiResponseHelper.unauthorized('Token inválido o expirado');
  }

  // Agregar usuario al request
  const authenticatedRequest = request as AuthenticatedRequest;
  authenticatedRequest.user = payload;

  return handler(authenticatedRequest);
}

/**
 * Middleware para verificar roles específicos
 */
export function withRoles(allowedRoles: RolUsuario[]) {
  return async (
    request: AuthenticatedRequest,
    handler: (req: AuthenticatedRequest) => Promise<Response>
  ): Promise<Response> => {
    if (!request.user) {
      return ApiResponseHelper.unauthorized('Usuario no autenticado');
    }

    if (!AuthHelper.hasRole(request.user.rol, allowedRoles)) {
      return ApiResponseHelper.forbidden('No tienes permisos para acceder a este recurso');
    }

    return handler(request);
  };
}

/**
 * Combinar middlewares de auth y roles
 */
export function withAuthAndRoles(allowedRoles: RolUsuario[]) {
  return async (
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<Response>
  ): Promise<Response> => {
    return withAuth(request, (authenticatedRequest) => {
      return withRoles(allowedRoles)(authenticatedRequest, handler);
    });
  };
}
