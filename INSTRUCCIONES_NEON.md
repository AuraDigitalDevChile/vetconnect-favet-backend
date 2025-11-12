# 🔧 Cómo Obtener la DATABASE_URL de Neon

## Pasos para configurar la conexión a Neon:

### 1. Acceder al Dashboard de Neon
Ve a: https://console.neon.tech/app/projects/royal-frog-16928978?branchId=br-holy-frost-ahqvic5r

### 2. Encontrar la Connection String

En el dashboard verás una sección llamada **"Connection Details"** o **"Connection string"**

Debería verse algo así:

```
postgresql://neondb_owner:npg_xxx...@ep-holy-frost-ahqvic5r.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. Copiar y Configurar

Opción A - Copiar directamente:
```bash
# En el archivo .env, reemplaza la línea DATABASE_URL con tu conexión:
DATABASE_URL="postgresql://tu-usuario:tu-password@tu-host.neon.tech/tu-database?sslmode=require"
```

Opción B - Usar variables separadas (más seguro):
```bash
# Si Neon te da las credenciales por separado:
PGHOST='ep-holy-frost-ahqvic5r.us-east-2.aws.neon.tech'
PGDATABASE='neondb'
PGUSER='neondb_owner'
PGPASSWORD='tu-password-aqui'

# Entonces DATABASE_URL se construye así:
DATABASE_URL="postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require"
```

### 4. Verificar la Conexión

Una vez configurado el .env, ejecuta:

```bash
# Generar cliente Prisma
npm run prisma:generate

# Verificar conexión
npx prisma db pull

# Aplicar migraciones (si es necesario)
npm run prisma:migrate

# Cargar datos de prueba
npm run db:seed
```

### 5. Iniciar el Servidor

```bash
npm run dev
```

El servidor debería iniciar en http://localhost:3000

### 6. Probar Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Login (para obtener token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vetconnect.cl",
    "password": "admin123"
  }'

# Listar pacientes (usando el token del login)
curl http://localhost:3000/api/pacientes \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 🆘 Solución de Problemas

### Error: "P1001: Can't reach database server"
- Verifica que la DATABASE_URL esté correcta
- Asegúrate de tener `?sslmode=require` al final
- Verifica tu conexión a Internet

### Error: "Table does not exist"
- Ejecuta: `npm run prisma:migrate`
- O: `npm run prisma:push`

### Error: "Invalid token"
- Verifica que JWT_SECRET en .env esté configurado
- Haz login nuevamente para obtener un token fresco

---

## 📝 Notas Importantes

1. **Nunca** compartas tu DATABASE_URL en repositorios públicos
2. El archivo `.env` está en `.gitignore` por seguridad
3. Usa `.env.example` como plantilla para otros desarrolladores
4. En producción, usa variables de entorno del hosting (Vercel, Railway, etc.)

---

## 🔗 Enlaces Útiles

- Neon Dashboard: https://console.neon.tech/app/projects/royal-frog-16928978
- Prisma Studio (para ver la DB): `npx prisma studio`
- Documentación Neon: https://neon.tech/docs
- Documentación Prisma: https://www.prisma.io/docs
