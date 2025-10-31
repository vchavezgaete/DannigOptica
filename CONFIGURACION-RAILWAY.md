# Configuracion de Variables de Entorno en Railway

## Variables Requeridas

Para que la aplicacion funcione correctamente en Railway, debes configurar las siguientes variables de entorno:

### 1. DATABASE_URL (Requerida)

**Como configurarla:**

1. En Railway Dashboard, ve a tu proyecto "DannigOptica"
2. Selecciona la pestaña "Variables"
3. Agrega una nueva variable:
   - **Nombre:** `DATABASE_URL`
   - **Valor:** La URL de conexion a tu base de datos MySQL
   
**Formato de DATABASE_URL:**
```
mysql://usuario:password@host:puerto/nombre_database
```

**Si usas MySQL de Railway:**
- Railway proporciona automaticamente `MYSQLDATABASE_URL` o similar
- Puedes copiar esa variable o crear `DATABASE_URL` apuntando a la misma base de datos

**Ejemplo:**
```
mysql://root:tu_password@containers-us-west-xxx.railway.app:3306/railway
```

### 2. JWT_SECRET (Requerida)

**Como configurarla:**

1. En Railway Dashboard, ve a "Variables"
2. Agrega una nueva variable:
   - **Nombre:** `JWT_SECRET`
   - **Valor:** Una cadena aleatoria y segura (minimo 32 caracteres recomendado)

**Ejemplo de generacion de JWT_SECRET:**
```bash
# En tu terminal local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Ejemplo de valor:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 3. Variables Opcionales para Notificaciones

Si deseas que el sistema de alertas envie emails, agrega:

- **SMTP_HOST:** Servidor SMTP (ej: `smtp.gmail.com`)
- **SMTP_PORT:** Puerto SMTP (ej: `587`)
- **SMTP_USER:** Usuario SMTP
- **SMTP_PASSWORD:** Contrasena SMTP
- **SMTP_FROM:** Email remitente (ej: `noreply@dannig.cl`)

## Verificacion

Despues de configurar las variables:

1. Reinicia el servicio en Railway (Settings > Deployments > Redeploy)
2. Revisa los logs para verificar que no haya errores
3. El healthcheck en `/health` deberia responder correctamente

## Notas Importantes

- Railway inyecta automaticamente la variable `PORT`, no necesitas configurarla
- `NODE_ENV` se establece como `production` en el Dockerfile
- Las variables son sensibles, no las compartas publicamente
- Si cambias `DATABASE_URL`, necesitaras ejecutar migraciones de Prisma

