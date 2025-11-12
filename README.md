# VetConnect FAVET - Backend API

Backend API REST para el sistema de gestión clínica veterinaria VetConnect FAVET - Universidad de Chile.

## 📋 Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Base de Datos](#base-de-datos)
- [API Endpoints](#api-endpoints)
- [Autenticación](#autenticación)
- [Despliegue](#despliegue)

---

## 🛠 Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Prisma ORM** - ORM para PostgreSQL
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación basada en tokens
- **Zod** - Validación de esquemas
- **bcryptjs** - Hash de contraseñas

---

## 📦 Requisitos Previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14.0 (o cuenta en Neon.tech)
- **Git**

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd vetconnect-favet-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` y configurar las variables necesarias (ver sección [Configuración](#configuración)).

### 4. Configurar base de datos

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Cargar datos de prueba
npm run db:seed
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

---

## ⚙️ Configuración

### Variables de Entorno

Archivo `.env`:

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:password@hostname:5432/vetconnect_favet"
DIRECT_URL="postgresql://usuario:password@hostname:5432/vetconnect_favet"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# JWT
JWT_SECRET="tu-secreto-super-seguro-de-al-menos-32-caracteres"
JWT_EXPIRES_IN="7d"

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="notificaciones@vetconnect.cl"
SMTP_PASSWORD="tu-password"

# Almacenamiento (opcional)
STORAGE_TYPE="local"
AWS_ACCESS_KEY_ID="tu-access-key"
AWS_SECRET_ACCESS_KEY="tu-secret-key"
AWS_S3_BUCKET="vetconnect-files"
```

### Configuración de Base de Datos con Neon

1. Crear cuenta en [Neon.tech](https://neon.tech)
2. Crear nuevo proyecto
3. Copiar la connection string
4. Pegar en `DATABASE_URL` en el archivo `.env`

---

## 📁 Estructura del Proyecto

```
vetconnect-favet-backend/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── migrations/            # Migraciones
│   └── seed.ts                # Datos de prueba
├── src/
│   ├── app/
│   │   └── api/               # API Routes
│   │       ├── auth/          # Autenticación
│   │       ├── pacientes/     # CRUD Pacientes
│   │       ├── tutores/       # CRUD Tutores
│   │       ├── citas/         # CRUD Citas
│   │       ├── fichas-clinicas/
│   │       ├── hospitalizacion/
│   │       ├── cirugias/
│   │       ├── inventario/
│   │       └── facturacion/
│   ├── lib/
│   │   ├── prisma.ts          # Cliente Prisma
│   │   ├── auth.ts            # Utilidades JWT
│   │   └── api-response.ts    # Respuestas estandarizadas
│   ├── middleware/
│   │   └── auth-middleware.ts # Middleware de autenticación
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Utilidades
│   └── services/              # Lógica de negocio
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## 🗄️ Base de Datos

### Esquema Principal

El sistema cuenta con **45 tablas** organizadas en módulos:

#### Módulos Principales:

1. **Centros y Usuarios**
   - `centros` - Centros veterinarios (Bilbao, El Roble, Hospital)
   - `usuarios` - Staff (admin, veterinarios, recepcionistas)
   - `tutores` - Propietarios de mascotas

2. **Pacientes**
   - `pacientes` - Información de mascotas
   - `registros_peso` - Evolución de peso
   - `vacunas` - Historial de vacunación

3. **Agenda y Citas**
   - `horarios` - Horarios de atención
   - `ausencias` - Vacaciones y licencias
   - `citas` - Agendamiento de consultas
   - `boxes` - Boxes/Caniles/Pabellones

4. **Atención Clínica**
   - `fichas_clinicas` - Fichas de consulta
   - `examenes` - Exámenes solicitados/realizados
   - `recetas` - Recetas médicas

5. **Hospitalización**
   - `hospitalizaciones` - Ingresos hospitalarios
   - `signos_vitales` - Monitoreo de constantes
   - `tratamientos` - Medicamentos y dosis
   - `aplicaciones_tratamiento` - Registro de aplicación
   - `evoluciones` - Notas de evolución
   - `epicrisis` - Fichas de derivación

6. **Cirugías**
   - `cirugias` - Procedimientos quirúrgicos
   - Signos vitales intraoperatorios

7. **Convenios**
   - `convenios` - Planes de salud
   - `convenios_pacientes` - Asignación de planes

8. **Inventario**
   - `inventario` - Stock de medicamentos/insumos
   - `movimientos_inventario` - Trazabilidad
   - `insumos_utilizados` - Consumo en atenciones
   - `proveedores` - Proveedores
   - `ordenes_compra` - Órdenes de compra
   - `items_orden_compra` - Detalles de órdenes

9. **Facturación**
   - `facturas` - Facturas y boletas
   - `items_factura` - Detalles de facturación
   - `presupuestos` - Presupuestos
   - `items_presupuesto` - Detalles de presupuestos
   - `cajas` - Cajas diarias
   - `movimientos_caja` - Ingresos/egresos

10. **Auditoría**
    - `audit_logs` - Registro de cambios

### Migraciones

```bash
# Crear nueva migración
npm run prisma:migrate

# Aplicar migraciones en producción
npx prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status

# Resetear base de datos (CUIDADO: borra todo)
npm run db:reset
```

### Prisma Studio

Interfaz visual para explorar la base de datos:

```bash
npm run prisma:studio
```

Abre en `http://localhost:5555`

---

## 🔌 API Endpoints

### Autenticación

#### `POST /api/auth/login`

Iniciar sesión.

**Request:**
```json
{
  "email": "veterinario@vetconnect.cl",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 1,
      "nombre_completo": "Dr. Juan Pérez",
      "email": "veterinario@vetconnect.cl",
      "rut": "12345678-9",
      "rol": "VETERINARIO",
      "centro": {
        "id": 1,
        "nombre": "Hospital Clínico Veterinario Bilbao",
        "codigo": "BILBAO"
      }
    }
  },
  "message": "Login exitoso"
}
```

---

### Pacientes

#### `GET /api/pacientes`

Listar pacientes del centro.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Items por página (default: 50)
- `search` (opcional): Búsqueda por nombre, chip o número de ficha
- `fallecido` (opcional): Filtrar por fallecidos (true/false)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "numero_ficha": "0001",
      "nombre": "Max",
      "especie": "CANINO",
      "raza": "Golden Retriever",
      "sexo": "MACHO",
      "peso_kg": "25.5",
      "chip": "123456789012345",
      "tutor": {
        "id": 1,
        "nombre_completo": "María González",
        "rut": "12345678-9",
        "email": "maria@email.com",
        "telefono": "+56912345678"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

#### `POST /api/pacientes`

Crear nuevo paciente.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "tutor_id": 1,
  "nombre": "Max",
  "especie": "CANINO",
  "raza": "Golden Retriever",
  "sexo": "MACHO",
  "estado_reproductivo": "CASTRADO",
  "fecha_nacimiento": "2020-05-15T00:00:00.000Z",
  "peso_kg": 25.5,
  "chip": "123456789012345",
  "color": "Dorado",
  "tamanio": "GRANDE",
  "caracter": "DOCIL"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "numero_ficha": "0001",
    "nombre": "Max",
    ...
  },
  "message": "Paciente creado exitosamente"
}
```

#### `GET /api/pacientes/[id]`

Obtener paciente por ID (incluye historial).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "numero_ficha": "0001",
    "nombre": "Max",
    "tutor": { ... },
    "fichas_clinicas": [ ... ],
    "pesos": [ ... ],
    "vacunas": [ ... ]
  }
}
```

#### `PUT /api/pacientes/[id]`

Actualizar paciente.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "peso_kg": 26.0,
  "notas": "Paciente con sobrepeso"
}
```

#### `DELETE /api/pacientes/[id]`

Eliminar paciente (soft delete).

**Headers:**
```
Authorization: Bearer <token>
```

---

### Otros Módulos

Los siguientes endpoints siguen la misma estructura REST:

- `/api/tutores` - CRUD de tutores
- `/api/citas` - CRUD de citas
- `/api/fichas-clinicas` - CRUD de fichas clínicas
- `/api/hospitalizacion` - CRUD de hospitalizaciones
- `/api/cirugias` - CRUD de cirugías
- `/api/inventario` - CRUD de inventario
- `/api/facturacion` - CRUD de facturas

**Estructura estándar:**
- `GET /api/{recurso}` - Listar con paginación
- `POST /api/{recurso}` - Crear
- `GET /api/{recurso}/[id]` - Obtener por ID
- `PUT /api/{recurso}/[id]` - Actualizar
- `DELETE /api/{recurso}/[id]` - Eliminar

---

## 🔐 Autenticación

El sistema usa **JWT (JSON Web Tokens)** para autenticación.

### Flujo de Autenticación

1. Usuario hace login en `/api/auth/login`
2. Backend valida credenciales y genera token JWT
3. Cliente guarda el token (localStorage/cookies)
4. Cliente incluye token en header `Authorization: Bearer <token>` en cada request
5. Middleware `withAuth` valida el token y extrae datos del usuario
6. API procesa el request con contexto del usuario autenticado

### Middleware de Autenticación

```typescript
import { withAuth } from '@/middleware/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    // req.user contiene: userId, email, rol, centroId
    const userId = req.user!.userId;
    // ... lógica protegida
  });
}
```

### Middleware con Roles

```typescript
import { withAuthAndRoles } from '@/middleware/auth-middleware';
import { RolUsuario } from '@prisma/client';

