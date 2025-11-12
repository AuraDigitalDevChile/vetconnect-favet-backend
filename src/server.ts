/**
 * VetConnect FAVET - Backend API REST
 * Servidor Express + TypeScript + Prisma
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Importar rutas
import authRoutes from './routes/auth.routes';
import pacientesRoutes from './routes/pacientes.routes';
import tutoresRoutes from './routes/tutores.routes';
import citasRoutes from './routes/citas.routes';
import fichasRoutes from './routes/fichas.routes';
import hospitalizacionRoutes from './routes/hospitalizacion.routes';
import cirugiasRoutes from './routes/cirugias.routes';
import inventarioRoutes from './routes/inventario.routes';
import facturacionRoutes from './routes/facturacion.routes';

// Middleware de errores
import { errorHandler } from './middleware/error.middleware';
import { notFoundHandler } from './middleware/notFound.middleware';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app: Application = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES GLOBALES
// ==========================================

// Seguridad
app.use(helmet());

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Compresión
app.use(compression());

// Parser de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minuto
  max: parseInt(process.env.RATE_LIMIT_REQUESTS || '100'), // 100 requests por ventana
  message: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ==========================================
// RUTAS
// ==========================================

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'VetConnect FAVET API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/tutores', tutoresRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/fichas-clinicas', fichasRoutes);
app.use('/api/hospitalizacion', hospitalizacionRoutes);
app.use('/api/cirugias', cirugiasRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/facturacion', facturacionRoutes);

// ==========================================
// MANEJO DE ERRORES
// ==========================================

// 404 - Ruta no encontrada
app.use(notFoundHandler);

// Manejador global de errores
app.use(errorHandler);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log(`🏥 VetConnect FAVET Backend API`);
  console.log('🚀 ========================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('🚀 ========================================');
  console.log('');
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
