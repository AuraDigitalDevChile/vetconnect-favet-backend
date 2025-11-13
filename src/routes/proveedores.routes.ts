/**
 * Rutas de Proveedores
 */

import { Router } from 'express';
import * as proveedoresController from '../controllers/proveedores.controller';

const router = Router();

// Rutas principales (DEMO - sin autenticación para rapidez)
router.get('/', proveedoresController.listar);
router.get('/:id', proveedoresController.obtener);
router.post('/', proveedoresController.crear);
router.put('/:id', proveedoresController.actualizar);
router.delete('/:id', proveedoresController.eliminar);

export default router;
