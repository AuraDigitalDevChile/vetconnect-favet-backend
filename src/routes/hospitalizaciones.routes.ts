/**
 * Rutas de Hospitalizaciones
 */

import { Router } from 'express';
import { HospitalizacionesController } from '../controllers/hospitalizaciones.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas especiales (deben ir antes de /:id para evitar conflictos)
router.get('/paciente/:pacienteId', HospitalizacionesController.historialPaciente);

// CRUD básico de hospitalizaciones
router.get('/', HospitalizacionesController.listar);
router.get('/:id', HospitalizacionesController.obtener);
router.post('/', HospitalizacionesController.crear);
router.put('/:id', HospitalizacionesController.actualizar);
router.delete('/:id', HospitalizacionesController.eliminar);

// Dar de alta
router.patch('/:id/alta', HospitalizacionesController.darAlta);

// Evoluciones/Controles
router.post('/:id/evoluciones', HospitalizacionesController.agregarEvolucion);
router.get('/:id/evoluciones', HospitalizacionesController.listarEvoluciones);
router.delete('/:hospitalizacionId/evoluciones/:evolucionId', HospitalizacionesController.eliminarEvolucion);

// Signos vitales
router.post('/:id/signos-vitales', HospitalizacionesController.agregarSignosVitales);
router.get('/:id/signos-vitales', HospitalizacionesController.listarSignosVitales);
router.delete('/:hospitalizacionId/signos-vitales/:signosId', HospitalizacionesController.eliminarSignosVitales);

// Tratamientos
router.post('/:id/tratamientos', HospitalizacionesController.agregarTratamiento);
router.get('/:id/tratamientos', HospitalizacionesController.listarTratamientos);
router.patch('/:hospitalizacionId/tratamientos/:tratamientoId', HospitalizacionesController.actualizarTratamiento);
router.delete('/:hospitalizacionId/tratamientos/:tratamientoId', HospitalizacionesController.eliminarTratamiento);

// Epicrisis
router.post('/:id/epicrisis', HospitalizacionesController.guardarEpicrisis);
router.get('/:id/epicrisis', HospitalizacionesController.obtenerEpicrisis);

export default router;
