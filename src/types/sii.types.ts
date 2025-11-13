/**
 * Tipos TypeScript para integración con el SII (Servicio de Impuestos Internos - Chile)
 * Sistema de Documentos Tributarios Electrónicos (DTE)
 */

export interface SIIConfig {
  mode: 'demo' | 'certificacion' | 'produccion';
  environment: 'certificacion' | 'produccion';
  apiUrl: string;
  uploadEndpoint: string;
  queryEndpoint: string;
  rutEmpresa: string;
  razonSocial: string;
  giro: string;
  actividadEconomica: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  certPath: string;
  certPassword: string;
  resolucionNumero: string;
  resolucionFecha: string;
}

export interface DTEEmisor {
  rut: string;
  razonSocial: string;
  giro: string;
  actividadEconomica: string;
  direccion: string;
  comuna: string;
  ciudad: string;
}

export interface DTEReceptor {
  rut: string;
  razonSocial: string;
  giro?: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
}

export interface DTEDetalle {
  numeroLinea: number;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  unidadMedida?: string;
  precioUnitario: number;
  descuentoPct?: number;
  recargoPct?: number;
  montoItem: number;
  indicadorExento?: boolean;
}

export interface DTETotales {
  montoNeto: number;
  montoExento: number;
  iva: number;
  montoTotal: number;
}

export interface DTEDocumento {
  tipo: number; // 39 = Boleta Electrónica
  folio?: string;
  fechaEmision: Date;
  emisor: DTEEmisor;
  receptor?: DTEReceptor;
  detalles: DTEDetalle[];
  totales: DTETotales;
  ambiente: 'certificacion' | 'produccion';
}

export interface FirmaDigital {
  certificado: string; // Certificado en formato PEM
  clavePrivada: string; // Clave privada en formato PEM
}

export interface SIIUploadResponse {
  success: boolean;
  trackId?: string;
  estado?: 'ACEPTADO' | 'RECHAZADO' | 'REPARO' | 'ERROR';
  mensaje?: string;
  codigoRechazo?: string;
  glosaRechazo?: string;
  xml?: string;
}

export interface SIIQueryResponse {
  success: boolean;
  trackId: string;
  estado: 'ACEPTADO' | 'RECHAZADO' | 'REPARO' | 'PROCESANDO' | 'ERROR';
  fechaRecepcion?: Date;
  fechaProcesamiento?: Date;
  errores?: Array<{
    codigo: string;
    descripcion: string;
  }>;
}

export interface BoletaDemoRequest {
  factura_id?: number;
  centro_id: number;
  receptor?: {
    rut?: string;
    razonSocial?: string;
  };
  items: Array<{
    nombre: string;
    descripcion?: string;
    cantidad: number;
    precioUnitario: number;
    descuentoPct?: number;
  }>;
  ambiente?: 'certificacion' | 'produccion';
}

export interface BoletaDemoResponse {
  success: boolean;
  mensaje: string;
  data?: {
    boleta_id: number;
    folio?: string;
    track_id?: string;
    estado: string;
    monto_total: number;
    xml_generado?: string;
    xml_firmado?: string;
    fecha_emision: Date;
    ambiente: string;
  };
  error?: string;
}
