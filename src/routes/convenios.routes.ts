/**
 * RUTAS DE CONVENIOS
 */

import { Router } from 'express';
import * as ConveniosController from '../controllers/convenios.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/convenios - Listar convenios
router.get('/', ConveniosController.listar);

// GET /api/convenios/:id - Obtener convenio por ID
router.get('/:id', ConveniosController.obtener);

// POST /api/convenios - Crear convenio
router.post('/', ConveniosController.crear);

// PUT /api/convenios/:id - Actualizar convenio
router.put('/:id', ConveniosController.actualizar);

// POST /api/convenios/:id/pacientes - Asignar paciente
router.post('/:id/pacientes', ConveniosController.asignarPaciente);

// DELETE /api/convenios/:id/pacientes/:paciente_id - Remover paciente
router.delete('/:id/pacientes/:paciente_id', ConveniosController.removerPaciente);

export default router;
