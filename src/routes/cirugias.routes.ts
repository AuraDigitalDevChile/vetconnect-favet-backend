/**
 * Rutas de Cirugías
 */

import { Router } from 'express';
import { CirugiasController } from '../controllers/cirugias.controller';

const router = Router();

// Rutas principales de cirugías
router.get('/', CirugiasController.listar);
router.get('/:id', CirugiasController.obtener);
router.post('/', CirugiasController.crear);
router.put('/:id', CirugiasController.actualizar);
router.delete('/:id', CirugiasController.eliminar);

// Cambiar estado
router.patch('/:id/estado', CirugiasController.cambiarEstado);

// Cirugías por paciente
router.get('/paciente/:pacienteId', CirugiasController.cirugiasPorPaciente);

// Signos vitales
router.post('/:id/signos-vitales', CirugiasController.registrarSignosVitales);
router.get('/:id/signos-vitales', CirugiasController.obtenerSignosVitales);
router.delete('/:id/signos-vitales/:signosId', CirugiasController.eliminarSignosVitales);

// Insumos utilizados
router.post('/:id/insumos', CirugiasController.registrarInsumo);
router.get('/:id/insumos', CirugiasController.obtenerInsumos);

export default router;
