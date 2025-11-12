/**
 * Rutas de Tutores/Clientes
 */

import { Router } from 'express';
import { TutoresController } from '../controllers/tutores.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/tutores - Listar tutores con filtros
router.get('/', TutoresController.listar);

// GET /api/tutores/buscar - Búsqueda avanzada
router.get('/buscar', TutoresController.buscar);

// GET /api/tutores/verificar-rut/:rut - Verificar si RUT existe
router.get('/verificar-rut/:rut', TutoresController.verificarRut);

// GET /api/tutores/:id - Obtener detalle de tutor
router.get('/:id', TutoresController.obtener);

// GET /api/tutores/:id/pacientes - Listar pacientes del tutor
router.get('/:id/pacientes', TutoresController.obtenerPacientes);

// POST /api/tutores - Crear nuevo tutor
router.post('/', TutoresController.crear);

// PUT /api/tutores/:id - Actualizar tutor
router.put('/:id', TutoresController.actualizar);

// POST /api/tutores/:id/pacientes/:pacienteId - Asociar paciente a tutor
router.post('/:id/pacientes/:pacienteId', TutoresController.asociarPaciente);

// DELETE /api/tutores/:id - Eliminar tutor (soft delete)
router.delete('/:id', TutoresController.eliminar);

export default router;
