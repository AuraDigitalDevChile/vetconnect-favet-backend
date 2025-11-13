/**
 * Controlador de Migración y Carga Masiva
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import csvParserService, { TipoCarga } from '../services/migracion/csv-parser.service';
import validatorService from '../services/migracion/validator.service';
import importerService from '../services/migracion/importer.service';
import fs from 'fs';

// Validación de parámetros
const cargaMasivaSchema = z.object({
  tipo: z.enum(['pacientes', 'tutores', 'servicios', 'examenes', 'procedimientos', 'historias_clinicas']),
  centro_id: z.number().int().positive(),
  usuario_id: z.number().int().positive(),
});

/**
 * POST /api/migracion/carga-masiva
 * Cargar datos desde CSV/Excel
 */
export const cargaMasiva = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    // Validar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionó ningún archivo',
      });
    }

    // Validar parámetros
    const { tipo, centro_id, usuario_id } = cargaMasivaSchema.parse({
      tipo: req.body.tipo,
      centro_id: parseInt(req.body.centro_id),
      usuario_id: parseInt(req.body.usuario_id),
    });

    const filePath = req.file.path;

    console.log(`📥 Iniciando carga masiva de ${tipo}...`);

    // 1. Parsear archivo
    const data = await csvParserService.parseFile(filePath);

    if (data.length === 0) {
      // Eliminar archivo temporal
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        error: 'El archivo está vacío o no contiene datos válidos',
      });
    }

    console.log(`   ✓ ${data.length} filas parseadas`);

    // 2. Validar datos
    const validationResult = await validatorService.validarDatos(data, tipo);

    console.log(
      `   ✓ Validación completada: ${validationResult.validRows.length} válidas, ${validationResult.errors.length} errores`
    );

    // Si hay errores, retornar reporte sin importar
    if (!validationResult.isValid) {
      // Eliminar archivo temporal
      fs.unlinkSync(filePath);

      return res.status(400).json({
        success: false,
        error: 'Se encontraron errores en los datos',
        totalRows: data.length,
        validRows: validationResult.validRows.length,
        invalidRows: validationResult.invalidRows.length,
        errors: validationResult.errors,
      });
    }

    // 3. Importar datos válidos
    const importResult = await importerService.importar(
      validationResult.validRows,
      tipo,
      centro_id,
      usuario_id
    );

    console.log(
      `   ✓ Importación completada: ${importResult.insertedRows} insertados`
    );

    // Eliminar archivo temporal
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Carga masiva completada',
      data: {
        totalRows: data.length,
        validRows: validationResult.validRows.length,
        insertedRows: importResult.insertedRows,
        failedRows: importResult.failedRows,
        errors: importResult.errors,
      },
    });
  } catch (error: any) {
    console.error('Error en carga masiva:', error);

    // Eliminar archivo temporal si existe
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Parámetros inválidos',
        details: error.errors,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Error al procesar carga masiva',
      message: error.message,
    });
  }
};

/**
 * GET /api/migracion/exportar?tipo=pacientes&formato=excel&centro_id=1
 * Exportar datos a CSV o Excel
 */
export const exportar = async (req: Request, res: Response) => {
  try {
    const { tipo, formato = 'excel', centro_id } = req.query;

    if (!tipo) {
      return res.status(400).json({
        success: false,
        error: 'Debe especificar el tipo de datos a exportar',
      });
    }

    const tipoCarga = tipo as TipoCarga;
    const centroId = centro_id ? parseInt(centro_id as string) : undefined;

    console.log(`📤 Exportando ${tipo} en formato ${formato}...`);

    // Obtener datos
    const data = await importerService.exportar(tipoCarga, centroId);

    if (data.length === 0) {
      return res.json({
        success: true,
        message: 'No hay datos para exportar',
        data: [],
      });
    }

    console.log(`   ✓ ${data.length} registros obtenidos`);

    // Generar archivo según formato
    if (formato === 'csv') {
      const csv = csvParserService.exportarCSV(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${tipo}_${Date.now()}.csv"`);
      res.send(csv);
    } else {
      const buffer = csvParserService.exportarExcel(data, tipo as string);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${tipo}_${Date.now()}.xlsx"`);
      res.send(buffer);
    }

    console.log(`   ✓ Archivo generado exitosamente`);
  } catch (error: any) {
    console.error('Error en exportación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al exportar datos',
      message: error.message,
    });
  }
};

/**
 * GET /api/migracion/plantilla?tipo=pacientes
 * Descargar plantilla vacía para carga
 */
export const descargarPlantilla = async (req: Request, res: Response) => {
  try {
    const { tipo } = req.query;

    if (!tipo) {
      return res.status(400).json({
        success: false,
        error: 'Debe especificar el tipo de plantilla',
      });
    }

    const tipoCarga = tipo as TipoCarga;

    // Generar plantilla Excel
    const buffer = csvParserService.generarPlantillaExcel(tipoCarga);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="plantilla_${tipo}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('Error al generar plantilla:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar plantilla',
      message: error.message,
    });
  }
};

/**
 * GET /api/migracion/logs
 * Obtener historial de cargas masivas
 */
export const obtenerLogs = async (_req: Request, res: Response) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const logs = await prisma.auditLog.findMany({
      where: {
        accion: 'CARGA_MASIVA',
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre_completo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    console.error('Error al obtener logs:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener logs',
      message: error.message,
    });
  }
};
