# Dockerfile para Vetlify Backend
# Optimizado para producción

# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:18-alpine AS dependencies

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instalar dependencias (incluyendo devDependencies para build)
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependencias desde stage anterior
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# ============================================
# STAGE 3: Runner (Producción)
# ============================================
FROM node:18-alpine AS runner

WORKDIR /app

# Instalar solo dependencias de producción
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copiar Prisma schema y generar cliente
COPY prisma ./prisma/
RUN npx prisma generate

# Copiar código compilado desde builder
COPY --from=builder /app/dist ./dist

# Crear directorios necesarios
RUN mkdir -p uploads pdfs logs

# Usuario no privilegiado
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "dist/server.js"]
