/**
 * Rutas de Inventario
 */

import { Router } from 'express';
import multer from 'multer';
import * as inventarioController from '../controllers/inventario.controller';

const router = Router();

// Configurar multer para carga de archivos
const upload = multer({ storage: multer.memoryStorage() });

// Rutas principales (DEMO - sin autenticación para rapidez)
router.get('/', inventarioController.listar);
router.get('/estadisticas', inventarioController.obtenerEstadisticas);
router.get('/stock-bajo', inventarioController.obtenerStockBajo);
router.get('/buscar-precio', inventarioController.buscarPorPrecio);
router.get('/descargar-plantilla', inventarioController.descargarPlantilla);
router.get('/:id', inventarioController.obtener);
router.get('/:id/movimientos', inventarioController.obtenerMovimientos);
router.post('/', inventarioController.crear);
router.post('/carga-masiva', upload.single('file'), inventarioController.cargaMasiva);
router.put('/:id', inventarioController.actualizar);
router.delete('/:id', inventarioController.eliminar);
router.post('/movimiento', inventarioController.ajustarStock);

export default router;
