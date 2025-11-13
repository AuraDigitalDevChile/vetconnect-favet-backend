/**
 * Rutas para el módulo de Boletas Electrónicas SII
 * Define los endpoints REST para gestión de DTEs
 */

import { Router } from 'express';
import {
  generarBoletaDemo,
  consultarEstado,
  obtenerConfiguracion,
  testConexion,
  obtenerInfoCertificado,
} from '../controllers/boleta.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/boleta/demo
 * Genera y envía una boleta electrónica de prueba
 *
 * Body:
 * {
 *   "centro_id": 1,
 *   "factura_id": 123,
 *   "receptor": {
 *     "rut": "12345678-9",
 *     "razonSocial": "Cliente Demo"
 *   },
 *   "items": [
 *     {
 *       "nombre": "Consulta veterinaria",
 *       "descripcion": "Consulta general",
 *       "cantidad": 1,
 *       "precioUnitario": 25000,
 *       "descuentoPct": 10
 *     }
 *   ],
 *   "ambiente": "certificacion"
 * }
 */
router.post('/demo', authenticate, generarBoletaDemo);

/**
 * GET /api/boleta/status/:trackId
 * Consulta el estado de una boleta en el SII
 *
 * Params:
 * - trackId: ID de seguimiento asignado por el SII
 */
router.get('/status/:trackId', authenticate, consultarEstado);

/**
 * GET /api/boleta/config
 * Obtiene la configuración actual del módulo SII
 */
router.get('/config', authenticate, obtenerConfiguracion);

/**
 * GET /api/boleta/test-connection
 * Prueba la conexión con el servidor del SII
 */
router.get('/test-connection', authenticate, testConexion);

/**
 * GET /api/boleta/certificate-info
 * Obtiene información del certificado digital cargado
 */
router.get('/certificate-info', authenticate, obtenerInfoCertificado);

export default router;
