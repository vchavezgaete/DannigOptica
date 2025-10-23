# Deployment Configuration Guide
# Guía para resolver problemas de deployment

## Problemas Comunes y Soluciones

### 1. Error "service unavailable"
**Causa**: El health check está fallando o el servicio no responde a tiempo.

**Soluciones**:
- ✅ Aumentar `healthcheckTimeout` a 300 segundos
- ✅ Verificar que el endpoint `/health` responde correctamente
- ✅ Asegurar que las variables de entorno están configuradas

### 2. Error de base de datos
**Causa**: El backend está configurado para MySQL pero el deployment usa PostgreSQL.

**Soluciones**:
- ✅ Dockerfile actualizado para detectar automáticamente el tipo de BD
- ✅ Script de migración automática incluido
- ✅ Variables de entorno configuradas correctamente

### 3. Variables de entorno faltantes
**Causa**: Faltan configuraciones específicas para producción.

**Soluciones**:
- ✅ JWT_SECRET generado automáticamente
- ✅ Credenciales de usuarios configuradas
- ✅ NODE_ENV=production establecido

## Configuración por Plataforma

### Render.com
```yaml
# render.yaml ya configurado con:
- healthCheckTimeout: 300
- Variables de entorno completas
- Soporte para PostgreSQL
```

### Railway
```toml
# railway.toml ya configurado con:
- healthcheckTimeout: 300
- startCommand específico
- Variables de entorno básicas
```

### Google Cloud Run
```yaml
# cloudbuild.yaml ya configurado con:
- Timeout de 300s
- Secrets para variables sensibles
- Configuración de memoria y CPU
```

## Pasos para Deployment

1. **Subir cambios al repositorio**:
   ```bash
   git add .
   git commit -m "fix: Corregir configuración de deployment"
   git push origin main
   ```

2. **Configurar variables de entorno en la plataforma**:
   - `DATABASE_URL`: URL de la base de datos PostgreSQL
   - `JWT_SECRET`: Secreto para JWT (generado automáticamente)
   - `ADMIN_PASSWORD`: Contraseña del admin
   - `CAPTADOR_PASSWORD`: Contraseña del captador

3. **Verificar deployment**:
   - El health check debe responder en `/health`
   - El servicio debe estar disponible en el puerto configurado
   - Las migraciones de BD deben ejecutarse automáticamente

## Troubleshooting

Si el deployment sigue fallando:

1. **Verificar logs del servicio**:
   - Buscar errores de conexión a BD
   - Verificar que Prisma se ejecuta correctamente
   - Confirmar que el servidor inicia sin errores

2. **Probar health check manualmente**:
   ```bash
   curl https://tu-servicio.com/health
   ```

3. **Verificar variables de entorno**:
   - DATABASE_URL debe apuntar a PostgreSQL
   - JWT_SECRET debe estar configurado
   - NODE_ENV debe ser "production"
