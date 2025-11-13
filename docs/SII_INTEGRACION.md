# Módulo de Integración SII - Boletas Electrónicas

Sistema completo de facturación electrónica integrado con el SII (Servicio de Impuestos Internos de Chile) para emitir boletas electrónicas tipo 39 en ambiente de certificación.

## 📋 Características

- ✅ Generación de XML DTE (Documentos Tributarios Electrónicos) tipo 39
- ✅ Firmado digital con certificados .pfx/.p12
- ✅ Envío al SII en ambiente de certificación (palena.sii.cl)
- ✅ Consulta de estado de boletas
- ✅ Modo DEMO sin envío real al SII
- ✅ Almacenamiento completo en base de datos
- ✅ API REST para gestión de boletas

## 🏗️ Arquitectura

```
┌─────────────────┐
│  API REST       │
│  /api/boleta/*  │
└────────┬────────┘
         │
┌────────▼────────────────────────────────────────┐
│  boleta.controller.ts                           │
│  - Validación con Zod                           │
│  - Manejo de errores                            │
└────────┬────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────┐
│  boleta.service.ts (Orquestador)                │
│  - Coordina flujo completo                      │
│  - Manejo de transacciones BD                   │
└────┬───────┬──────────┬─────────────────────────┘
     │       │          │
     ▼       ▼          ▼
┌─────────┐ ┌──────────┐ ┌─────────────┐
│ XML Gen │ │ Signature│ │ Integration │
│ Service │ │ Service  │ │ Service     │
└─────────┘ └──────────┘ └─────────────┘
     │           │              │
     └───────────┴──────────────┘
                 │
         ┌───────▼────────┐
         │  SII API       │
         │ palena.sii.cl  │
         └────────────────┘
```

## 🚀 Configuración

### 1. Variables de Entorno

Copia las siguientes variables al archivo `.env`:

```bash
# Modo de operación
MODE=demo                           # "demo", "certificacion", "produccion"

# Ambiente del SII
SII_ENVIRONMENT=certificacion       # "certificacion" o "produccion"
SII_API_URL=https://palena.sii.cl
SII_UPLOAD_ENDPOINT=https://palena.sii.cl/cgi_dte/UPL/DTEUpload
SII_QUERY_ENDPOINT=https://palena.sii.cl/cgi_dte/UPL/DTEQueryStatus

# Datos del emisor
SII_RUT_EMPRESA=76123456-7
SII_RAZON_SOCIAL=CLINICA VETERINARIA FAVET DEMO LTDA
SII_GIRO=SERVICIOS VETERINARIOS
SII_ACTIVIDAD_ECONOMICA=752000
SII_DIRECCION=Av. Santa Rosa 11735, La Pintana
SII_COMUNA=La Pintana
SII_CIUDAD=Santiago

# Certificado digital
SII_CERT_PATH=/certs/demo-cert.pfx
SII_CERT_PASSWORD=123456

# Resolución SII
SII_RESOLUCION_NUMERO=0
SII_RESOLUCION_FECHA=2014-08-22
```

### 2. Certificado Digital

Para **modo certificación** o **producción**, necesitas:

1. Obtener certificado digital desde el SII
2. Convertir a formato .pfx si es necesario:
   ```bash
   openssl pkcs12 -export -out certificado.pfx -inkey private.key -in certificado.crt
   ```
3. Colocar en la ruta especificada en `SII_CERT_PATH`

**Modo DEMO**: No requiere certificado real.

### 3. Base de Datos

Las tablas ya están creadas en Prisma. Si necesitas regenerarlas:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## 📡 Endpoints API

### 1. Generar Boleta Demo

```http
POST /api/boleta/demo
Authorization: Bearer <token>
Content-Type: application/json

{
  "centro_id": 1,
  "factura_id": 123,
  "receptor": {
    "rut": "12345678-9",
    "razonSocial": "Juan Pérez"
  },
  "items": [
    {
      "nombre": "Consulta veterinaria",
      "descripcion": "Consulta general",
      "cantidad": 1,
      "precioUnitario": 25000,
      "descuentoPct": 10
    },
    {
      "nombre": "Vacuna antirrábica",
      "cantidad": 1,
      "precioUnitario": 15000
    }
  ],
  "ambiente": "certificacion"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Boleta generada en modo DEMO",
  "data": {
    "boleta_id": 1,
    "folio": "1731533280123456",
    "track_id": "DEMO-1731533280456",
    "estado": "BORRADOR",
    "monto_total": 37500,
    "xml_generado": "<?xml version=\"1.0\"?>...",
    "xml_firmado": "<?xml version=\"1.0\"?>...",
    "fecha_emision": "2024-11-13T...",
    "ambiente": "certificacion"
  }
}
```

### 2. Consultar Estado

```http
GET /api/boleta/status/:trackId
Authorization: Bearer <token>
```

**Ejemplo:**
```http
GET /api/boleta/status/DEMO-1731533280456
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Estado consultado exitosamente",
  "data": {
    "boleta_id": 1,
    "track_id": "DEMO-1731533280456",
    "estado": "ACEPTADO",
    "fecha_emision": "2024-11-13T...",
    "monto_total": 37500,
    "ambiente": "certificacion",
    "respuesta_sii": {
      "success": true,
      "trackId": "DEMO-1731533280456",
      "estado": "ACEPTADO"
    }
  }
}
```

### 3. Obtener Configuración

