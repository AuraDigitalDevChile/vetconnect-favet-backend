/**
 * Rutas de Caja
 */

import { Router } from 'express';
import * as cajaController from '../controllers/caja.controller';

const router = Router();

// Rutas principales (DEMO - sin autenticación para rapidez)
router.get('/actual', cajaController.obtenerCajaActiva);
router.get('/', cajaController.listar);
router.post('/abrir', cajaController.abrirCaja);
router.post('/:id/cerrar', cajaController.cerrarCaja);
router.post('/movimiento', cajaController.registrarMovimiento);
router.get('/:id/movimientos', cajaController.obtenerMovimientos);

export default router;
