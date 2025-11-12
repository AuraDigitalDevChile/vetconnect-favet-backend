# VetConnect FAVET - Backend API REST

Backend API REST para el sistema de gestión clínica veterinaria VetConnect FAVET - Universidad de Chile.

**Repositorio:** https://github.com/AuraDigitalDevChile/vetconnect-favet-backend

---

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

- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web para Node.js
- **TypeScript** - Tipado estático
- **Prisma ORM** - ORM para PostgreSQL
- **PostgreSQL (Neon)** - Base de datos relacional en la nube
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
git clone https://github.com/AuraDigitalDevChile/vetconnect-favet-backend.git
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

### 4. Generar cliente de Prisma

```bash
npm run prisma:generate
```

### 5. (Opcional) Cargar datos de prueba

```bash
npm run db:seed
```

### 6. Iniciar servidor de desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

---

## ⚙️ Configuración

### Variables de Entorno

Archivo `.env`:

```env
# Base de Datos (ya configurado con Neon)
DATABASE_URL="postgresql://neondb_owner:npg_xenQDMO7G9BY@ep-young-water-ahygp2on-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Servidor
PORT=3000
NODE_ENV="development"

# JWT
JWT_SECRET="vetconnect-favet-jwt-secret-key-2025-aura-digital-ultra-seguro-32chars-min"
JWT_EXPIRES_IN="7d"

# CORS
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"

# Rate Limiting
RATE_LIMIT_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="60000"
```

---

## 📁 Estructura del Proyecto

```
vetconnect-favet-backend/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos (45 tablas)
│   ├── migrations/            # Migraciones aplicadas
│   └── seed.ts               # (Por crear) Datos de prueba
├── src/
│   ├── config/
│   │   └── database.ts        # Cliente Prisma
│   ├── controllers/
│   │   └── auth.controller.ts # Controladores
│   ├── middleware/
│   │   ├── auth.middleware.ts # Autenticación
│   │   ├── error.middleware.ts# Manejo de errores
│   │   └── notFound.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts     # Rutas de autenticación
│   │   ├── pacientes.routes.ts# (Por implementar)
│   │   ├── tutores.routes.ts  # (Por implementar)
│   │   ├── citas.routes.ts    # (Por implementar)
│   │   └── ...
│   ├── services/              # Lógica de negocio (por crear)
│   ├── utils/
│   │   ├── auth.utils.ts      # Utilidades JWT
│   │   └── api-response.utils.ts
│   └── server.ts              # Servidor Express principal
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🗄️ Base de Datos

### Esquema Principal

El sistema cuenta con **45 tablas** organizadas en módulos:

#### Módulos Principales:

1. **Centros y Usuarios**
   - `centros` - 3 centros (Bilbao, El Roble, Hospital)
   - `usuarios` - Staff (230 usuarios soportados)
   - `tutores` - Propietarios de mascotas

2. **Pacientes**
   - `pacientes` - Información de mascotas
   - `registros_peso` - Evolución de peso
   - `vacunas` - Historial de vacunación

3. **Agenda y Citas**
   - `horarios` - Horarios de atención
   - `ausencias` - Vacaciones y licencias
   - `citas` - Agendamiento
   - `boxes` - Boxes/Caniles/Pabellones

4. **Atención Clínica**
   - `fichas_clinicas` - Fichas de consulta
   - `examenes` - Exámenes solicitados
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
   - `convenios_pacientes` - Asignación

8. **Inventario**
   - `inventario` - Stock de medicamentos/insumos
   - `movimientos_inventario` - Trazabilidad
   - `insumos_utilizados` - Consumo en atenciones
   - `proveedores` - Proveedores
   - `ordenes_compra` - Órdenes de compra

9. **Facturación**
   - `facturas` - Facturas y boletas
   - `items_factura` - Detalles
   - `presupuestos` - Presupuestos
   - `cajas` - Cajas diarias
   - `movimientos_caja` - Ingresos/egresos

10. **Auditoría**
    - `audit_logs` - Registro de cambios

### Comandos Prisma

```bash
# Generar cliente
npm run prisma:generate

# Crear migración
npm run prisma:migrate

# Ver base de datos (GUI)
npm run prisma:studio

# Aplicar schema sin migración
npm run prisma:push

# Resetear base de datos (CUIDADO)
npm run db:reset

# Cargar datos de prueba
npm run db:seed
```

### Prisma Studio

Interfaz visual para explorar la base de datos:

```bash
npm run prisma:studio
```

Abre en `http://localhost:5555`

---

## 🔌 API Endpoints

### Health Check

#### `GET /health`

Verificar que el servidor está funcionando.

**Response:**
```json
{
  "status": "OK",
  "message": "VetConnect FAVET API is running",
  "timestamp": "2025-11-12T03:58:33.000Z",
  "environment": "development"
}
```

