/**
 * Rutas de Reportes
 */

import { Router } from 'express';
import * as reportesController from '../controllers/reportes.controller';

const router = Router();

// Rutas de reportes (DEMO - sin autenticación para rapidez)
router.get('/reservas', reportesController.reporteReservas);
router.get('/servicios-personal', reportesController.reporteServiciosPersonal);
router.get('/libro-ventas', reportesController.libroVentas);
router.get('/movimientos-inventario', reportesController.movimientosInventario);
router.get('/stock-actual', reportesController.stockActual);
router.get('/pacientes-hospital', reportesController.pacientesDiaHospital);

export default router;
