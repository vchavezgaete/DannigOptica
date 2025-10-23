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

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Comando de inicialización simplificado
CMD echo '🚀 Iniciando DannigOptica Backend...' && \
    echo '📊 Verificando configuración de base de datos...' && \
    if [ "$NODE_ENV" = "production" ] || echo "$DATABASE_URL" | grep -q "postgresql"; then \
        echo '🐘 PostgreSQL detectado en producción' && \
        echo '⚙️ Generando cliente Prisma para PostgreSQL...' && \
        npx prisma generate --schema=./prisma/schema.prisma && \
        echo '🔄 Aplicando migraciones a PostgreSQL...' && \
        npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma && \
        echo '✅ Migración PostgreSQL completada exitosamente'; \
    else \
        echo '🐬 MySQL detectado en desarrollo' && \
        echo '⚙️ Generando cliente Prisma para MySQL...' && \
        npx prisma generate --schema=./prisma/schema.prisma && \
        echo '🔄 Sincronizando schema MySQL...' && \
        npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma && \
        echo '✅ Schema MySQL sincronizado exitosamente'; \
    fi && \
    echo '🎯 Iniciando servidor Node.js...' && \
    node dist/server.js
