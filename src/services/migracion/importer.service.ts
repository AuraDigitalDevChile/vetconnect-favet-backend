/**
 * Servicio de Importación de Datos
 */

import { PrismaClient } from '@prisma/client';
import { TipoCarga } from './csv-parser.service';

const prisma = new PrismaClient();

export interface ImportResult {
  success: boolean;
  totalRows: number;
  insertedRows: number;
  failedRows: number;
  errors: string[];
}

class ImporterService {
  /**
   * Importar pacientes
   */
  private async importarPacientes(data: any[], centroId: number): Promise<ImportResult> {
    let insertedRows = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        // Buscar tutor por RUT
        const tutor = await prisma.tutor.findFirst({
          where: { rut: row.tutor_rut },
        });

        if (!tutor) {
          errors.push(`Fila ${row._rowNumber}: Tutor con RUT ${row.tutor_rut} no encontrado`);
          continue;
        }

        await prisma.paciente.create({
          data: {
            centro_id: centroId,
            tutor_id: tutor.id,
            numero_ficha: row.numero_ficha || `P${Date.now()}`,
            nombre: row.nombre,
            especie: row.especie,
            raza: row.raza || null,
            sexo: row.sexo,
            estado_reproductivo: row.estado_reproductivo || null,
            fecha_nacimiento: row.fecha_nacimiento ? new Date(row.fecha_nacimiento) : null,
            peso_kg: row.peso_kg || null,
            chip: row.chip || null,
            color: row.color || null,
            tamanio: row.tamanio || null,
            caracter: row.caracter || null,
            notas: row.notas || null,
            fallecido: false,
            activo: true,
          },
        });

        insertedRows++;
      } catch (error: any) {
        errors.push(`Fila ${row._rowNumber}: ${error.message}`);
      }
    }

    return {
      success: insertedRows > 0,
      totalRows: data.length,
      insertedRows,
      failedRows: data.length - insertedRows,
      errors,
    };
  }

  /**
   * Importar tutores
   */
  private async importarTutores(data: any[], _centroId: number): Promise<ImportResult> {
    let insertedRows = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        await prisma.tutor.create({
          data: {
            rut: row.rut || null,
            nombre_completo: row.nombre_completo,
            telefono: row.telefono || null,
            email: row.email || null,
            direccion: row.direccion || null,
            comuna: row.comuna || null,
            notas: row.notas || null,
            activo: true,
          },
        });

        insertedRows++;
      } catch (error: any) {
        errors.push(`Fila ${row._rowNumber}: ${error.message}`);
      }
    }

    return {
      success: insertedRows > 0,
      totalRows: data.length,
      insertedRows,
      failedRows: data.length - insertedRows,
      errors,
    };
  }

  /**
   * Importar según tipo
   */
  async importar(
    data: any[],
    tipo: TipoCarga,
    centroId: number,
    usuarioId: number
  ): Promise<ImportResult> {
    // Agregar número de fila a cada registro
    const dataWithRowNumbers = data.map((row, index) => ({
      ...row,
      _rowNumber: index + 2,
    }));

    let result: ImportResult;

    switch (tipo) {
      case 'pacientes':
        result = await this.importarPacientes(dataWithRowNumbers, centroId);
        break;

      case 'tutores':
        result = await this.importarTutores(dataWithRowNumbers, centroId);
        break;

      case 'servicios':
      case 'examenes':
      case 'procedimientos':
      case 'historias_clinicas':
        result = {
          success: false,
          totalRows: data.length,
          insertedRows: 0,
          failedRows: data.length,
          errors: ['Tipo de importación no implementado aún'],
        };
        break;

      default:
        result = {
          success: false,
          totalRows: data.length,
          insertedRows: 0,
          failedRows: data.length,
          errors: ['Tipo de importación no válido'],
        };
    }

    // Registrar en auditoría
    try {
      await prisma.auditLog.create({
        data: {
          usuario_id: usuarioId,
          accion: 'CARGA_MASIVA',
          tabla: tipo,
          registro_id: 0,
        },
      });
    } catch (error) {
      console.error('Error al registrar auditoría:', error);
    }

    return result;
  }

  /**
   * Exportar datos según tipo
   */
  async exportar(tipo: TipoCarga, centroId?: number): Promise<any[]> {
    switch (tipo) {
      case 'pacientes':
        return prisma.paciente.findMany({
          where: centroId ? { centro_id: centroId } : undefined,
          include: {
            tutor: {
              select: {
                nombre_completo: true,
                rut: true,
                telefono: true,
                email: true,
              },
            },
            centro: {
              select: {
                nombre: true,
                codigo: true,
              },
            },
          },
        });

      case 'tutores':
        return prisma.tutor.findMany({
          where: undefined,
          select: {
            id: true,
            rut: true,
            nombre_completo: true,
            telefono: true,
            email: true,
            direccion: true,
            comuna: true,
            notas: true,
            activo: true,
            created_at: true,
            updated_at: true,
          },
        });

      case 'servicios':
        // TODO: Implementar cuando exista el modelo Servicio
        return [];

      case 'examenes':
        return prisma.examen.findMany({
          where: centroId
            ? {
                ficha_clinica: {
                  centro_id: centroId,
                },
              }
            : undefined,
          include: {
            ficha_clinica: {
              include: {
                paciente: {
                  select: {
                    numero_ficha: true,
                    nombre: true,
                  },
                },
              },
            },
          },
        });

      case 'procedimientos':
        // TODO: Implementar cuando exista el modelo Procedimiento
        return [];

      case 'historias_clinicas':
        return prisma.fichaClinica.findMany({
          where: centroId ? { centro_id: centroId } : undefined,
          include: {
            paciente: {
              select: {
                numero_ficha: true,
                nombre: true,
                especie: true,
              },
            },
            veterinario: {
              select: {
                nombre_completo: true,
              },
            },
          },
        });

      default:
        return [];
    }
  }
}

export default new ImporterService();
