# Backend Dockerfile para Dannig Óptica
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Dependencias del sistema requeridas por Prisma y espera de DB
RUN apk add --no-cache openssl libc6-compat netcat-openbsd curl

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar solo fuentes necesarias para build
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generar cliente de Prisma
RUN npx prisma generate

# Compilar TypeScript a dist
RUN npm run build

# Copiar scripts de inicialización
COPY scripts/init.sh ./scripts/init.sh
COPY scripts/start-production.sh ./scripts/start-production.sh
COPY scripts/validate-env.sh ./scripts/validate-env.sh
RUN chmod +x ./scripts/init.sh ./scripts/start-production.sh ./scripts/validate-env.sh

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Comando de inicialización simplificado
CMD echo '🚀 Iniciando DannigOptica Backend...' && \
    echo '🔍 Validando variables de entorno básicas...' && \
    if [ -z "$DATABASE_URL" ]; then echo '❌ ERROR: DATABASE_URL no está configurada' && exit 1; else echo '✅ DATABASE_URL configurada'; fi && \
    if [ -z "$NODE_ENV" ]; then echo '⚠️ WARNING: NODE_ENV no está configurada, usando development' && export NODE_ENV=development; else echo '✅ NODE_ENV: '$NODE_ENV; fi && \
    if [ -z "$PORT" ]; then echo '⚠️ WARNING: PORT no está configurada, usando 3001' && export PORT=3001; else echo '✅ PORT: '$PORT; fi && \
    if [ -z "$JWT_SECRET" ]; then echo '❌ ERROR: JWT_SECRET no está configurada' && exit 1; else echo '✅ JWT_SECRET configurada'; fi && \
    echo '🎯 Variables de entorno básicas validadas' && \
    echo '📊 Iniciando aplicación Node.js...' && \
    node dist/server.js
