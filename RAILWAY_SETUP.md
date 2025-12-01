# 🚂 Railway Setup - Guía Rápida

## Paso 1: Crear Base de Datos en Railway

1. Ve a [railway.app](https://railway.app/) y haz login (GitHub o email)

2. Click en **"New Project"**

3. Selecciona **"Provision PostgreSQL"**

4. Espera ~30 segundos a que se aprovisione

5. Tu base de datos está lista ✅

---

## Paso 2: Obtener la Connection String

1. En Railway, click en tu base de datos **PostgreSQL**

2. Ve a la pestaña **"Connect"**

3. Busca **"Postgres Connection URL"** y haz click en el ícono de copiar

4. La URL se verá así:
   ```
   postgresql://postgres:AbCd1234EfGh@containers-us-west-123.railway.app:5432/railway
   ```

---

## Paso 3: Configurar el Backend

1. Navega a la carpeta del backend:
   ```bash
   cd C:\Aura Digital\Proyectos\Vetlify\vetlify-backend
   ```

2. Crea el archivo `.env` copiando `.env.development`:
   ```bash
   copy .env.development .env
   ```

3. Abre `.env` en tu editor y actualiza `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://postgres:TU_PASSWORD@containers-us-west-XXX.railway.app:5432/railway?sslmode=require"
   ```

   ⚠️ **Pega tu URL de Railway aquí**

4. Asegúrate de que `DIRECT_URL` apunte a la misma URL:
   ```env
   DIRECT_URL="${DATABASE_URL}"
   ```

---

## Paso 4: Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias y generará el Prisma Client automáticamente.

---

## Paso 5: Ejecutar Migraciones

```bash
# Generar Prisma Client (si no se generó automáticamente)
npm run prisma:generate

# Ejecutar migraciones (crea todas las 45 tablas)
npm run prisma:push
```

**⚠️ Nota:** Usamos `prisma:push` en lugar de `prisma:migrate` para desarrollo rápido.

Deberías ver algo como:
```
✔ Generated Prisma Client
🚀  Your database is now in sync with your Prisma schema.
```

---

## Paso 6: Cargar Datos de Prueba (Seed)

```bash
npm run db:seed
```

Esto creará:
- ✅ 3 centros FAVET (La Pintana, Oncología, Especialidades)
- ✅ Usuarios de prueba (admin, veterinarios, recepcionistas)
- ✅ Pacientes demo
- ✅ Boxes, horarios, citas de ejemplo

Salida esperada:
```
🌱 Iniciando seed de base de datos...
📍 Creando centros veterinarios FAVET...
✅ 3 centros FAVET creados
👥 Creando usuarios...
✅ Usuarios creados
🐕 Creando pacientes demo...
✅ Seed completado
```

---

## Paso 7: Iniciar el Backend

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3001`

Salida esperada:
```
🚀 Servidor iniciado en puerto 3001
✅ Base de datos conectada
```

---

## Paso 8: Verificar que Funciona

Abre una nueva terminal y ejecuta:

```bash
curl http://localhost:3001/health
```

Deberías ver:
```json
{"status":"ok","timestamp":"2025-12-01T..."}
```

---

## ✅ Checklist Final

- [ ] Railway PostgreSQL creado
- [ ] Connection URL copiada
- [ ] Archivo `.env` configurado con DATABASE_URL
- [ ] `npm install` ejecutado
- [ ] `npm run prisma:push` completado (45 tablas creadas)
- [ ] `npm run db:seed` ejecutado (datos cargados)
- [ ] `npm run dev` corriendo sin errores
- [ ] `curl localhost:3001/health` responde OK

---

## 🎯 Usuarios de Prueba Creados

Después del seed, puedes hacer login con:

| Rol | Email | Password |
|-----|-------|----------|
| **Admin** | admin@favet.cl | admin123 |
| **Veterinaria** | dra.serrat@favet.cl | admin123 |
| **Cirujano** | dr.reyes@favet.cl | admin123 |
| **Anestesista** | dra.lira@favet.cl | admin123 |
| **Recepcionista** | daniela.recepcion@favet.cl | admin123 |

---

## 🔧 Comandos Útiles

```bash
# Ver la BD en navegador (Prisma Studio)
npm run prisma:studio
# Abre http://localhost:5555

# Reiniciar todo (⚠️ BORRA TODOS LOS DATOS)
npm run db:reset

# Ver logs en tiempo real
npm run dev  # Ya incluye hot reload
```

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- Verifica que la URL esté correcta (sin espacios extra)
- Asegúrate de tener conexión a internet
- Railway puede tardar unos segundos en despertar si está en sleep mode

### Error: "P1001: Can't reach database"
- Revisa que `sslmode=require` esté en la URL
- Verifica que no haya firewall bloqueando el puerto 5432

### Error: "Environment variable not found: DATABASE_URL"
- Asegúrate de que el archivo `.env` está en la raíz del proyecto backend
- Reinicia la terminal después de crear el `.env`

### Error: "Unique constraint failed"
- Ya hiciste seed antes. Ejecuta `npm run db:reset` y luego `npm run db:seed`

---

## 📊 Verificar Datos en Railway

1. Railway > PostgreSQL > **Connect**
2. Copia el **PSQL Command**
3. Pega en tu terminal:
   ```bash
   psql postgresql://postgres:PASSWORD@...
   ```
4. Consulta:
   ```sql
   \dt  -- Ver tablas
   SELECT * FROM centros;  -- Ver centros
   SELECT * FROM usuarios;  -- Ver usuarios
   ```

O usa **Prisma Studio**:
```bash
npm run prisma:studio
```

---

## 🚀 Próximo Paso

Una vez que el backend esté corriendo:
1. Ir a `PLAN_DE_ACCION_VETLIFY.md`
2. Continuar con **Fase 1 > Tareas Frontend**
3. Conectar el frontend React a este backend

---

**✅ Backend configurado exitosamente con Railway!**
