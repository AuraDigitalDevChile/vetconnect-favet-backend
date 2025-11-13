/**
 * Servicio de integración con la API del SII
 * Envía DTEs firmados y consulta su estado
 */

import axios from 'axios';
import FormData from 'form-data';
import { SIIUploadResponse, SIIQueryResponse } from '../../types/sii.types';
import siiConfigService from './config.service';

class SIIIntegrationService {
  /**
   * Envía un DTE firmado al SII
   */
  async uploadDTE(xmlFirmado: string, rutEmpresa: string): Promise<SIIUploadResponse> {
    const config = siiConfigService.getConfig();

    // En modo demo, simular respuesta exitosa sin enviar al SII
    if (siiConfigService.isDemo()) {
      console.log('[SII] Modo DEMO: Simulando envío al SII');
      return this.simulateUploadResponse();
    }

    try {
      // Preparar formulario multipart
      const formData = new FormData();
      formData.append('rutEmpresa', rutEmpresa.replace(/\./g, '').replace('-', ''));
      formData.append('dvEmpresa', this.extractDV(rutEmpresa));
      formData.append('rutEnvia', rutEmpresa.replace(/\./g, '').replace('-', ''));
      formData.append('dvEnvia', this.extractDV(rutEmpresa));
      formData.append('archivo', Buffer.from(xmlFirmado, 'utf-8'), {
        filename: 'dte.xml',
        contentType: 'text/xml',
      });

      // Enviar al endpoint del SII
      console.log(`[SII] Enviando DTE a: ${config.uploadEndpoint}`);
      const response = await axios.post(config.uploadEndpoint, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 segundos
      });

      // Parsear respuesta del SII
      return this.parseUploadResponse(response.data);
    } catch (error: any) {
      console.error('[SII] Error al enviar DTE:', error.message);

      return {
        success: false,
        estado: 'ERROR',
        mensaje: `Error al enviar al SII: ${error.message}`,
      };
    }
  }

  /**
   * Consulta el estado de un DTE en el SII usando el Track ID
   */
  async queryStatus(trackId: string, rutEmpresa: string): Promise<SIIQueryResponse> {
    const config = siiConfigService.getConfig();

    // En modo demo, simular respuesta
    if (siiConfigService.isDemo()) {
      console.log(`[SII] Modo DEMO: Simulando consulta de estado para Track ID: ${trackId}`);
      return this.simulateQueryResponse(trackId);
    }

    try {
      // Preparar parámetros de consulta
      const params = {
        rutEmpresa: rutEmpresa.replace(/\./g, '').replace('-', ''),
        dvEmpresa: this.extractDV(rutEmpresa),
        trackId: trackId,
      };

      console.log(`[SII] Consultando estado en: ${config.queryEndpoint}`);
      const response = await axios.get(config.queryEndpoint, {
        params,
        timeout: 30000,
      });

      return this.parseQueryResponse(response.data, trackId);
    } catch (error: any) {
      console.error('[SII] Error al consultar estado:', error.message);

      return {
        success: false,
        trackId,
        estado: 'ERROR',
        errores: [
          {
            codigo: 'ERR_CONNECTION',
            descripcion: error.message,
          },
        ],
      };
    }
  }

  /**
   * Extrae el dígito verificador de un RUT
   */
  private extractDV(rut: string): string {
    const parts = rut.split('-');
    return parts.length === 2 ? parts[1] : '';
  }

  /**
   * Simula la respuesta de carga al SII (modo demo)
   */
  private simulateUploadResponse(): SIIUploadResponse {
    const trackId = `DEMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    return {
      success: true,
      trackId,
      estado: 'ACEPTADO',
      mensaje: 'Documento aceptado en modo DEMO (sin envío real al SII)',
    };
  }

  /**
   * Simula la respuesta de consulta de estado (modo demo)
   */
  private simulateQueryResponse(trackId: string): SIIQueryResponse {
    return {
      success: true,
      trackId,
      estado: 'ACEPTADO',
      fechaRecepcion: new Date(),
      fechaProcesamiento: new Date(),
      errores: [],
    };
  }

  /**
   * Parsea la respuesta del SII al enviar un DTE
   */
  private parseUploadResponse(data: any): SIIUploadResponse {
    // La respuesta del SII puede venir en diferentes formatos
    // Aquí se implementa un parser básico

    if (typeof data === 'string') {
      // Respuesta en formato texto
      if (data.includes('TRACKID')) {
        const trackIdMatch = data.match(/TRACKID:\s*(\d+)/);
        const trackId = trackIdMatch ? trackIdMatch[1] : undefined;

        return {
          success: true,
          trackId,
          estado: 'ACEPTADO',
          mensaje: 'DTE enviado exitosamente',
          xml: data,
        };
      }

      if (data.includes('RECHAZADO') || data.includes('ERROR')) {
        return {
          success: false,
          estado: 'RECHAZADO',
          mensaje: 'DTE rechazado por el SII',
          xml: data,
        };
      }
    }

    // Respuesta en formato JSON
    if (data.status === 'OK' || data.estado === 'ACEPTADO') {
      return {
        success: true,
        trackId: data.trackId || data.track_id,
        estado: 'ACEPTADO',
        mensaje: data.mensaje || 'DTE enviado exitosamente',
      };
    }

    // Error o rechazo
    return {
      success: false,
      estado: 'ERROR',
      mensaje: data.mensaje || 'Error desconocido del SII',
      codigoRechazo: data.codigo,
      glosaRechazo: data.glosa,
    };
  }

  /**
   * Parsea la respuesta del SII al consultar estado
   */
  private parseQueryResponse(data: any, trackId: string): SIIQueryResponse {
    if (typeof data === 'string') {
      // Parsear respuesta en formato texto
      if (data.includes('ACEPTADO') || data.includes('OK')) {
        return {
          success: true,
          trackId,
          estado: 'ACEPTADO',
          fechaRecepcion: new Date(),
          errores: [],
        };
      }

      if (data.includes('RECHAZADO')) {
        return {
          success: true,
          trackId,
          estado: 'RECHAZADO',
          errores: [
            {
              codigo: 'ERR_SII',
              descripcion: data,
            },
          ],
        };
      }

      if (data.includes('PROCESANDO')) {
        return {
          success: true,
          trackId,
          estado: 'PROCESANDO',
        };
      }
    }

    // Respuesta JSON
    if (data.estado) {
      return {
        success: true,
        trackId,
        estado: data.estado,
        fechaRecepcion: data.fecha_recepcion ? new Date(data.fecha_recepcion) : undefined,
        fechaProcesamiento: data.fecha_procesamiento ? new Date(data.fecha_procesamiento) : undefined,
        errores: data.errores || [],
      };
    }

    // Error desconocido
    return {
      success: false,
      trackId,
      estado: 'ERROR',
      errores: [
        {
          codigo: 'ERR_PARSE',
          descripcion: 'No se pudo interpretar la respuesta del SII',
        },
      ],
    };
  }

  /**
   * Verifica la conexión con el SII
   */
  async testConnection(): Promise<{ success: boolean; mensaje: string }> {
    const config = siiConfigService.getConfig();

    if (siiConfigService.isDemo()) {
      return {
        success: true,
        mensaje: 'Modo DEMO: Conexión simulada exitosamente',
      };
    }

    try {
      const response = await axios.get(config.apiUrl, {
        timeout: 10000,
        validateStatus: () => true, // Aceptar cualquier código de estado
      });

      return {
        success: response.status === 200 || response.status === 404,
        mensaje: `Respuesta del SII: ${response.status} ${response.statusText}`,
      };
    } catch (error: any) {
      return {
        success: false,
        mensaje: `Error de conexión: ${error.message}`,
      };
    }
  }
}

export default new SIIIntegrationService();
