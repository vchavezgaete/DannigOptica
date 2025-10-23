# Guía de Configuración de DATABASE_URL para Deployment

## Problema Identificado
Error: `DATABASE_URL` está vacía durante el deployment, causando fallo en Prisma.

## Soluciones por Plataforma

### Render.com
1. **Verificar Blueprint**: El `render.yaml` está configurado correctamente
2. **Crear Base de Datos**: Asegúrate de que la BD `dannig-db` se cree primero
3. **Orden de Deployment**: La BD debe estar lista antes que el backend

**Pasos manuales si el blueprint falla:**
1. Ve a Render Dashboard
2. Crea una nueva PostgreSQL Database
3. Nombre: `dannig-db`
4. Plan: `Free` (90 días gratis)
5. Copia la `External Database URL`
6. En el servicio backend, agrega variable:
   - Key: `DATABASE_URL`
   - Value: `postgresql://usuario:password@host:port/database`

### Railway
1. **Crear Base de Datos**:
   ```bash
   railway add postgresql
   ```
2. **Configurar Variables**:
   ```bash
   railway variables set DATABASE_URL=$DATABASE_URL
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=$(openssl rand -base64 32)
   ```

### Google Cloud Run
1. **Crear Cloud SQL**:
   ```bash
   gcloud sql instances create dannig-db --database-version=POSTGRES_13 --region=us-central1
   ```
2. **Configurar Secretos**:
   ```bash
   gcloud secrets create dannig-db-url --data-file=- <<< "postgresql://..."
   ```

## Validación Automática
El script `validate-env.sh` ahora verifica:
- ✅ `DATABASE_URL` no está vacía
- ✅ `NODE_ENV` está configurada
- ✅ `PORT` está configurada
- ✅ `JWT_SECRET` está configurada

## Troubleshooting

### Si DATABASE_URL sigue vacía:
1. **Verificar logs del deployment**
2. **Comprobar que la BD esté creada**
3. **Verificar permisos de conexión**
4. **Revisar configuración de red**

### Si la BD no se conecta:
1. **Verificar URL de conexión**
2. **Comprobar credenciales**
3. **Verificar firewall/red**
4. **Revisar logs de la BD**

## Comandos de Verificación

```bash
# Verificar variables en el contenedor
docker exec -it container_name env | grep DATABASE

# Probar conexión a BD
npx prisma db push --schema=./prisma/schema.prisma

# Verificar estado de la BD
npx prisma studio
```
