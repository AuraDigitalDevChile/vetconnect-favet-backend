/**
 * RUTAS DE PRESUPUESTOS
 */

import { Router } from 'express';
import * as PresupuestosController from '../controllers/presupuestos.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/presupuestos - Listar presupuestos
router.get('/', PresupuestosController.listar);

// GET /api/presupuestos/:id - Obtener presupuesto por ID
router.get('/:id', PresupuestosController.obtener);

// POST /api/presupuestos - Crear presupuesto
router.post('/', PresupuestosController.crear);

// PUT /api/presupuestos/:id/estado - Actualizar estado
router.put('/:id/estado', PresupuestosController.actualizarEstado);

export default router;
