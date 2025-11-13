/**
 * RUTAS DE BOXES / CANILES / PABELLONES
 */

import { Router } from 'express';
import * as BoxesController from '../controllers/boxes.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/boxes - Listar boxes
router.get('/', BoxesController.listar);

// GET /api/boxes/disponibilidad - Verificar disponibilidad
router.get('/disponibilidad', BoxesController.verificarDisponibilidad);

// GET /api/boxes/:id - Obtener box por ID
router.get('/:id', BoxesController.obtener);

// POST /api/boxes - Crear box
router.post('/', BoxesController.crear);

// PUT /api/boxes/:id - Actualizar box
router.put('/:id', BoxesController.actualizar);

export default router;
