/**
 * Utilidades de Autenticación JWT
 */

import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { RolUsuario } from '@prisma/client';

const JWT_SECRET: string = process.env.JWT_SECRET || 'tu-secreto-super-seguro-de-al-menos-32-caracteres';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: number;
  email: string;
  rol: RolUsuario;
  centroId: number;
}

export class AuthUtils {
  /**
   * Generar token JWT
   */
  static generateToken(payload: JwtPayload): string {
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  /**
   * Verificar token JWT
   */
  static verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Hashear contraseña
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Comparar contraseña
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Extraer token del header Authorization
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Verificar que el usuario tenga uno de los roles permitidos
   */
  static hasRole(userRole: RolUsuario, allowedRoles: RolUsuario[]): boolean {
    return allowedRoles.includes(userRole);
  }
}
