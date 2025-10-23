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

# Copiar script de inicialización
COPY scripts/init.sh ./scripts/init.sh
RUN chmod +x ./scripts/init.sh

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Comando para iniciar la aplicación con soporte para MySQL y PostgreSQL
CMD ["sh", "-c", "echo 'Verificando base de datos...' && if [[ \"$DATABASE_URL\" == *\"postgresql\"* ]]; then echo 'PostgreSQL detectado, migrando...' && npx prisma generate && npx prisma db push --accept-data-loss && echo 'Migración PostgreSQL completada'; else echo 'MySQL detectado, esperando conexión...' && until nc -z mysql 3306; do sleep 1; done && echo 'MySQL disponible, sincronizando schema...' && npx prisma generate && npx prisma db push --accept-data-loss && echo 'Schema MySQL sincronizado'; fi && echo 'Iniciando servidor...' && node dist/server.js"]