export async function DELETE(request: NextRequest) {
  return withAuthAndRoles([RolUsuario.ADMIN])(request, async (req) => {
    // Solo administradores pueden eliminar
  });
}
```

---

## 📊 Respuestas Estandarizadas

Todas las respuestas de la API siguen este formato:

### Respuesta Exitosa

```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa",
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "totalPages": 2
  }
}
```

### Respuesta de Error

```json
{
  "success": false,
  "error": "Mensaje de error descriptivo"
}
```

### Códigos HTTP

- `200 OK` - Operación exitosa
- `201 Created` - Recurso creado
- `204 No Content` - Eliminación exitosa
- `400 Bad Request` - Error en la solicitud
- `401 Unauthorized` - No autenticado
- `403 Forbidden` - Sin permisos
- `404 Not Found` - Recurso no encontrado
- `422 Unprocessable Entity` - Error de validación
- `500 Internal Server Error` - Error del servidor

---

## 🚢 Despliegue

### Vercel (Recomendado)

1. Instalar Vercel CLI:
```bash
npm install -g vercel
```

2. Desplegar:
```bash
vercel --prod
```

3. Configurar variables de entorno en Vercel Dashboard

### Railway

1. Crear cuenta en [Railway.app](https://railway.app)
2. Conectar repositorio de GitHub
3. Configurar variables de entorno
4. Desplegar automáticamente

### Docker

```bash
# Build
docker build -t vetconnect-backend .

