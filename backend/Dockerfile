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
RUN chmod +x ./scripts/init.sh ./scripts/start-production.sh

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Usar script de inicialización robusto
CMD ["./scripts/start-production.sh"]
