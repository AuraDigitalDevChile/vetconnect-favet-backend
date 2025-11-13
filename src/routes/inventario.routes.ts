/**
 * Rutas de Inventario
 */

import { Router } from 'express';
import * as inventarioController from '../controllers/inventario.controller';

const router = Router();

// Rutas principales (DEMO - sin autenticación para rapidez)
router.get('/', inventarioController.listar);
router.get('/estadisticas', inventarioController.obtenerEstadisticas);
router.get('/stock-bajo', inventarioController.obtenerStockBajo);
router.get('/buscar-precio', inventarioController.buscarPorPrecio);
router.get('/:id', inventarioController.obtener);
router.get('/:id/movimientos', inventarioController.obtenerMovimientos);
router.post('/', inventarioController.crear);
router.put('/:id', inventarioController.actualizar);
router.delete('/:id', inventarioController.eliminar);
router.post('/movimiento', inventarioController.ajustarStock);

export default router;
