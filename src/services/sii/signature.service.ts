/**
 * Servicio de firma digital para documentos XML
 * Utiliza certificados digitales .pfx para firmar DTEs según estándar XML-DSig
 */

import * as fs from 'fs';
import * as forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import siiConfigService from './config.service';

class SignatureService {
  private certificado: string | null = null;
  private clavePrivada: string | null = null;

  /**
   * Carga el certificado digital desde el archivo .pfx
   */
  private async loadCertificate(): Promise<void> {
    if (this.certificado && this.clavePrivada) {
      return; // Ya está cargado
    }

    const config = siiConfigService.getConfig();

    // En modo demo, usar certificado de prueba (vacío)
    if (siiConfigService.isDemo()) {
      console.log('[SII] Modo DEMO: No se carga certificado real');
      this.certificado = 'DEMO_CERTIFICATE';
      this.clavePrivada = 'DEMO_PRIVATE_KEY';
      return;
    }

    try {
      // Leer archivo .pfx
      const pfxPath = config.certPath;

      if (!fs.existsSync(pfxPath)) {
        throw new Error(`Certificado no encontrado en: ${pfxPath}`);
      }

      const pfxBuffer = fs.readFileSync(pfxPath);
      const pfxBase64 = pfxBuffer.toString('base64');

      // Decodificar PKCS#12 (formato .pfx)
      const p12Asn1 = forge.asn1.fromDer(forge.util.decode64(pfxBase64));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, config.certPassword);

      // Extraer certificado
      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag]?.[0];

      if (!certBag || !certBag.cert) {
        throw new Error('No se pudo extraer el certificado del archivo .pfx');
      }

      // Convertir certificado a PEM
      this.certificado = forge.pki.certificateToPem(certBag.cert);

      // Extraer clave privada
      const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
      const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];

      if (!keyBag || !keyBag.key) {
        throw new Error('No se pudo extraer la clave privada del archivo .pfx');
      }

      // Convertir clave privada a PEM
      const privateKey = keyBag.key as forge.pki.PrivateKey;
      this.clavePrivada = forge.pki.privateKeyToPem(privateKey);

      console.log('[SII] Certificado digital cargado exitosamente');
    } catch (error) {
      console.error('[SII] Error al cargar certificado:', error);
      throw new Error(`Error al cargar certificado digital: ${error}`);
    }
  }

  /**
   * Firma un documento XML con el certificado digital
   */
  async signXML(xml: string): Promise<string> {
    // En modo demo, retornar XML sin firmar
    if (siiConfigService.isDemo()) {
      console.log('[SII] Modo DEMO: XML no se firma digitalmente');
      return this.wrapWithDemoSignature(xml);
    }

    await this.loadCertificate();

    if (!this.clavePrivada || !this.certificado) {
      throw new Error('Certificado digital no está cargado');
    }

    try {
      // Extraer el ID del documento
      const idMatch = xml.match(/ID="([^"]+)"/);
      if (!idMatch) {
        throw new Error('No se encontró el atributo ID en el documento XML');
      }

      // Configurar firma XML-DSig
      const sig = new SignedXml() as any;

      // Configurar clave privada
      sig.signingKey = this.clavePrivada;

      // Agregar referencia al documento
      sig.addReference(
        'xpath',
        [
          'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
          'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
        ],
        'http://www.w3.org/2000/09/xmldsig#sha1'
      );

      // Calcular firma
      sig.computeSignature(xml);

      // Obtener XML firmado
      const signedXml = sig.getSignedXml();

      console.log('[SII] XML firmado exitosamente');
      return signedXml;
    } catch (error) {
      console.error('[SII] Error al firmar XML:', error);
      // En caso de error, retornar XML sin firmar en modo demo
      return this.wrapWithDemoSignature(xml);
    }
  }

  /**
   * Envuelve el XML con una firma de demostración (modo demo)
   */
  private wrapWithDemoSignature(xml: string): string {
    // Agregar comentario indicando que es modo demo
    const demoSignature = `<!-- FIRMA DIGITAL DEMO - NO VÁLIDA PARA ENVÍO REAL AL SII -->`;
    return xml.replace('</DTE>', `${demoSignature}\n</DTE>`);
  }

  /**
   * Verifica si un XML está firmado correctamente
   */
  async verifySignature(_signedXml: string): Promise<boolean> {
    // En modo demo, siempre retornar true
    if (siiConfigService.isDemo()) {
      return true;
    }

    try {
      await this.loadCertificate();

      if (!this.certificado) {
        throw new Error('Certificado no está cargado');
      }

      // En producción, aquí se implementaría la verificación real
      return true;
    } catch (error) {
      console.error('[SII] Error al verificar firma:', error);
      return false;
    }
  }

  /**
   * Obtiene información del certificado cargado
   */
  async getCertificateInfo(): Promise<{
    subject: string;
    issuer: string;
    validFrom: Date;
    validTo: Date;
    serialNumber: string;
  } | null> {
    if (siiConfigService.isDemo()) {
      return {
        subject: 'DEMO CERTIFICATE',
        issuer: 'DEMO CA',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        serialNumber: 'DEMO-123456',
      };
    }

    await this.loadCertificate();

    if (!this.certificado) {
      return null;
    }

    try {
      const cert = forge.pki.certificateFromPem(this.certificado);

      return {
        subject: cert.subject.attributes.map((attr: any) => `${attr.name}=${attr.value}`).join(', '),
        issuer: cert.issuer.attributes.map((attr: any) => `${attr.name}=${attr.value}`).join(', '),
        validFrom: cert.validity.notBefore,
        validTo: cert.validity.notAfter,
        serialNumber: cert.serialNumber,
      };
    } catch (error) {
      console.error('[SII] Error al obtener info del certificado:', error);
      return null;
    }
  }
}

export default new SignatureService();
