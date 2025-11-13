/**
 * RUTAS DE TELEMEDICINA
 *
 * Endpoints para gestionar sesiones de teleconsulta
 */

import { Router } from 'express';
import * as TelemedicinController from '../controllers/telemedicina.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ============================================
// CRUD DE SESIONES
// ============================================

// POST /api/telemedicina/create - Crear sesión y generar enlaces
router.post('/create', TelemedicinController.crearSesion);

// GET /api/telemedicina/lista - Listar sesiones con filtros
router.get('/lista', TelemedicinController.listarSesiones);

// GET /api/telemedicina/:id - Obtener sesión por ID
router.get('/:id', TelemedicinController.obtenerSesion);

// GET /api/telemedicina/room/:roomName - Obtener sesión por nombre de sala
router.get('/room/:roomName', TelemedicinController.obtenerSesionPorSala);

// ============================================
// CONTROL DE SESIÓN
// ============================================

// PUT /api/telemedicina/:id/start - Iniciar sesión
router.put('/:id/start', TelemedicinController.iniciarSesion);

// PUT /api/telemedicina/:id/end - Finalizar sesión
router.put('/:id/end', TelemedicinController.finalizarSesion);

// ============================================
// ACCIONES DURANTE LA SESIÓN
// ============================================

// PUT /api/telemedicina/:id/receta - Registrar receta generada
router.put('/:id/receta', TelemedicinController.registrarReceta);

// PUT /api/telemedicina/:id/examen - Registrar examen solicitado
router.put('/:id/examen', TelemedicinController.registrarExamen);

// ============================================
// NOTIFICACIONES
// ============================================

// POST /api/telemedicina/:id/sendLink - Enviar enlace por email/WhatsApp
router.post('/:id/sendLink', TelemedicinController.enviarEnlace);

export default router;