```http
GET /api/boleta/config
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Configuración del SII",
  "data": {
    "mode": "demo",
    "environment": "certificacion",
    "emisor": {
      "rut": "76123456-7",
      "razonSocial": "CLINICA VETERINARIA FAVET DEMO LTDA",
      "giro": "SERVICIOS VETERINARIOS"
    },
    "configuracion_valida": true,
    "errores": []
  }
}
```

### 4. Probar Conexión

```http
GET /api/boleta/test-connection
Authorization: Bearer <token>
```

### 5. Información del Certificado

```http
GET /api/boleta/certificate-info
Authorization: Bearer <token>
```

## 🔧 Modos de Operación

### Modo DEMO

- **No envía** al SII real
- No requiere certificado digital
- Genera XML y simula respuestas
- Ideal para desarrollo y pruebas

```env
MODE=demo
```

### Modo Certificación

- **Envía** al ambiente de certificación del SII (palena.sii.cl)
- **Requiere** certificado digital válido
- Sin efectos tributarios reales
- Para homologación y pruebas

```env
MODE=certificacion
SII_ENVIRONMENT=certificacion
```

### Modo Producción

- **Envía** al SII real
- **Efectos tributarios reales**
- Solo usar con autorización del SII

```env
MODE=produccion
SII_ENVIRONMENT=produccion
```

## 📊 Estructura de Base de Datos

### Tabla: `BoletaElectronica`

```prisma
model BoletaElectronica {
  id                     Int
  factura_id             Int?
  centro_id              Int
  tipo_dte               Int              // 39 = Boleta
  folio                  String?
  rut_emisor             String
  razon_social_emisor    String
  rut_receptor           String?
  razon_social_receptor  String?
  fecha_emision          DateTime
  monto_neto             Decimal
  monto_exento           Decimal
  monto_iva              Decimal
  monto_total            Decimal
  xml_generado           String?
  xml_firmado            String?
  track_id               String?
  estado                 EstadoBoletaSII  // BORRADOR, ENVIADO, ACEPTADO, RECHAZADO, ERROR
  respuesta_sii          String?
  codigo_rechazo         String?
  glosa_rechazo          String?
  fecha_envio_sii        DateTime?
  fecha_respuesta_sii    DateTime?
  ambiente               String           // certificacion | produccion
  items                  ItemBoletaSII[]
}
```

### Estados de Boleta

- **BORRADOR**: Creada pero no enviada
- **ENVIADO**: Enviada al SII
- **ACEPTADO**: Aceptada por el SII
- **RECHAZADO**: Rechazada por el SII
- **ERROR**: Error en el proceso

## 🧪 Ejemplos de Uso

### Ejemplo con cURL

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@favet.cl",
    "password": "password123"
  }'

# 2. Generar boleta (reemplaza <TOKEN> con el token obtenido)
curl -X POST http://localhost:3000/api/boleta/demo \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "centro_id": 1,
    "items": [
      {
        "nombre": "Consulta veterinaria",
        "cantidad": 1,
        "precioUnitario": 25000
      }
    ]
  }'

# 3. Consultar estado
curl -X GET http://localhost:3000/api/boleta/status/DEMO-123456 \
  -H "Authorization: Bearer <TOKEN>"
```

### Ejemplo con JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/boleta/demo', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    centro_id: 1,
    items: [
      {
        nombre: 'Consulta veterinaria',
        cantidad: 1,
        precioUnitario: 25000,
      },
    ],
  }),
});

const data = await response.json();
console.log('Boleta generada:', data);
```

## 🛠️ Desarrollo

### Ejecutar en modo desarrollo

```bash
npm run dev
```

### Compilar

```bash
npm run build
```

### Verificar configuración

```bash
curl http://localhost:3000/api/boleta/config \
  -H "Authorization: Bearer <TOKEN>"
```

## 🔒 Seguridad

- Todos los endpoints requieren autenticación JWT
- Certificados nunca se exponen en respuestas API
- XML firmado solo se retorna en modo DEMO
- Validación completa con Zod
- Rate limiting aplicado

## 📝 Logs

Los servicios generan logs detallados:

```
[SII] Modo DEMO: No se carga certificado real
[Boleta] Iniciando generación de boleta demo
[Boleta] Generando XML DTE
[Boleta] Firmando XML
[SII] Modo DEMO: XML no se firma digitalmente
[Boleta] Boleta creada en BD con ID: 1
[Boleta] Modo DEMO: Simulando envío al SII
```

## ❓ FAQ

### ¿Puedo usar esto en producción?

Sí, pero debes:
1. Obtener certificado digital del SII
2. Configurar `MODE=produccion`
3. Tener autorización del SII
4. Implementar folios oficiales

### ¿Cómo obtengo un certificado de prueba?

Solicítalo al SII para ambiente de certificación.

### ¿Qué es el Track ID?

Es un identificador único asignado por el SII para rastrear el estado de la boleta.

### ¿Por qué mis boletas salen rechazadas?

Revisa:
- Formato de RUT
- Certificado vigente
- Datos del emisor coinciden con el certificado
- XML cumple con el esquema del SII

## 📞 Soporte

Para más información sobre el formato de DTEs, consulta:
- [Documentación oficial SII](https://www.sii.cl/servicios_online/1039-1185.html)
- [Esquemas XML DTE](http://www.sii.cl/factura_electronica/factura_mercado/esquemas.htm)

---

**Desarrollado para VetConnect FAVET**
Última actualización: 2024-11-13
