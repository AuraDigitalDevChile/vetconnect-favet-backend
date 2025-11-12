/**
 * Rutas de Citas
 */

import { Router } from 'express';
import { CitasController } from '../controllers/citas.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas especiales (deben ir antes de /:id para evitar conflictos)
router.get('/disponibilidad', CitasController.verificarDisponibilidad);
router.get('/veterinario/:veterinarioId', CitasController.citasPorVeterinario);
router.get('/paciente/:pacienteId', CitasController.citasPorPaciente);

// CRUD básico
router.get('/', CitasController.listar);
router.get('/:id', CitasController.obtener);
router.post('/', CitasController.crear);
router.put('/:id', CitasController.actualizar);
router.delete('/:id', CitasController.cancelar);

// Acciones especiales
router.patch('/:id/confirmar', CitasController.confirmar);
router.patch('/:id/estado', CitasController.cambiarEstado);

export default router;
