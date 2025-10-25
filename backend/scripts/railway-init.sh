#!/bin/bash

# Script de inicialización para Railway deployment
set -e

echo "🚀 Iniciando DannigOptica Backend en Railway..."

# Verificar variables de entorno críticas
echo "🔍 Verificando variables de entorno..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurada"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ ERROR: JWT_SECRET no está configurada"
    exit 1
fi

echo "✅ Variables de entorno configuradas correctamente"

# Generar cliente de Prisma
echo "🔧 Generando cliente de Prisma..."
npx prisma generate

# Aplicar migraciones a la base de datos
echo "📊 Aplicando migraciones a la base de datos..."
npx prisma db push --accept-data-loss

echo "✅ Base de datos inicializada correctamente"

# Iniciar el servidor
echo "🚀 Iniciando servidor..."
exec npm start
