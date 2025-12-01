# 🚀 Vetlify Backend - Guía de Setup

## 📋 Prerequisitos

- Node.js 18+ ([Descargar](https://nodejs.org/))
- npm 9+ (incluido con Node.js)
- Git
- Cuenta en Railway ([railway.app](https://railway.app/))
- (Opcional) Docker Desktop para desarrollo local

---

## 🗄️ Configuración de Base de Datos en Railway

### Paso 1: Crear Proyecto en Railway

1. Ve a [railway.app](https://railway.app/) e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Provision PostgreSQL"**
4. Espera a que se aprovisione la base de datos

### Paso 2: Obtener Credenciales

1. En Railway, haz click en tu base de datos PostgreSQL
2. Ve a la pestaña **"Connect"**
3. Copia la **"Postgres Connection URL"** (formato: `postgresql://...`)
4. Guárdala, la necesitarás en el siguiente paso

Ejemplo de URL:
```
postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:5432/railway
```

---

## ⚙️ Configuración del Backend

### Paso 1: Clonar e Instalar

```bash
cd C:\Aura Digital\Proyectos\Vetlify\vetlify-backend

# Instalar dependencias
npm install
```

### Paso 2: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
copy .env.development .env

# O en Mac/Linux:
# cp .env.development .env
```

Edita el archivo `.env` y actualiza la **DATABASE_URL** con tu URL de Railway:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@containers-us-west-XXX.railway.app:5432/railway?sslmode=require"
```

**⚠️ IMPORTANTE:** No commitear el archivo `.env` al repositorio (ya está en `.gitignore`)

### Paso 3: Ejecutar Migraciones

```bash
# Generar Prisma Client
npm run prisma:generate

# Ejecutar migraciones (crea todas las tablas)
npm run prisma:migrate

# Si falla, puedes usar push (para desarrollo):
npm run prisma:push
```

### Paso 4: Seed de Datos (Opcional)

```bash
# Cargar datos de prueba
npm run db:seed
```

Esto creará:
- 3 centros (La Pintana, Oncología, Especialidades)
- Usuario admin (email: `admin@favet.cl`, password: `admin123`)
- Veterinarios de prueba
- Pacientes demo
- Citas de ejemplo

---

## 🏃 Ejecutar el Backend

### Modo Desarrollo

```bash
npm run dev
```

El servidor se iniciará en: `http://localhost:3001`

### Probar la API

```bash
# Health check
curl http://localhost:3001/health

# Debería responder:
# {"status":"ok","timestamp":"..."}
```

---

## 🐳 Desarrollo con Docker (Opcional)

Si prefieres usar PostgreSQL local en lugar de Railway:

```bash
# Iniciar PostgreSQL + Redis locales
docker-compose up -d

# Actualizar .env para usar la BD local:
# DATABASE_URL="postgresql://vetlify:vetlify_dev_2024@localhost:5432/vetlify_dev"

# Ejecutar migraciones en BD local
npm run prisma:push

# Seed
npm run db:seed

# Iniciar backend
npm run dev
```

**Gestionar base de datos:**
- Adminer: `http://localhost:8080` (GUI para la BD)
- Prisma Studio: `npm run prisma:studio` → `http://localhost:5555`

---

## 🧪 Testing

```bash
# Ejecutar tests (cuando se implementen en Fase 1)
npm test

# Watch mode
npm run test:watch
```

---

## 📚 Comandos Útiles

```bash
# Ver esquema de la BD en navegador
npm run prisma:studio

# Resetear BD (⚠️ BORRA TODO)
npm run db:reset

# Generar cliente Prisma (después de cambios en schema)
npm run prisma:generate

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Build para producción
npm run build

# Ejecutar producción
npm start
```

---

## 🔍 Verificar Instalación

### Checklist

- [ ] Node.js 18+ instalado (`node -v`)
- [ ] npm 9+ instalado (`npm -v`)
- [ ] Railway PostgreSQL creado
- [ ] `.env` configurado con DATABASE_URL
- [ ] Dependencias instaladas (`npm install`)
- [ ] Prisma Client generado (`npm run prisma:generate`)
- [ ] Migraciones ejecutadas (`npm run prisma:migrate`)
- [ ] Seed ejecutado (`npm run db:seed`)
- [ ] Backend corriendo (`npm run dev`)
- [ ] Health check OK (`curl localhost:3001/health`)

### Troubleshooting

**Error: "Can't reach database server"**
- Verifica que la DATABASE_URL sea correcta
- Asegúrate de que Railway no esté en sleep mode
- Verifica que tengas acceso a internet

**Error: "Environment variable not found: DATABASE_URL"**
- Asegúrate de que el archivo `.env` existe
- Verifica que la variable esté definida correctamente

**Error: "Prisma Client not generated"**
- Ejecuta `npm run prisma:generate`

**Error en migraciones:**
- Si es desarrollo, usa `npm run prisma:push` (más rápido)
- Si persiste, resetea: `npm run db:reset` (⚠️ borra datos)

---

## 📡 Endpoints Principales

Una vez iniciado, la API tiene ~84 endpoints. Algunos principales:

**Autenticación:**
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro

**Pacientes:**
- `GET /api/pacientes` - Listar pacientes
- `POST /api/pacientes` - Crear paciente
- `GET /api/pacientes/:id` - Ver paciente

**Citas:**
- `GET /api/citas` - Listar citas
- `POST /api/citas` - Crear cita

**Fichas Clínicas:**
- `GET /api/fichas` - Listar fichas
- `POST /api/fichas` - Crear ficha SOAP

**Hospitalización:**
- `GET /api/hospitalizaciones` - Listar hospitalizados
- `POST /api/hospitalizaciones` - Ingresar paciente

Ver documentación completa en Swagger (cuando se implemente en Fase 1):
`http://localhost:3001/api-docs`

---

## 🔐 Usuarios de Prueba (después del seed)

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@favet.cl | admin123 |
| Veterinario | vet@favet.cl | vet123 |
| Recepcionista | recep@favet.cl | recep123 |

---

## 🌐 Deploy a Railway (Backend)

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Linkar proyecto
railway link

# 4. Deploy
railway up

# 5. Ver logs
railway logs
```

Variables de entorno en Railway:
- Railway > Project > Variables
- Copiar todas las del archivo `.env.development`
- Actualizar `DATABASE_URL` (Railway la provee automáticamente)

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `npm run dev` (modo verbose)
2. Verifica el archivo `.env`
3. Consulta Prisma docs: https://www.prisma.io/docs
4. Revisa Railway status: https://railway.app/

---

**Última actualización:** 2025-12-01
**Versión:** 1.0.0