---

### Autenticación

#### `POST /api/auth/login`

Iniciar sesión.

**Request:**
```json
{
  "email": "admin@vetconnect.cl",
  "password": "admin123"
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
      "email": "admin@vetconnect.cl",
      "rut": "12345678-9",
      "rol": "ADMIN",
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

⚠️ **Por implementar:**

- `GET /api/pacientes` - Listar pacientes
- `POST /api/pacientes` - Crear paciente
- `GET /api/pacientes/:id` - Obtener paciente
- `PUT /api/pacientes/:id` - Actualizar paciente
- `DELETE /api/pacientes/:id` - Eliminar paciente

---

### Otros Módulos

Las siguientes rutas están preparadas pero **pendientes de implementación**:

- `/api/tutores` - CRUD de tutores
- `/api/citas` - CRUD de citas
- `/api/fichas-clinicas` - CRUD de fichas clínicas
- `/api/hospitalizacion` - CRUD de hospitalizaciones
- `/api/cirugias` - CRUD de cirugías
- `/api/inventario` - CRUD de inventario
- `/api/facturacion` - CRUD de facturas

---

## 🔐 Autenticación

El sistema usa **JWT (JSON Web Tokens)** para autenticación.

### Flujo de Autenticación

1. Usuario hace login en `/api/auth/login`
2. Backend valida credenciales y genera token JWT
3. Cliente guarda el token (localStorage/cookies)
4. Cliente incluye token en header `Authorization: Bearer <token>` en cada request
5. Middleware `authenticate` valida el token
6. API procesa el request con contexto del usuario autenticado

### Uso del Middleware

```typescript
import { authenticate, authorize } from './middleware/auth.middleware';
import { RolUsuario } from '@prisma/client';

// Proteger ruta (requiere autenticación)
router.get('/pacientes', authenticate, (req, res) => {
  // req.user contiene datos del usuario
});

// Proteger ruta con roles específicos
router.delete('/pacientes/:id',
  authenticate,
  authorize(RolUsuario.ADMIN),
  (req, res) => {
    // Solo administradores
  }
);
```

---

## 📊 Respuestas Estandarizadas

Todas las respuestas siguen este formato:

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

### Railway (Recomendado)

1. Crear cuenta en [Railway.app](https://railway.app)
2. Conectar repositorio de GitHub
3. Configurar variables de entorno
4. Desplegar automáticamente

### Render

1. Crear cuenta en [Render.com](https://render.com)
2. Crear nuevo Web Service
3. Conectar con GitHub
4. Configurar variables de entorno
5. Deploy

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
npm run dev                 # Iniciar servidor de desarrollo con hot-reload
npm run build               # Compilar TypeScript a JavaScript
npm run start               # Iniciar en producción

# Prisma
npm run prisma:generate     # Generar cliente Prisma
npm run prisma:migrate      # Crear y aplicar migración
npm run prisma:studio       # Abrir Prisma Studio (GUI)
npm run prisma:push         # Push schema sin migración
npm run db:reset            # Resetear base de datos
npm run db:seed             # Cargar datos de prueba

# Testing
npm test                    # Ejecutar tests
npm run test:watch          # Tests en modo watch
```

---

## ✅ Estado del Proyecto

### ✅ Completado

- [x] Backend Express + TypeScript configurado
- [x] Base de datos PostgreSQL (45 tablas) migrada a Neon
- [x] Prisma ORM configurado
- [x] Autenticación JWT implementada
- [x] Middleware de seguridad (helmet, cors, rate-limit)
- [x] API de login funcional
- [x] Estructura modular (controllers, routes, middleware)
- [x] Manejo centralizado de errores
- [x] Respuestas API estandarizadas
- [x] Documentación completa

### ⚠️ Pendiente

- [ ] Implementar CRUD de Pacientes
- [ ] Implementar CRUD de Tutores
- [ ] Implementar CRUD de Citas
- [ ] Implementar CRUD de Fichas Clínicas
- [ ] Implementar CRUD de Hospitalización
- [ ] Implementar CRUD de Cirugías
- [ ] Implementar CRUD de Inventario
- [ ] Implementar CRUD de Facturación
- [ ] Crear seed de datos de prueba
- [ ] Testing unitario
- [ ] Testing de integración
- [ ] Documentación API (Swagger/OpenAPI)
- [ ] CI/CD pipeline

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
- **GitHub**: https://github.com/AuraDigitalDevChile/vetconnect-favet-backend

---

## 🔗 Enlaces Útiles

- [Documentación Express](https://expressjs.com/)
- [Documentación Prisma](https://www.prisma.io/docs)
- [Documentación PostgreSQL](https://www.postgresql.org/docs/)
- [Neon PostgreSQL](https://neon.tech/docs)
- [JWT](https://jwt.io/introduction)
