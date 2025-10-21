# 🐳 Docker Setup - Dannig Óptica

Este documento explica cómo usar Docker para ejecutar la aplicación Dannig Óptica.

## 📁 Estructura de Archivos Docker

```
DannigOptica/
├── docker-compose.yml          # Orquestación completa (recomendado)
├── backend/
│   ├── Dockerfile
│   ├── docker-compose.yml      # Solo backend + BD
│   └── .dockerignore
├── frontend/
│   ├── Dockerfile
│   ├── docker-compose.yml      # Solo frontend + BD
│   ├── nginx.conf
│   └── .dockerignore
└── infra/
    └── docker-compose.yml      # Solo infraestructura (MySQL + Adminer)
```

## 🚀 Opciones de Despliegue

### 1. **Despliegue Completo (Recomendado)**
Ejecuta toda la aplicación (Frontend + Backend + Base de datos):

```bash
# Construir y ejecutar todos los servicios
docker-compose up --build

# En modo detached (background)
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

**URLs disponibles:**
- 🌐 Frontend: http://localhost:5173
- 🔧 Backend API: http://localhost:3001
- 🗄️ Adminer: http://localhost:8080
- 🐬 MySQL: localhost:3307

### 2. **Solo Backend + Base de Datos**
Para desarrollo del backend:

```bash
cd backend
docker-compose up --build
```

**URLs disponibles:**
- 🔧 Backend API: http://localhost:3001
- 🗄️ Adminer: http://localhost:8080
- 🐬 MySQL: localhost:3307

### 3. **Solo Frontend + Base de Datos**
Para desarrollo del frontend (requiere backend externo):

```bash
cd frontend
docker-compose up --build
```

**URLs disponibles:**
- 🌐 Frontend: http://localhost:5173
- 🗄️ Adminer: http://localhost:8080
- 🐬 MySQL: localhost:3307

### 4. **Solo Infraestructura**
Para usar solo la base de datos:

```bash
cd infra
docker-compose up
```

## 🔧 Configuración

### Variables de Entorno

#### Backend
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=mysql://dannig:dannig@mysql:3306/dannig
JWT_SECRET=your_jwt_secret_here_change_in_production
```

#### Frontend
```env
VITE_API_URL=http://localhost:3001
```

### Base de Datos
- **Host**: `mysql` (dentro del contenedor) o `localhost:3307` (desde host)
- **Database**: `dannig`
- **Usuario**: `dannig`
- **Password**: `dannig`
- **Root Password**: `root`

## 🛠️ Comandos Útiles

### Gestión de Contenedores
```bash
# Ver contenedores en ejecución
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar un servicio
docker-compose restart backend

# Ejecutar comando en contenedor
docker-compose exec backend npm run prisma:generate
docker-compose exec backend npx prisma db push
```

### Gestión de Base de Datos
```bash
# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Generar cliente Prisma
docker-compose exec backend npx prisma generate

# Resetear base de datos
docker-compose exec mysql mysql -u root -proot -e "DROP DATABASE IF EXISTS dannig; CREATE DATABASE dannig;"
```

### Limpieza
```bash
# Detener y eliminar contenedores
docker-compose down

# Eliminar también volúmenes (¡CUIDADO! Elimina datos de BD)
docker-compose down -v

# Eliminar imágenes
docker-compose down --rmi all

# Limpieza completa del sistema Docker
docker system prune -a
```

## 🔒 Seguridad en Producción

### Cambios Necesarios para Producción:

1. **JWT Secret**: Cambiar `JWT_SECRET` por un valor seguro
2. **Passwords de BD**: Cambiar passwords por defecto
3. **Variables de Entorno**: Usar archivos `.env` para secrets
4. **HTTPS**: Configurar SSL/TLS
5. **Firewall**: Restringir puertos expuestos

### Ejemplo de .env para producción:
```env
# Backend
JWT_SECRET=super_secret_jwt_key_here
DATABASE_URL=mysql://user:password@mysql:3306/dannig_prod

# Frontend
VITE_API_URL=https://api.dannig.cl
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **Puerto ya en uso**:
   ```bash
   # Cambiar puertos en docker-compose.yml
   ports:
     - "3002:3001"  # Cambiar puerto host
   ```

2. **Base de datos no se conecta**:
   ```bash
   # Verificar que MySQL esté corriendo
   docker-compose ps mysql
   
   # Ver logs de MySQL
   docker-compose logs mysql
   ```

3. **Frontend no carga**:
   ```bash
   # Verificar que backend esté corriendo
   docker-compose ps backend
   
   # Verificar variable VITE_API_URL
   docker-compose exec frontend env | grep VITE
   ```

4. **Permisos de archivos**:
   ```bash
   # En Linux/Mac, puede necesitar cambiar permisos
   sudo chown -R $USER:$USER .
   ```

## 📊 Monitoreo

### Verificar Estado de Servicios
```bash
# Estado general
docker-compose ps

# Uso de recursos
docker stats

# Logs en tiempo real
docker-compose logs -f --tail=100
```

### Health Checks
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001/health
- **Adminer**: http://localhost:8080

## 🚀 Despliegue en Producción

Para desplegar en producción, considera usar:
- **Docker Swarm** o **Kubernetes** para orquestación
- **Traefik** o **Nginx** como reverse proxy
- **Let's Encrypt** para SSL automático
- **Backup automático** de la base de datos
- **Logging centralizado** con ELK stack
