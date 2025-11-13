/**
 * Servicio principal de gestión de boletas electrónicas SII
 * Orquesta la generación, firmado, envío y almacenamiento de DTEs
 */

import { PrismaClient, EstadoBoletaSII } from '@prisma/client';
import { BoletaDemoRequest, BoletaDemoResponse, DTEDocumento, DTEDetalle } from '../../types/sii.types';
import xmlGeneratorService from './xml-generator.service';
import signatureService from './signature.service';
import integrationService from './integration.service';
import configService from './config.service';

const prisma = new PrismaClient();

class BoletaService {
  /**
   * Genera y envía una boleta electrónica de prueba al SII
   */
  async generarBoletaDemo(request: BoletaDemoRequest): Promise<BoletaDemoResponse> {
    try {
      console.log('[Boleta] Iniciando generación de boleta demo');

      // 1. Validar configuración del SII
      const validation = configService.validateConfig();
      if (!validation.valid) {
        return {
          success: false,
          mensaje: 'Configuración del SII inválida',
          error: validation.errors.join(', '),
        };
      }

      // 2. Obtener datos del centro (emisor)
      const centro = await prisma.centro.findUnique({
        where: { id: request.centro_id },
      });

      if (!centro) {
        return {
          success: false,
          mensaje: 'Centro no encontrado',
          error: `No existe centro con ID ${request.centro_id}`,
        };
      }

      // 3. Calcular totales
      const totales = this.calcularTotales(request.items);

      // 4. Construir detalles del DTE
      const detalles: DTEDetalle[] = request.items.map((item, index) => {
        const precioConDescuento = item.precioUnitario * (1 - (item.descuentoPct || 0) / 100);
        const montoItem = precioConDescuento * item.cantidad;

        return {
          numeroLinea: index + 1,
          nombre: item.nombre,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          unidadMedida: 'UN',
          precioUnitario: item.precioUnitario,
          descuentoPct: item.descuentoPct || 0,
          montoItem,
          indicadorExento: false,
        };
      });

      // 5. Construir documento DTE
      const emisor = configService.getEmisor();
      const documento: DTEDocumento = {
        tipo: 39, // Boleta Electrónica
        fechaEmision: new Date(),
        emisor,
        receptor: request.receptor
          ? {
              rut: request.receptor.rut || '66666666-6', // RUT genérico
              razonSocial: request.receptor.razonSocial || 'CLIENTE ANONIMO',
            }
          : undefined,
        detalles,
        totales,
        ambiente: request.ambiente || configService.getConfig().environment,
      };

      // 6. Generar XML
      console.log('[Boleta] Generando XML DTE');
      const xmlGenerado = xmlGeneratorService.generateBoletaXML(documento);

      // 7. Firmar XML
      console.log('[Boleta] Firmando XML');
      const xmlFirmado = await signatureService.signXML(xmlGenerado);

      // 8. Guardar en base de datos (estado BORRADOR)
      const boleta = await prisma.boletaElectronica.create({
        data: {
          factura_id: request.factura_id,
          centro_id: request.centro_id,
          tipo_dte: 39,
          rut_emisor: emisor.rut,
          razon_social_emisor: emisor.razonSocial,
          rut_receptor: documento.receptor?.rut,
          razon_social_receptor: documento.receptor?.razonSocial,
          fecha_emision: documento.fechaEmision,
          monto_neto: totales.montoNeto,
          monto_exento: totales.montoExento,
          monto_iva: totales.iva,
          monto_total: totales.montoTotal,
          xml_generado: xmlGenerado,
          xml_firmado: xmlFirmado,
          estado: EstadoBoletaSII.BORRADOR,
          ambiente: documento.ambiente,
          items: {
            create: detalles.map((detalle) => ({
              numero_linea: detalle.numeroLinea,
              nombre: detalle.nombre,
              descripcion: detalle.descripcion,
              cantidad: detalle.cantidad,
              unidad_medida: detalle.unidadMedida || 'UN',
              precio_unitario: detalle.precioUnitario,
              descuento_pct: detalle.descuentoPct || 0,
              monto_item: detalle.montoItem,
              indicador_exento: detalle.indicadorExento || false,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      console.log(`[Boleta] Boleta creada en BD con ID: ${boleta.id}`);

      // 9. Enviar al SII (si no es modo demo puro)
      let trackId: string | undefined;
      let estado: EstadoBoletaSII = EstadoBoletaSII.BORRADOR;

      if (configService.getConfig().mode === 'certificacion') {
        console.log('[Boleta] Enviando al SII (modo certificación)');
        const uploadResponse = await integrationService.uploadDTE(xmlFirmado, emisor.rut);

        if (uploadResponse.success) {
          trackId = uploadResponse.trackId;
          estado = EstadoBoletaSII.ACEPTADO;
          console.log(`[Boleta] Enviado al SII. Track ID: ${trackId}`);
        } else {
          estado = EstadoBoletaSII.RECHAZADO;
          console.error(`[Boleta] Rechazado por el SII: ${uploadResponse.mensaje}`);
        }

        // Actualizar en BD
        await prisma.boletaElectronica.update({
          where: { id: boleta.id },
          data: {
            track_id: trackId,
            estado,
            fecha_envio_sii: new Date(),
            fecha_respuesta_sii: new Date(),
            respuesta_sii: JSON.stringify(uploadResponse),
            codigo_rechazo: uploadResponse.codigoRechazo,
            glosa_rechazo: uploadResponse.glosaRechazo,
          },
        });
      } else {
        // Modo demo: simular track ID
        trackId = `DEMO-${Date.now()}`;
        await prisma.boletaElectronica.update({
          where: { id: boleta.id },
          data: {
            track_id: trackId,
            estado: EstadoBoletaSII.BORRADOR,
          },
        });
      }

      // 10. Retornar respuesta
      return {
        success: true,
        mensaje: configService.isDemo()
          ? 'Boleta generada en modo DEMO (no enviada al SII real)'
          : 'Boleta generada y enviada al SII exitosamente',
        data: {
          boleta_id: boleta.id,
          folio: boleta.folio || undefined,
          track_id: trackId,
          estado: estado,
          monto_total: parseFloat(boleta.monto_total.toString()),
          xml_generado: configService.isDemo() ? xmlGenerado : undefined,
          xml_firmado: configService.isDemo() ? xmlFirmado : undefined,
          fecha_emision: boleta.fecha_emision,
          ambiente: boleta.ambiente,
        },
      };
    } catch (error: any) {
      console.error('[Boleta] Error al generar boleta:', error);
      return {
        success: false,
        mensaje: 'Error al generar boleta',
        error: error.message,
      };
    }
  }

  /**
   * Consulta el estado de una boleta en el SII
   */
  async consultarEstado(trackId: string): Promise<{
    success: boolean;
    mensaje: string;
    data?: any;
    error?: string;
  }> {
    try {
      // Buscar boleta en BD
      const boleta = await prisma.boletaElectronica.findUnique({
        where: { track_id: trackId },
        include: { items: true },
      });

      if (!boleta) {
        return {
          success: false,
          mensaje: 'Boleta no encontrada',
          error: `No existe boleta con Track ID: ${trackId}`,
        };
      }

      // Si está en modo demo, retornar estado de BD
      if (configService.isDemo()) {
        return {
          success: true,
          mensaje: 'Estado de boleta en modo DEMO',
          data: {
            boleta_id: boleta.id,
            track_id: trackId,
            estado: boleta.estado,
            fecha_emision: boleta.fecha_emision,
            monto_total: parseFloat(boleta.monto_total.toString()),
            ambiente: boleta.ambiente,
          },
        };
      }

      // Consultar en el SII
      console.log(`[Boleta] Consultando estado en SII para Track ID: ${trackId}`);
      const queryResponse = await integrationService.queryStatus(trackId, boleta.rut_emisor);

      // Actualizar estado en BD si cambió
      let nuevoEstado = boleta.estado;

      if (queryResponse.estado === 'ACEPTADO') {
        nuevoEstado = EstadoBoletaSII.ACEPTADO;
      } else if (queryResponse.estado === 'RECHAZADO') {
        nuevoEstado = EstadoBoletaSII.RECHAZADO;
      } else if (queryResponse.estado === 'ERROR') {
        nuevoEstado = EstadoBoletaSII.ERROR;
      }

      if (nuevoEstado !== boleta.estado) {
        await prisma.boletaElectronica.update({
          where: { id: boleta.id },
          data: {
            estado: nuevoEstado,
            fecha_respuesta_sii: new Date(),
            respuesta_sii: JSON.stringify(queryResponse),
          },
        });
      }

      return {
        success: true,
        mensaje: 'Estado consultado exitosamente',
        data: {
          boleta_id: boleta.id,
          track_id: trackId,
          estado: nuevoEstado,
          fecha_emision: boleta.fecha_emision,
          monto_total: parseFloat(boleta.monto_total.toString()),
          ambiente: boleta.ambiente,
          respuesta_sii: queryResponse,
        },
      };
    } catch (error: any) {
      console.error('[Boleta] Error al consultar estado:', error);
      return {
        success: false,
        mensaje: 'Error al consultar estado',
        error: error.message,
      };
    }
  }

  /**
   * Calcula los totales de una boleta
   */
  private calcularTotales(
    items: Array<{ cantidad: number; precioUnitario: number; descuentoPct?: number }>
  ): {
    montoNeto: number;
    montoExento: number;
    iva: number;
    montoTotal: number;
  } {
    let subtotal = 0;

    items.forEach((item) => {
      const precioConDescuento = item.precioUnitario * (1 - (item.descuentoPct || 0) / 100);
      const montoItem = precioConDescuento * item.cantidad;
      subtotal += montoItem;
    });

    const montoNeto = subtotal / 1.19; // Desglosar IVA
    const iva = subtotal - montoNeto;
    const montoTotal = subtotal;

    return {
      montoNeto: Math.round(montoNeto),
      montoExento: 0,
      iva: Math.round(iva),
      montoTotal: Math.round(montoTotal),
    };
  }
}

export default new BoletaService();
