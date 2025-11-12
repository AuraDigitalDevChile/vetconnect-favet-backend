/**
 * Rutas de Pacientes
 */

import { Router } from 'express';
import { PacientesController } from '../controllers/pacientes.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/pacientes - Listar pacientes con filtros
router.get('/', PacientesController.listar);

// GET /api/pacientes/buscar - Búsqueda avanzada
router.get('/buscar', PacientesController.buscar);

// GET /api/pacientes/:id - Obtener detalle de paciente
router.get('/:id', PacientesController.obtener);

// GET /api/pacientes/:id/historial - Historial médico completo
router.get('/:id/historial', PacientesController.obtenerHistorial);

// POST /api/pacientes - Crear nuevo paciente
router.post('/', PacientesController.crear);

// PUT /api/pacientes/:id - Actualizar paciente
router.put('/:id', PacientesController.actualizar);

// PATCH /api/pacientes/:id/fallecido - Marcar como fallecido
router.patch('/:id/fallecido', PacientesController.marcarFallecido);

// DELETE /api/pacientes/:id - Eliminar paciente (soft delete)
router.delete('/:id', PacientesController.eliminar);

export default router;
