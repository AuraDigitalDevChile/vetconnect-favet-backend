/**
 * Servicio de generación de XML DTE (Documentos Tributarios Electrónicos)
 * Genera boletas electrónicas tipo 39 según especificación del SII
 */

import { create } from 'xmlbuilder2';
import { format } from 'date-fns';
import { DTEDocumento } from '../../types/sii.types';
import siiConfigService from './config.service';

class XMLGeneratorService {
  /**
   * Genera el XML de una boleta electrónica (DTE tipo 39)
   */
  generateBoletaXML(documento: DTEDocumento): string {
    const config = siiConfigService.getConfig();

    // Formato de fecha: YYYY-MM-DD
    const fechaEmision = format(documento.fechaEmision, 'yyyy-MM-dd');

    // Generar folio único si no existe
    const folio = documento.folio || this.generateFolio();

    // Construir XML según especificación del SII
    const root = create({ version: '1.0', encoding: 'ISO-8859-1' })
      .ele('DTE', {
        version: '1.0',
        xmlns: 'http://www.sii.cl/SiiDte',
      })
      .ele('Documento', { ID: `DTE${folio}` });

    // Encabezado
    const encabezado = root.ele('Encabezado');

    // ID del documento
    const idDoc = encabezado.ele('IdDoc');
    idDoc.ele('TipoDTE').txt(documento.tipo.toString()); // 39 = Boleta Electrónica
    idDoc.ele('Folio').txt(folio);
    idDoc.ele('FchEmis').txt(fechaEmision);
    idDoc.ele('IndServicio').txt('3'); // 3 = Facturación de servicios periódicos
    idDoc.up();

    // Emisor
    const emisor = encabezado.ele('Emisor');
    emisor.ele('RUTEmisor').txt(this.formatRut(documento.emisor.rut));
    emisor.ele('RznSocEmisor').txt(documento.emisor.razonSocial);
    emisor.ele('GiroEmisor').txt(documento.emisor.giro);
    emisor.ele('Acteco').txt(documento.emisor.actividadEconomica);
    emisor.ele('DirOrigen').txt(documento.emisor.direccion);
    emisor.ele('CmnaOrigen').txt(documento.emisor.comuna);
    emisor.ele('CiudadOrigen').txt(documento.emisor.ciudad);
    emisor.up();

    // Receptor (opcional para boletas)
    if (documento.receptor) {
      const receptor = encabezado.ele('Receptor');
      receptor.ele('RUTRecep').txt(this.formatRut(documento.receptor.rut));
      receptor.ele('RznSocRecep').txt(documento.receptor.razonSocial);

      if (documento.receptor.giro) {
        receptor.ele('GiroRecep').txt(documento.receptor.giro);
      }

      if (documento.receptor.direccion) {
        receptor.ele('DirRecep').txt(documento.receptor.direccion);
      }

      if (documento.receptor.comuna) {
        receptor.ele('CmnaRecep').txt(documento.receptor.comuna);
      }

      if (documento.receptor.ciudad) {
        receptor.ele('CiudadRecep').txt(documento.receptor.ciudad);
      }
      receptor.up();
    }

    // Totales
    const totales = encabezado.ele('Totales');
    totales.ele('MntNeto').txt(Math.round(documento.totales.montoNeto).toString());

    if (documento.totales.montoExento > 0) {
      totales.ele('MntExe').txt(Math.round(documento.totales.montoExento).toString());
    }

    totales.ele('IVA').txt(Math.round(documento.totales.iva).toString());
    totales.ele('MntTotal').txt(Math.round(documento.totales.montoTotal).toString());
    totales.up();
    encabezado.up();

    // Detalles (ítems de la boleta)
    documento.detalles.forEach((detalle) => {
      const detalleNode = root.ele('Detalle');
      detalleNode.ele('NroLinDet').txt(detalle.numeroLinea.toString());
      detalleNode.ele('NmbItem').txt(this.cleanText(detalle.nombre));

      if (detalle.descripcion) {
        detalleNode.ele('DscItem').txt(this.cleanText(detalle.descripcion));
      }

      detalleNode.ele('QtyItem').txt(detalle.cantidad.toString());

      if (detalle.unidadMedida) {
        detalleNode.ele('UnmdItem').txt(detalle.unidadMedida);
      }

      detalleNode.ele('PrcItem').txt(Math.round(detalle.precioUnitario).toString());

      if (detalle.descuentoPct && detalle.descuentoPct > 0) {
        detalleNode.ele('DescuentoPct').txt(detalle.descuentoPct.toString());
      }

      if (detalle.recargoPct && detalle.recargoPct > 0) {
        detalleNode.ele('RecargoPct').txt(detalle.recargoPct.toString());
      }

      detalleNode.ele('MontoItem').txt(Math.round(detalle.montoItem).toString());

      if (detalle.indicadorExento) {
        detalleNode.ele('IndExe').txt('1');
      }
      detalleNode.up();
    });

    // Referencia a la resolución del SII
    const referencia = root.ele('Referencia');
    referencia.ele('NroLinRef').txt('1');
    referencia.ele('TpoDocRef').txt('SET'); // SET = Resolución del SII
    referencia.ele('FolioRef').txt(config.resolucionNumero);
    referencia.ele('FchRef').txt(config.resolucionFecha);
    referencia.ele('RazonRef').txt('CASO-CERTIFICACION');
    referencia.up();

    // Convertir a string XML
    const xml = root.end({ prettyPrint: true });

    return xml;
  }

  /**
   * Genera un folio único para la boleta
   * En producción, esto debería obtenerse de una secuencia en BD
   */
  private generateFolio(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random}`;
  }

  /**
   * Formatea un RUT al formato del SII (sin puntos, con guión)
   * Ejemplo: 76123456-7
   */
  private formatRut(rut: string): string {
    // Remover puntos y espacios
    let rutLimpio = rut.replace(/\./g, '').replace(/\s/g, '').toUpperCase();

    // Asegurar que tenga guión
    if (!rutLimpio.includes('-')) {
      const cuerpo = rutLimpio.slice(0, -1);
      const dv = rutLimpio.slice(-1);
      rutLimpio = `${cuerpo}-${dv}`;
    }

    return rutLimpio;
  }

  /**
   * Limpia texto para cumplir con restricciones del SII
   * Remueve caracteres especiales y normaliza
   */
  private cleanText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
      .trim()
      .substring(0, 300); // Máximo 300 caracteres
  }

  /**
   * Extrae el ID del documento desde el XML
   */
  extractDocumentId(xml: string): string | null {
    const match = xml.match(/ID="([^"]+)"/);
    return match ? match[1] : null;
  }
}

export default new XMLGeneratorService();
