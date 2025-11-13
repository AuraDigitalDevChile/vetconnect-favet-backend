/**
 * RUTAS DE EXÁMENES
 */

import { Router } from 'express';
import * as ExamenesController from '../controllers/examenes.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/examenes - Listar exámenes
router.get('/', ExamenesController.listar);

// GET /api/examenes/:id - Obtener examen por ID
router.get('/:id', ExamenesController.obtener);

// POST /api/examenes - Crear solicitud de examen
router.post('/', ExamenesController.crear);

// PUT /api/examenes/:id/resultados - Cargar resultados
router.put('/:id/resultados', ExamenesController.cargarResultados);

// PUT /api/examenes/:id/estado - Actualizar estado
router.put('/:id/estado', ExamenesController.actualizarEstado);

export default router;
