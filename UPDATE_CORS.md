# 🚨 CONFIGURACIÓN URGENTE DE CORS

## El frontend NO muestra datos porque falta configurar CORS

### ✅ SOLUCIÓN RÁPIDA (2 minutos)

1. Ve a: **https://dashboard.render.com**
2. Selecciona: **vetconnect-favet-backend**
3. Click en: **Environment** (menú lateral izquierdo)
4. Busca la variable: **CORS_ORIGIN**
5. Cambia el valor a:

```
http://localhost:8080,http://localhost:5173,http://localhost:3000,https://vetconnect-favet-demo.pages.dev
```

6. Click: **Save Changes**
7. Render automáticamente hace redeploy (~1-2 minutos)

### ⏱️ Después de guardar:

- Espera 1-2 minutos
- Refresca: https://vetconnect-favet-demo.pages.dev
- Login: `admin@vetconnect.cl` / `admin123`
- ✅ Deberías ver todos los datos

### 📊 Datos disponibles:

- 3 Centros veterinarios
- 7 Usuarios (diferentes roles)
- 5 Tutores
- 8 Pacientes con historiales

### 🔑 Credenciales de Demo:

```
ADMIN (acceso total):
Email: admin@vetconnect.cl
Password: admin123

VETERINARIA:
Email: dra.rodriguez@vetconnect.cl
Password: admin123

RECEPCIONISTA:
Email: sofia.recepcion@vetconnect.cl
Password: admin123
```

---

## 🐛 Si después de esto no funciona:

1. Abre DevTools (F12) en el navegador
2. Ve a Console
3. Busca errores de CORS
4. Copia el error y busca ayuda

## ✅ Verificación rápida:

```bash
curl https://vetconnect-favet-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://vetconnect-favet-demo.pages.dev" \
  -d '{"email":"admin@vetconnect.cl","password":"admin123"}'
```

Debe devolver un token JWT, no un error CORS.
