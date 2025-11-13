/**
 * Rutas de Hospitalización
 */

import { Router } from 'express';
import { HospitalizacionesController } from '../controllers/hospitalizaciones.controller';

const router = Router();

// Rutas de hospitalización
router.get('/', HospitalizacionesController.listar);
router.get('/:id', HospitalizacionesController.obtener);
router.post('/', HospitalizacionesController.crear);
router.put('/:id', HospitalizacionesController.actualizar);
router.post('/:id/alta', HospitalizacionesController.darAlta);

// Evoluciones
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
router.put('/:hospitalizacionId/tratamientos/:tratamientoId', HospitalizacionesController.actualizarTratamiento);
router.delete('/:hospitalizacionId/tratamientos/:tratamientoId', HospitalizacionesController.eliminarTratamiento);

// Epicrisis
router.post('/:id/epicrisis', HospitalizacionesController.guardarEpicrisis);
router.get('/:id/epicrisis', HospitalizacionesController.obtenerEpicrisis);

// Historial
router.get('/paciente/:pacienteId/historial', HospitalizacionesController.historialPaciente);

export default router;
