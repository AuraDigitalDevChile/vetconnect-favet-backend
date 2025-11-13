/**
 * Servicio de Parseo de CSV/Excel
 */

import * as XLSX from 'xlsx';
import fs from 'fs';
import csv from 'csv-parser';

export type TipoCarga = 'pacientes' | 'tutores' | 'servicios' | 'examenes' | 'procedimientos' | 'historias_clinicas';

export interface ParseResult {
  data: any[];
  errors: string[];
  totalRows: number;
}

class CSVParserService {
  /**
   * Parsear archivo CSV
   */
  async parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error: Error) => reject(error));
    });
  }

  /**
   * Parsear archivo Excel
   */
  parseExcel(filePath: string): any[] {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convertir a JSON
      const data = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Convertir fechas a strings
        defval: null, // Valores por defecto para celdas vacías
      });

      return data;
    } catch (error: any) {
      throw new Error(`Error al parsear Excel: ${error.message}`);
    }
  }

  /**
   * Detectar tipo de archivo y parsear
   */
  async parseFile(filePath: string): Promise<any[]> {
    const extension = filePath.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      return this.parseCSV(filePath);
    } else if (extension === 'xlsx' || extension === 'xls') {
      return this.parseExcel(filePath);
    } else {
      throw new Error('Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)');
    }
  }

  /**
   * Generar plantilla CSV para un tipo de carga
   */
  generarPlantillaCSV(tipo: TipoCarga): string {
    const plantillas = {
      pacientes: [
        'numero_ficha',
        'nombre',
        'especie',
        'raza',
        'sexo',
        'estado_reproductivo',
        'fecha_nacimiento',
        'peso_kg',
        'chip',
        'color',
        'tamanio',
        'caracter',
        'tutor_rut',
        'notas',
      ],
      tutores: [
        'rut',
        'pasaporte',
        'nombre_completo',
        'telefono',
        'telefono_alternativo',
        'email',
        'email_alternativo',
        'direccion',
        'comuna',
        'ciudad',
        'region',
        'ocupacion',
        'notas',
      ],
      servicios: [
        'codigo',
        'nombre',
        'descripcion',
        'categoria',
        'duracion_minutos',
        'precio',
        'activo',
      ],
      examenes: [
        'paciente_ficha',
        'tipo_examen',
        'fecha_solicitud',
        'veterinario',
        'observaciones',
        'resultados',
      ],
      procedimientos: [
        'codigo',
        'nombre',
        'tipo',
        'descripcion',
        'duracion_estimada_minutos',
        'precio_base',
        'requiere_anestesia',
      ],
      historias_clinicas: [
        'paciente_ficha',
        'fecha_atencion',
        'veterinario',
        'motivo_consulta',
        'anamnesis',
        'temperatura',
        'peso_kg',
        'diagnostico',
        'tratamiento',
        'observaciones',
      ],
    };

    const headers = plantillas[tipo] || [];
    return headers.join(',');
  }

  /**
   * Generar archivo Excel plantilla
   */
  generarPlantillaExcel(tipo: TipoCarga): Buffer {
    const csvData = this.generarPlantillaCSV(tipo);
    const headers = csvData.split(',');

    // Crear workbook
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla');

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Exportar datos a Excel
   */
  exportarExcel(data: any[], nombreHoja: string = 'Datos'): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja);

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Exportar datos a CSV
   */
  exportarCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escapar comillas y envolver en comillas si contiene comas
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

export default new CSVParserService();
