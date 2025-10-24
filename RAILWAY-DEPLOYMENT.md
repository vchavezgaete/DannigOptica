# 🚀 Deployment en Railway - DannigOptica

## ⚠️ Problema Común: DATABASE_URL Incorrecta

Si ves este error:
```
Error: Prisma schema validation - (get-config wasm)
Error code: P1012
error: Error validating datasource `db`: the URL must start with the protocol `mysql://`.
```

**Causa:** Railway está proporcionando una `DATABASE_URL` sin el protocolo `mysql://` correcto.

## 🔧 Solución Automática

El proyecto ahora incluye un script automático (`fix-database-url.sh`) que corrige este problema automáticamente.

## 📋 Pasos para Deploy en Railway

### 1. Crear Proyecto en Railway
1. Ve a [railway.app](https://railway.app)
2. Conecta tu cuenta de GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Selecciona `DannigOptica`

### 2. Configurar Base de Datos MySQL
**⚠️ IMPORTANTE: Debe ser MySQL, NO PostgreSQL**

1. En Railway Dashboard, click "New" → "Database"
2. **Selecciona "MySQL"** (no PostgreSQL)
3. Copia la `DATABASE_URL` generada
4. Debe verse así: `mysql://usuario:password@host:3306/database`

### 3. Configurar Backend Service
1. Railway detectará automáticamente el `backend/Dockerfile`
2. En Variables de Entorno, agregar:

```env
DATABASE_URL=mysql://usuario:password@host:3306/database
NODE_ENV=production
PORT=3001
JWT_SECRET=d0e7a1e93a8d71b37105ffa0038035c5ed9f33d5ff3c57ea0c4d101ac6e8ebbd08743882ae2f8b747a7eaeef8d7b2891b62c9606c5237a8b1ed8c0f6b0af182c
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@dannig.local
ADMIN_PASSWORD=admin123
CAPTADOR_NAME=Captador
CAPTADOR_EMAIL=captador@dannig.local
CAPTADOR_PASSWORD=captador123
OFTALMOLOGO_NAME=Dr. Oftalmólogo
OFTALMOLOGO_EMAIL=oftalmologo@dannig.local
OFTALMOLOGO_PASSWORD=oftalmologo123
```

### 4. Configurar Frontend Service
1. Crear nuevo servicio para el frontend
2. Usar `frontend/Dockerfile`
3. Variables de entorno:

```env
VITE_API_URL=https://tu-backend-url.railway.app
```

## 🔍 Verificación del Deploy

### Logs Esperados del Backend:
```
🚀 Iniciando DannigOptica Backend...
🔧 Verificando y corrigiendo DATABASE_URL...
✅ DATABASE_URL ya tiene el protocolo correcto
🔍 Validando variables de entorno...
✅ DATABASE_URL configurada
✅ NODE_ENV: production
✅ PORT: 3001
✅ JWT_SECRET configurada
🎯 Todas las variables de entorno están configuradas correctamente
📊 Verificando configuración de base de datos...
🐬 MySQL detectado
⚙️ Generando cliente Prisma para MySQL...
🔄 Sincronizando schema MySQL...
✅ Schema MySQL sincronizado exitosamente
🎯 Iniciando servidor Node.js...
🚀 API running on https://tu-backend-url.railway.app
```

## 🆘 Troubleshooting

### Error: "URL must start with mysql://"
**Solución:** El script `fix-database-url.sh` se ejecuta automáticamente y corrige este problema.

### Error: "Cannot connect to database"
**Verificar:**
1. La base de datos MySQL está creada y corriendo
2. La `DATABASE_URL` tiene el formato correcto
3. Las credenciales son correctas
4. El firewall permite conexiones

### Error: "PostgreSQL detected"
**Causa:** Railway creó PostgreSQL en lugar de MySQL
**Solución:** 
1. Eliminar la base de datos PostgreSQL
2. Crear nueva base de datos MySQL
3. Actualizar la `DATABASE_URL`

## 📞 Credenciales de Acceso

Una vez desplegado, puedes acceder con:

### Admin
- **Email:** admin@dannig.local
- **Password:** admin123

### Captador
- **Email:** captador@dannig.local
- **Password:** captador123

### Oftalmólogo
- **Email:** oftalmologo@dannig.local
- **Password:** oftalmologo123

## 🔄 CI/CD Automático

Railway incluye CI/CD automático:
- ✅ Deploy automático en cada push a `main`
- ✅ Preview deployments en PRs
- ✅ Rollback con un click
- ✅ Build logs en tiempo real

## 💰 Costos

- **MySQL Database:** ~$5/mes
- **Backend Service:** Gratis (con límites)
- **Frontend Service:** Gratis (con límites)

**Total estimado:** ~$5/mes para producción completa.
