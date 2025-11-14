/**
 * VetConnect FAVET - Backend API REST
 * Servidor Express + TypeScript + Prisma
 */

import express, { Application, Request, Response } from 'express';
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
import usuariosRoutes from './routes/usuarios.routes';
import citasRoutes from './routes/citas.routes';
import fichasRoutes from './routes/fichas.routes';
import hospitalizacionRoutes from './routes/hospitalizacion.routes';
import cirugiasRoutes from './routes/cirugias.routes';
import inventarioRoutes from './routes/inventario.routes';
// import serviciosRoutes from './routes/servicios.routes'; // DISABLED - Schema faltante
import reportesRoutes from './routes/reportes.routes';
import migracionRoutes from './routes/migracion.routes';
import proveedoresRoutes from './routes/proveedores.routes';
import ordenesCompraRoutes from './routes/ordenes-compra.routes';
import cajaRoutes from './routes/caja.routes';
import facturacionRoutes from './routes/facturacion.routes';
import telemedicinRoutes from './routes/telemedicina.routes';
import boletaRoutes from './routes/boleta.routes';
import presupuestosRoutes from './routes/presupuestos.routes';
import examenesRoutes from './routes/examenes.routes';
import recetasRoutes from './routes/recetas.routes';
import conveniosRoutes from './routes/convenios.routes';
import boxesRoutes from './routes/boxes.routes';

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

// CORS - CONFIGURACIÓN DE PRODUCCIÓN
// Obtener origins permitidos desde variable de entorno o usar defaults
const corsOriginEnv = process.env.CORS_ORIGIN || '';
const allowedOrigins = corsOriginEnv
  ? corsOriginEnv.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://localhost:8081',
      'https://vetconnect-favet-demo.pages.dev',
      'https://vetconnect-favet-backend.onrender.com'
    ];

const corsOptions = {
  origin: function (origin: string | undefined, callback: any) {
    // Permitir requests sin origin (como mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
app.get('/health', (_req: Request, res: Response) => {
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
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/fichas-clinicas', fichasRoutes);
app.use('/api/hospitalizacion', hospitalizacionRoutes);
app.use('/api/cirugias', cirugiasRoutes);
app.use('/api/inventario', inventarioRoutes);
// app.use('/api/servicios', serviciosRoutes); // DISABLED
app.use('/api/reportes', reportesRoutes);
app.use('/api/migracion', migracionRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/ordenes-compra', ordenesCompraRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/facturacion', facturacionRoutes);
app.use('/api/telemedicina', telemedicinRoutes);
app.use('/api/boleta', boletaRoutes);
app.use('/api/presupuestos', presupuestosRoutes);
app.use('/api/examenes', examenesRoutes);
app.use('/api/recetas', recetasRoutes);
app.use('/api/convenios', conveniosRoutes);
app.use('/api/boxes', boxesRoutes);

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
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
