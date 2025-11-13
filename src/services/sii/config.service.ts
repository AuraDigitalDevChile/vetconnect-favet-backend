/**
 * Servicio de configuración para integración con el SII
 * Lee y valida las variables de entorno necesarias
 */

import { SIIConfig } from '../../types/sii.types';

class SIIConfigService {
  private config: SIIConfig | null = null;

  /**
   * Obtiene la configuración del SII desde variables de entorno
   */
  getConfig(): SIIConfig {
    if (this.config) {
      return this.config;
    }

    const mode = (process.env.MODE || 'demo') as 'demo' | 'certificacion' | 'produccion';
    const environment = (process.env.SII_ENVIRONMENT || 'certificacion') as 'certificacion' | 'produccion';

    this.config = {
      mode,
      environment,
      apiUrl: process.env.SII_API_URL || 'https://palena.sii.cl',
      uploadEndpoint: process.env.SII_UPLOAD_ENDPOINT || 'https://palena.sii.cl/cgi_dte/UPL/DTEUpload',
      queryEndpoint: process.env.SII_QUERY_ENDPOINT || 'https://palena.sii.cl/cgi_dte/UPL/DTEQueryStatus',
      rutEmpresa: process.env.SII_RUT_EMPRESA || '76123456-7',
      razonSocial: process.env.SII_RAZON_SOCIAL || 'CLINICA VETERINARIA FAVET DEMO LTDA',
      giro: process.env.SII_GIRO || 'SERVICIOS VETERINARIOS',
      actividadEconomica: process.env.SII_ACTIVIDAD_ECONOMICA || '752000',
      direccion: process.env.SII_DIRECCION || 'Av. Santa Rosa 11735, La Pintana',
      comuna: process.env.SII_COMUNA || 'La Pintana',
      ciudad: process.env.SII_CIUDAD || 'Santiago',
      certPath: process.env.SII_CERT_PATH || '/certs/demo-cert.pfx',
      certPassword: process.env.SII_CERT_PASSWORD || '123456',
      resolucionNumero: process.env.SII_RESOLUCION_NUMERO || '0',
      resolucionFecha: process.env.SII_RESOLUCION_FECHA || '2014-08-22',
    };

    return this.config;
  }

  /**
   * Valida que la configuración esté completa
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const config = this.getConfig();
    const errors: string[] = [];

    if (!config.rutEmpresa) {
      errors.push('SII_RUT_EMPRESA no está configurado');
    }

    if (!config.razonSocial) {
      errors.push('SII_RAZON_SOCIAL no está configurado');
    }

    if (config.mode !== 'demo' && !config.certPath) {
      errors.push('SII_CERT_PATH es requerido cuando MODE no es "demo"');
    }

    if (config.mode !== 'demo' && !config.certPassword) {
      errors.push('SII_CERT_PASSWORD es requerido cuando MODE no es "demo"');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verifica si está en modo demo (no envía al SII real)
   */
  isDemo(): boolean {
    return this.getConfig().mode === 'demo';
  }

  /**
   * Verifica si está en ambiente de certificación
   */
  isCertificacion(): boolean {
    return this.getConfig().environment === 'certificacion';
  }

  /**
   * Obtiene el emisor configurado
   */
  getEmisor() {
    const config = this.getConfig();
    return {
      rut: config.rutEmpresa,
      razonSocial: config.razonSocial,
      giro: config.giro,
      actividadEconomica: config.actividadEconomica,
      direccion: config.direccion,
      comuna: config.comuna,
      ciudad: config.ciudad,
    };
  }
}

export default new SIIConfigService();
