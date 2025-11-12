/**
 * Rutas de Fichas Clínicas
 */

import { Router } from 'express';
import { FichasController } from '../controllers/fichas.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas especiales (deben ir antes de /:id para evitar conflictos)
router.get('/paciente/:pacienteId', FichasController.historialPaciente);

// CRUD básico de fichas
router.get('/', FichasController.listar);
router.get('/:id', FichasController.obtener);
router.post('/', FichasController.crear);
router.put('/:id', FichasController.actualizar);
router.delete('/:id', FichasController.eliminar);

// Acciones especiales de fichas
router.patch('/:id/cerrar', FichasController.cerrar);

// Recetas
router.post('/:id/recetas', FichasController.agregarReceta);
router.get('/:id/recetas', FichasController.listarRecetas);
router.delete('/:fichaId/recetas/:recetaId', FichasController.eliminarReceta);

// Exámenes
router.post('/:id/examenes', FichasController.agregarExamen);
router.get('/:id/examenes', FichasController.listarExamenes);
router.patch('/:fichaId/examenes/:examenId', FichasController.actualizarExamen);
router.delete('/:fichaId/examenes/:examenId', FichasController.eliminarExamen);

export default router;
