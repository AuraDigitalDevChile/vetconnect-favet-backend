/**
 * Rutas de Migración y Carga Masiva
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as migracionController from '../controllers/migracion.controller';

const router = Router();

// Configurar multer para upload de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/temp/'); // Carpeta temporal
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'carga-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV o Excel (.xlsx, .xls)'));
    }
  },
});

// Crear carpeta temporal si no existe
import fs from 'fs';
const uploadsDir = 'uploads/temp';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Rutas (DEMO - sin autenticación para rapidez)
router.post('/carga-masiva', upload.single('archivo'), migracionController.cargaMasiva);
router.get('/exportar', migracionController.exportar);
router.get('/plantilla', migracionController.descargarPlantilla);
router.get('/logs', migracionController.obtenerLogs);

export default router;
