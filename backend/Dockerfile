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

# Comando de inicialización robusto integrado
CMD ["sh", "-c", "echo '🚀 Iniciando DannigOptica Backend...' && echo '📊 Verificando configuración de base de datos...' && if [[ \"$DATABASE_URL\" == *\"postgresql\"* ]] || [[ \"$NODE_ENV\" == \"production\" ]]; then echo '🐘 PostgreSQL detectado en producción' && echo '⚙️ Generando cliente Prisma para PostgreSQL...' && npx prisma generate --schema=./prisma/schema.prisma && echo '🔄 Aplicando migraciones a PostgreSQL...' && for i in {1..3}; do echo \"Intento \$i de migración...\"; if npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma; then echo '✅ Migración PostgreSQL completada exitosamente'; break; else echo \"❌ Intento \$i falló, reintentando...\"; sleep 5; fi; done; else echo '🐬 MySQL detectado en desarrollo' && echo '⏳ Intentando conectar a MySQL...' && timeout 30 sh -c 'until nc -z mysql 3306; do echo \"⏳ Esperando MySQL...\"; sleep 2; done' && echo '✅ MySQL disponible' && echo '⚙️ Generando cliente Prisma para MySQL...' && npx prisma generate --schema=./prisma/schema.prisma && echo '🔄 Sincronizando schema MySQL...' && npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma && echo '✅ Schema MySQL sincronizado exitosamente'; fi && echo '🎯 Iniciando servidor Node.js...' && node dist/server.js"]
