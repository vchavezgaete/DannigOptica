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

# Comando de inicialización con validación integrada
CMD echo '🚀 Iniciando DannigOptica Backend...' && \
    echo '🔧 Verificando y corrigiendo DATABASE_URL...' && \
    if [ -z "$DATABASE_URL" ]; then echo '❌ ERROR: DATABASE_URL no está configurada' && exit 1; fi && \
    echo '📋 DATABASE_URL original: '$DATABASE_URL && \
    echo '🔧 Extrayendo URL limpia de DATABASE_URL...' && \
    export DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/DATABASE_URL=//' | sed 's/ NODE_ENV.*//' | sed 's/ PORT.*//' | sed 's/ JWT_SECRET.*//' | sed 's/ ADMIN_NAME.*//' | sed 's/ ADMIN_EMAIL.*//' | sed 's/ ADMIN_PASSWORD.*//' | sed 's/ CAPTADOR_NAME.*//' | sed 's/ CAPTADOR_EMAIL.*//' | sed 's/ CAPTADOR_PASSWORD.*//' | sed 's/ OFTALMOLOGO_NAME.*//' | sed 's/ OFTALMOLOGO_EMAIL.*//' | sed 's/ OFTALMOLOGO_PASSWORD.*//') && \
    echo '📋 DATABASE_URL limpia: '$DATABASE_URL && \
    if [[ "$DATABASE_URL" == mysql://* ]]; then echo '✅ DATABASE_URL ya tiene el protocolo correcto'; \
    elif [[ "$DATABASE_URL" == *"mysql"* ]]; then echo '🔧 Corrigiendo DATABASE_URL...' && export DATABASE_URL="mysql://$DATABASE_URL" && echo '✅ DATABASE_URL corregida: '$DATABASE_URL; \
    elif [[ "$DATABASE_URL" == *"postgresql"* ]] || [[ "$DATABASE_URL" == *"postgres"* ]]; then echo '❌ ERROR: Se requiere MySQL, pero se detectó PostgreSQL. En Railway Dashboard, crear una base de datos MySQL específicamente' && exit 1; \
    else echo '❌ ERROR: DATABASE_URL no tiene un formato reconocido. Formato esperado: mysql://usuario:password@host:port/database' && exit 1; fi && \
    echo '✅ DATABASE_URL validada correctamente' && \
    echo '🔍 Validando variables de entorno...' && \
    if [ -z "$DATABASE_URL" ]; then echo '❌ ERROR: DATABASE_URL no está configurada' && exit 1; else echo '✅ DATABASE_URL configurada'; fi && \
    if [ -z "$NODE_ENV" ]; then echo '⚠️ WARNING: NODE_ENV no está configurada, usando development' && export NODE_ENV=development; else echo '✅ NODE_ENV: '$NODE_ENV; fi && \
    if [ -z "$PORT" ]; then echo '⚠️ WARNING: PORT no está configurada, usando 3001' && export PORT=3001; else echo '✅ PORT: '$PORT; fi && \
    if [ -z "$JWT_SECRET" ]; then echo '❌ ERROR: JWT_SECRET no está configurada' && exit 1; else echo '✅ JWT_SECRET configurada'; fi && \
    echo '🎯 Todas las variables de entorno están configuradas correctamente' && \
    echo '📊 Verificando configuración de base de datos...' && \
    if echo "$DATABASE_URL" | grep -q "postgresql"; then \
        echo '🐘 PostgreSQL detectado' && \
        echo '⚙️ Generando cliente Prisma para PostgreSQL...' && \
        npx prisma generate --schema=./prisma/schema.prisma && \
        echo '🔄 Aplicando migraciones a PostgreSQL...' && \
        npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma && \
        echo '✅ Migración PostgreSQL completada exitosamente'; \
    else \
        echo '🐬 MySQL detectado' && \
        echo '⚙️ Generando cliente Prisma para MySQL...' && \
        npx prisma generate --schema=./prisma/schema.prisma && \
        echo '🔄 Sincronizando schema MySQL...' && \
        npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma && \
        echo '✅ Schema MySQL sincronizado exitosamente'; \
    fi && \
    echo '🎯 Iniciando servidor Node.js...' && \
    node dist/server.js
