/**
 * Rutas de Facturación
 */

import { Router } from 'express';
import { FacturacionController } from '../controllers/facturacion.controller';

const router = Router();

// Estadísticas (debe ir antes de /:id para evitar conflictos)
router.get('/estadisticas', FacturacionController.estadisticas);

// Rutas principales de facturas
router.get('/', FacturacionController.listar);
router.get('/:id', FacturacionController.obtener);
router.post('/', FacturacionController.crear);
router.put('/:id', FacturacionController.actualizar);
router.delete('/:id', FacturacionController.eliminar);

// Cambiar estado de factura
router.patch('/:id/estado', FacturacionController.cambiarEstado);

// Generar boleta HTML
router.get('/:id/boleta-html', FacturacionController.generarBoletaHTML);

export default router;
