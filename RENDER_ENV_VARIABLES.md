# 🔧 Variables de Entorno para Render

## Backend (vetconnect-favet-backend)

Configurar estas variables en: **Render Dashboard → Web Service → Environment**

```bash
# ==========================================
# BASE DE DATOS POSTGRESQL (NEON)
# ==========================================
DATABASE_URL=postgresql://neondb_owner:npg_xenQDMO7G9BY@ep-young-water-ahygp2on-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# ==========================================
# SERVIDOR
# ==========================================
PORT=3000
NODE_ENV=production

# ==========================================
# AUTENTICACIÓN JWT
# ==========================================
JWT_SECRET=vetconnect-favet-jwt-secret-super-seguro-2025
JWT_EXPIRES_IN=7d

# ==========================================
# CORS - IMPORTANTE: Incluir el frontend
# ==========================================
CORS_ORIGIN=http://localhost:8080,http://localhost:5173,http://localhost:3000,https://vetconnect-favet-demo.pages.dev

# ==========================================
# RATE LIMITING
# ==========================================
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# ==========================================
# LOGS
# ==========================================
LOG_LEVEL=info

# ==========================================
# FEATURES FLAGS
# ==========================================
ENABLE_TELEMEDICINE=true
ENABLE_ONLINE_BOOKING=true
ENABLE_WHATSAPP_NOTIFICATIONS=false
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_SII_INTEGRATION=false
```

---

## Frontend (vetconnect-favet-demo)

### Opción 1: Configurar en Cloudflare Pages

**Dashboard → Settings → Environment Variables**

```bash
VITE_API_URL=https://vetconnect-favet-backend.onrender.com
VITE_APP_URL=https://vetconnect-favet-demo.pages.dev
VITE_APP_NAME=VetConnect FAVET
VITE_ENV=production
```

### Opción 2: Usar archivo .env (ya configurado)

El archivo `.env` ya está actualizado con los valores correctos y se commitea al repo. Cloudflare Pages lo usará automáticamente durante el build.

---

## 🔄 Cómo Aplicar los Cambios

### Backend en Render:

1. Ve a: https://dashboard.render.com
2. Selecciona el servicio `vetconnect-favet-backend`
3. Ve a **Environment** (menú lateral)
4. Haz clic en **Add Environment Variable**
5. Agrega cada variable de la lista arriba
6. Haz clic en **Save Changes**
7. Render automáticamente hará redeploy

### Frontend en Cloudflare Pages:

**Opción automática (recomendada):**
- Ya está configurado en el archivo `.env` del repo
- Solo espera a que termine el deploy actual (~2-5 min)

**Opción manual (si lo prefieres):**
1. Ve a: https://dash.cloudflare.com
2. Selecciona **Pages**
3. Selecciona tu proyecto `vetconnect-favet-demo`
4. Ve a **Settings → Environment variables**
5. Agrega las variables de producción
6. Haz un nuevo deploy

---

## ✅ Verificación

Después de configurar todo:

```bash
# Test backend
curl https://vetconnect-favet-backend.onrender.com/api/auth/login

# Test frontend
# Abre: https://vetconnect-favet-demo.pages.dev
# Login: admin@vetconnect.cl / admin123
```

---

## 🔐 Credenciales de Demo

**Admin:**
- Email: `admin@vetconnect.cl`
- Password: `admin123`

**Veterinario:**
- Email: `dra.rodriguez@vetconnect.cl`
- Password: `admin123`

**Recepcionista:**
- Email: `sofia.recepcion@vetconnect.cl`
- Password: `admin123`
