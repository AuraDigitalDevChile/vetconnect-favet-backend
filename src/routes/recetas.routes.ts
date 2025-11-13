/**
 * RUTAS DE RECETAS MÉDICAS
 */

import { Router } from 'express';
import * as RecetasController from '../controllers/recetas.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/recetas - Listar recetas
router.get('/', RecetasController.listar);

// GET /api/recetas/:id - Obtener receta por ID
router.get('/:id', RecetasController.obtener);

// POST /api/recetas - Crear receta
router.post('/', RecetasController.crear);

// PUT /api/recetas/:id - Actualizar receta
router.put('/:id', RecetasController.actualizar);

export default router;
