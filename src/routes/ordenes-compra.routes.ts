/**
 * Rutas de Órdenes de Compra
 */

import { Router } from 'express';
import * as ordenesCompraController from '../controllers/ordenes-compra.controller';

const router = Router();

// Rutas principales (DEMO - sin autenticación para rapidez)
router.get('/', ordenesCompraController.listar);
router.get('/:id', ordenesCompraController.obtener);
router.post('/', ordenesCompraController.crear);
router.put('/:id/estado', ordenesCompraController.cambiarEstado);
router.post('/:id/recibir', ordenesCompraController.recibirOrden);
router.delete('/:id', ordenesCompraController.eliminar);

export default router;
