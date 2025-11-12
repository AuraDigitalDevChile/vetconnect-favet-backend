/**
 * Rutas de Usuarios
 */

import { Router } from 'express';
import { UsuariosController } from '../controllers/usuarios.controller';

const router = Router();

// Rutas de usuarios
router.get('/', UsuariosController.listar);
router.get('/:id', UsuariosController.obtener);

export default router;
