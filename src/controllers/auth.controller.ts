/**
 * Controlador de Autenticación
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { AuthUtils } from '../utils/auth.utils';
import { ApiResponseUtils } from '../utils/api-response.utils';
import { AppError } from '../middleware/error.middleware';

// Esquema de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export class AuthController {
  /**
   * POST /api/auth/login
   * Iniciar sesión
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Validar datos
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        ApiResponseUtils.validationError(res, result.error.errors[0].message);
        return;
      }

      const { email, password } = result.data;

      // Buscar usuario
      const usuario = await prisma.usuario.findUnique({
        where: { email },
        include: { centro: true },
      });

      if (!usuario) {
        ApiResponseUtils.unauthorized(res, 'Credenciales inválidas');
        return;
      }

      // Verificar si está activo
      if (!usuario.activo) {
        ApiResponseUtils.forbidden(res, 'Usuario inactivo');
        return;
      }

      // Comparar contraseña
      const isValidPassword = await AuthUtils.comparePassword(password, usuario.password_hash);

      if (!isValidPassword) {
        ApiResponseUtils.unauthorized(res, 'Credenciales inválidas');
        return;
      }

      // Generar token JWT
      const token = AuthUtils.generateToken({
        userId: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        centroId: usuario.centro_id,
      });

      // Actualizar último acceso
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { ultimo_acceso: new Date() },
      });

      // Responder
      ApiResponseUtils.success(
        res,
        {
          token,
          usuario: {
            id: usuario.id,
            nombre_completo: usuario.nombre_completo,
            email: usuario.email,
            rut: usuario.rut,
            rol: usuario.rol,
            centro: {
              id: usuario.centro.id,
              nombre: usuario.centro.nombre,
              codigo: usuario.centro.codigo,
            },
          },
        },
        'Login exitoso'
      );
    } catch (error) {
      console.error('Error en login:', error);
      ApiResponseUtils.serverError(res, 'Error al iniciar sesión');
    }
  }
}
