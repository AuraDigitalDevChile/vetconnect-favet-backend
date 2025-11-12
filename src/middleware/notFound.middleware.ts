/**
 * Middleware para rutas no encontradas (404)
 */

import { Request, Response } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
  });
};
