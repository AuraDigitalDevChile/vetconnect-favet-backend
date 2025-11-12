/**
 * Controlador de Usuarios
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiResponseUtil } from '../utils/api-response.util';

const prisma = new PrismaClient();

export class UsuariosController {
  /**
   * Listar usuarios con filtros
   */
  static async listar(req: Request, res: Response): Promise<void> {
    try {
      const {
        centro_id,
        rol,
        activo,
        page = '1',
        limit = '50',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (centro_id) where.centro_id = parseInt(centro_id as string);
      if (rol) where.rol = rol;
      if (activo !== undefined) where.activo = activo === 'true';

      const [usuarios, total] = await Promise.all([
        prisma.usuario.findMany({
          where,
          select: {
            id: true,
            centro_id: true,
            nombre_completo: true,
            rut: true,
            email: true,
            rol: true,
            telefono: true,
            activo: true,
            created_at: true,
            updated_at: true,
          },
          orderBy: { nombre_completo: 'asc' },
          skip,
          take: limitNum,
        }),
        prisma.usuario.count({ where }),
      ]);

      res.json(
        ApiResponseUtil.success({
          usuarios,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
          },
        })
      );
    } catch (error: any) {
      console.error('Error al listar usuarios:', error);
      res.status(500).json(ApiResponseUtil.error('Error al listar usuarios', error.message));
    }
  }

  /**
   * Obtener detalle de un usuario
   */
  static async obtener(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const usuario = await prisma.usuario.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          centro_id: true,
          nombre_completo: true,
          rut: true,
          email: true,
          rol: true,
          telefono: true,
          activo: true,
          created_at: true,
          updated_at: true,
          centro: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
      });

      if (!usuario) {
        res.status(404).json(ApiResponseUtil.error('Usuario no encontrado'));
        return;
      }

      res.json(ApiResponseUtil.success(usuario));
    } catch (error: any) {
      console.error('Error al obtener usuario:', error);
      res.status(500).json(ApiResponseUtil.error('Error al obtener usuario', error.message));
    }
  }
}