# Run
docker run -p 3000:3000 --env-file .env vetconnect-backend
```

---

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev                 # Iniciar servidor de desarrollo
npm run build               # Build para producción
npm run start               # Iniciar en producción
npm run lint                # Ejecutar linter

# Prisma
npm run prisma:generate     # Generar cliente Prisma
npm run prisma:migrate      # Crear y aplicar migración
npm run prisma:studio       # Abrir Prisma Studio
npm run prisma:push         # Push schema sin migración
npm run db:reset            # Resetear base de datos
npm run db:seed             # Cargar datos de prueba

# Testing
npm test                    # Ejecutar tests
npm run test:watch          # Tests en modo watch
```

---

## 🤝 Contribución

Este proyecto es desarrollado por **Aura Digital SPA** para la Universidad de Chile - FAVET.

---

## 📄 Licencia

© 2025 Aura Digital SPA. Todos los derechos reservados.

---

## 📧 Contacto

- **Email**: contacto@auradigital.dev
- **Soporte**: De lunes a viernes, 09:00 - 18:30 hrs
- **Emergencias**: 24/7

---

## 🔗 Enlaces Útiles

- [Documentación Next.js 14](https://nextjs.org/docs)
- [Documentación Prisma](https://www.prisma.io/docs)
- [Documentación PostgreSQL](https://www.postgresql.org/docs/)
- [Neon PostgreSQL](https://neon.tech/docs)
