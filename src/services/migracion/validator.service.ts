/**
 * Servicio de Validación de Datos de Migración
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { TipoCarga } from './csv-parser.service';

const prisma = new PrismaClient();

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validRows: any[];
  invalidRows: number[];
}

class ValidatorService {
  /**
   * Validar RUT chileno
   */
  private validarRUT(rut: string): boolean {
    if (!rut) return false;

    // Limpiar RUT
    const cleanRut = rut.replace(/[^0-9kK]/g, '');
    if (cleanRut.length < 2) return false;

    const rutBody = cleanRut.slice(0, -1);
    const rutDigit = cleanRut.slice(-1).toUpperCase();

    // Calcular dígito verificador
    let suma = 0;
    let multiplo = 2;

    for (let i = rutBody.length - 1; i >= 0; i--) {
      suma += parseInt(rutBody[i]) * multiplo;
      multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const dvEsperado = 11 - (suma % 11);
    const dv = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : String(dvEsperado);

    return dv === rutDigit;
  }

  /**
   * Validar email
   */
  private validarEmail(email: string): boolean {
    if (!email) return true; // Email es opcional en algunos casos
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar teléfono chileno
   */
  private validarTelefono(telefono: string): boolean {
    if (!telefono) return true; // Teléfono es opcional
    const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
    return telefonoLimpio.length >= 9 && telefonoLimpio.length <= 12;
  }

  /**
   * Validar fecha
   */
  private validarFecha(fecha: string): boolean {
    if (!fecha) return true;
    const fechaDate = new Date(fecha);
    return !isNaN(fechaDate.getTime());
  }

  /**
   * Validar datos de pacientes
   */
  private async validarPaciente(row: any, rowNumber: number): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Campos obligatorios
    if (!row.nombre) {
      errors.push({
        row: rowNumber,
        field: 'nombre',
        message: 'El nombre es obligatorio',
        value: row.nombre,
      });
    }

    if (!row.especie) {
      errors.push({
        row: rowNumber,
        field: 'especie',
        message: 'La especie es obligatoria',
        value: row.especie,
      });
    }

    if (!row.sexo) {
      errors.push({
        row: rowNumber,
        field: 'sexo',
        message: 'El sexo es obligatorio',
        value: row.sexo,
      });
    }

    if (!row.tutor_rut) {
      errors.push({
        row: rowNumber,
        field: 'tutor_rut',
        message: 'El RUT del tutor es obligatorio',
        value: row.tutor_rut,
      });
    } else if (!this.validarRUT(row.tutor_rut)) {
      errors.push({
        row: rowNumber,
        field: 'tutor_rut',
        message: 'RUT del tutor inválido',
        value: row.tutor_rut,
      });
    }

    // Validar número de ficha único
    if (row.numero_ficha) {
      const existente = await prisma.paciente.findFirst({
        where: { numero_ficha: row.numero_ficha },
      });

      if (existente) {
        errors.push({
          row: rowNumber,
          field: 'numero_ficha',
          message: 'El número de ficha ya existe',
          value: row.numero_ficha,
        });
      }
    }

    // Validar fecha de nacimiento
    if (row.fecha_nacimiento && !this.validarFecha(row.fecha_nacimiento)) {
      errors.push({
        row: rowNumber,
        field: 'fecha_nacimiento',
        message: 'Fecha de nacimiento inválida',
        value: row.fecha_nacimiento,
      });
    }

    // Validar peso
    if (row.peso_kg && (isNaN(row.peso_kg) || parseFloat(row.peso_kg) <= 0)) {
      errors.push({
        row: rowNumber,
        field: 'peso_kg',
        message: 'Peso inválido',
        value: row.peso_kg,
      });
    }

    return errors;
  }

  /**
   * Validar datos de tutores
   */
  private async validarTutor(row: any, rowNumber: number): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Debe tener RUT o pasaporte
    if (!row.rut && !row.pasaporte) {
      errors.push({
        row: rowNumber,
        field: 'rut/pasaporte',
        message: 'Debe proporcionar RUT o pasaporte',
        value: null,
      });
    }

    // Validar RUT si existe
    if (row.rut && !this.validarRUT(row.rut)) {
      errors.push({
        row: rowNumber,
        field: 'rut',
        message: 'RUT inválido',
        value: row.rut,
      });
    }

    // Validar RUT único
    if (row.rut) {
      const existente = await prisma.tutor.findFirst({
        where: { rut: row.rut },
      });

      if (existente) {
        errors.push({
          row: rowNumber,
          field: 'rut',
          message: 'El RUT ya está registrado',
          value: row.rut,
        });
      }
    }

    // Validar pasaporte único
    if (row.pasaporte) {
      const existente = await prisma.tutor.findFirst({
        where: { pasaporte: row.pasaporte },
      });

      if (existente) {
        errors.push({
          row: rowNumber,
          field: 'pasaporte',
          message: 'El pasaporte ya está registrado',
          value: row.pasaporte,
        });
      }
    }

    // Nombre completo obligatorio
    if (!row.nombre_completo) {
      errors.push({
        row: rowNumber,
        field: 'nombre_completo',
        message: 'El nombre completo es obligatorio',
        value: row.nombre_completo,
      });
    }

    // Validar email
    if (row.email && !this.validarEmail(row.email)) {
      errors.push({
        row: rowNumber,
        field: 'email',
        message: 'Email inválido',
        value: row.email,
      });
    }

    // Validar teléfono
    if (row.telefono && !this.validarTelefono(row.telefono)) {
      errors.push({
        row: rowNumber,
        field: 'telefono',
        message: 'Teléfono inválido',
        value: row.telefono,
      });
    }

    return errors;
  }

  /**
   * Validar datos según tipo
   */
  async validarDatos(data: any[], tipo: TipoCarga): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const validRows: any[] = [];
    const invalidRows: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y la fila 1 son headers
      let rowErrors: ValidationError[] = [];

      switch (tipo) {
        case 'pacientes':
          rowErrors = await this.validarPaciente(row, rowNumber);
          break;
        case 'tutores':
          rowErrors = await this.validarTutor(row, rowNumber);
          break;
        case 'servicios':
        case 'examenes':
        case 'procedimientos':
        case 'historias_clinicas':
          // TODO: Implementar validaciones específicas
          break;
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        invalidRows.push(rowNumber);
      } else {
        validRows.push(row);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      validRows,
      invalidRows,
    };
  }
}

export default new ValidatorService();
