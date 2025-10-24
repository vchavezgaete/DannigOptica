# 🚨 PROBLEMA CRÍTICO: Variables de Entorno en Railway

## ⚠️ Error Identificado

Railway está concatenando todas las variables de entorno en una sola línea:

```
DATABASE_URL=mysql://root:password@host:port/database NODE_ENV=production PORT=3001 JWT_SECRET=... ADMIN_NAME=Admin...
```

**Esto causa:** Error P1001 - Can't reach database server

## 🔧 Solución Temporal Implementada

El Dockerfile ahora incluye limpieza automática de la DATABASE_URL para extraer solo la parte de la base de datos.

## 📋 Configuración Correcta en Railway

### 1. Variables de Entorno Individuales

En Railway Dashboard, configurar cada variable **POR SEPARADO**:

```
DATABASE_URL = mysql://usuario:password@host:3306/database
NODE_ENV = production
PORT = 3001
JWT_SECRET = d0e7a1e93a8d71b37105ffa0038035c5ed9f33d5ff3c57ea0c4d101ac6e8ebbd08743882ae2f8b747a7eaeef8d7b2891b62c9606c5237a8b1ed8c0f6b0af182c
ADMIN_NAME = Admin
ADMIN_EMAIL = admin@dannig.local
ADMIN_PASSWORD = admin123
CAPTADOR_NAME = Captador
CAPTADOR_EMAIL = captador@dannig.local
CAPTADOR_PASSWORD = captador123
OFTALMOLOGO_NAME = Dr. Oftalmólogo
OFTALMOLOGO_EMAIL = oftalmologo@dannig.local
OFTALMOLOGO_PASSWORD = oftalmologo123
```

### 2. NO Usar Variables Múltiples en Una Línea

❌ **INCORRECTO:**
```
DATABASE_URL=mysql://... NODE_ENV=production PORT=3001
```

✅ **CORRECTO:**
```
DATABASE_URL=mysql://usuario:password@host:3306/database
NODE_ENV=production
PORT=3001
```

## 🛠️ Pasos para Corregir en Railway

1. **Ir a Railway Dashboard**
2. **Seleccionar el servicio backend**
3. **Ir a Variables**
4. **Eliminar todas las variables existentes**
5. **Agregar cada variable individualmente:**
   - Click "New Variable"
   - Key: `DATABASE_URL`
   - Value: `mysql://usuario:password@host:3306/database`
   - Click "Add"
   - Repetir para cada variable

## 🔍 Verificación

Los logs deberían mostrar:

```
📋 DATABASE_URL original: mysql://usuario:password@host:3306/database
🔧 Extrayendo URL limpia de DATABASE_URL...
📋 DATABASE_URL limpia: mysql://usuario:password@host:3306/database
✅ DATABASE_URL ya tiene el protocolo correcto
✅ DATABASE_URL validada correctamente
🐬 MySQL detectado
```

## 🆘 Si el Problema Persiste

1. **Verificar que la base de datos MySQL esté creada**
2. **Confirmar que la URL de conexión sea correcta**
3. **Revisar que no haya espacios extra en las variables**
4. **Usar el comando Railway CLI:**

```bash
railway variables set DATABASE_URL="mysql://usuario:password@host:3306/database"
railway variables set NODE_ENV="production"
railway variables set PORT="3001"
```

## 📞 Soporte

Si el problema persiste después de seguir estos pasos, el issue está en la configuración de Railway, no en el código.
