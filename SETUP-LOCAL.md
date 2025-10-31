# Guía de Configuración Local - Dannig Optica Backend

## Estado Actual

✅ **El servidor está corriendo correctamente en `http://localhost:3001`**

Puedes verificar que funciona visitando:
- http://localhost:3001/health
- http://localhost:3001/

## Requisitos Previos

- Node.js 18 o superior
- npm o yarn
- Docker y Docker Compose (para la base de datos MySQL)
- Opcional: MySQL instalado localmente

## Configuración Rápida

### Paso 1: Iniciar Base de Datos MySQL

```bash
cd backend
docker-compose up -d mysql
```

Esto iniciará MySQL en el puerto 3307 con:
- Usuario: `dannig`
- Password: `dannig`
- Database: `dannig`
- Puerto: `3307` (mapeado desde 3306 interno)

**Nota:** Si el contenedor ya existe, usa:
```bash
docker start dannig-mysql
```

### Paso 2: Configurar Variables de Entorno

El archivo `.env` ya está configurado con:
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=mysql://dannig:dannig@localhost:3307/dannig
JWT_SECRET=dev_secret_key_change_in_production_minimum_32_chars_please
```

### Paso 3: Instalar Dependencias (si no están instaladas)

```bash
npm install
```

### Paso 4: Generar Cliente de Prisma

```bash
npm run prisma:generate
```

### Paso 5: Aplicar Migraciones de Base de Datos

```bash
npx prisma db push
```

### Paso 6: Iniciar el Servidor en Modo Desarrollo

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:3001` con hot-reload automático.

## Comandos Útiles

### Desarrollo
```bash
npm run dev              # Iniciar en modo desarrollo con hot-reload
npm run dev:debug        # Iniciar con debugging habilitado
```

### Base de Datos
```bash
npm run db:migrate       # Aplicar migraciones
npx prisma studio        # Abrir interfaz visual de Prisma
npx prisma db push       # Sincronizar schema sin migraciones
```

### Producción
```bash
npm run build            # Compilar TypeScript
npm start                # Iniciar servidor compilado
```

### Datos de Prueba
```bash
npm run seed:demo        # Poblar base de datos con datos de demo
```

## Endpoints Disponibles

- `GET /` - Información del API
- `GET /health` - Health check
- `POST /auth/login` - Iniciar sesión
- `GET /clientes` - Listar clientes (requiere auth)
- `GET /productos` - Listar productos (requiere auth)
- `GET /ventas` - Listar ventas (requiere auth)
- `GET /garantias` - Listar garantías (requiere auth)
- `GET /alertas` - Listar alertas (requiere auth)

## Adminer (Interface Web para MySQL)

Para acceder a la base de datos desde el navegador:

```bash
docker-compose up -d adminer
```

Luego accede a: http://localhost:8080

**Credenciales:**
- Sistema: MySQL
- Servidor: `dannig-mysql` (o `localhost:3307`)
- Usuario: `dannig`
- Password: `dannig`
- Base de datos: `dannig`

## Solución de Problemas

### Error: "DATABASE_URL no está configurada"
- Verifica que el archivo `.env` exista en `backend/`
- Asegúrate de que la variable `DATABASE_URL` esté correctamente configurada

### Error: "ECONNREFUSED" al conectar a MySQL
- Verifica que MySQL esté corriendo: `docker ps | findstr mysql`
- Si usas Docker, asegúrate de usar el puerto correcto (3307)
- Verifica las credenciales en `DATABASE_URL`

### Error: "Prisma Client not generated"
```bash
npm run prisma:generate
```

### Puerto ya en uso
Si el puerto 3001 está ocupado:
- Cambia `PORT` en `.env` a otro puerto (ej: 3002)
- O termina el proceso que usa el puerto:
  ```powershell
  # Encontrar proceso
  netstat -ano | findstr :3001
  # Terminar proceso (reemplaza PID con el número encontrado)
  taskkill /PID <PID> /F
  ```

### Ver logs de Docker
```bash
docker logs dannig-mysql
docker logs -f dannig-mysql  # Seguir logs en tiempo real
```

## Probar el API

### Health Check
```powershell
curl http://localhost:3001/health
```

### Login (crear usuario admin primero)
```powershell
curl -X POST http://localhost:3001/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@dannig.local\",\"password\":\"admin123\"}'
```

### Listar Clientes (requiere token JWT)
```powershell
$token = "tu_token_jwt_aqui"
curl -H "Authorization: Bearer $token" http://localhost:3001/clientes
```
