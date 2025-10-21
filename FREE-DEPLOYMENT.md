# 🆓 Deployment 100% Gratuito

Guía completa para desplegar DannigOptica sin gastar un peso.

## 📋 Stack Gratuito Recomendado

| Componente | Servicio | Costo | Limitaciones |
|------------|----------|-------|--------------|
| **Frontend** | Render | $0 | Duerme tras 15min inactividad |
| **Backend** | Render | $0 | Duerme tras 15min inactividad |
| **Database** | Supabase | $0 | 500MB storage, 2GB bandwidth |
| **CI/CD** | GitHub Actions | $0 | 2000 min/mes |

---

## 🎯 Opción 1: Render + Supabase (100% Gratis - Recomendado)

### Arquitectura
```
Frontend (Render) → Backend (Render) → PostgreSQL (Supabase)
```

### Paso 1: Configurar Base de Datos en Supabase

1. **Crear cuenta en [Supabase](https://supabase.com)**
   - Gratis para siempre
   - 500MB database storage
   - PostgreSQL completo

2. **Crear proyecto:**
   - Project name: `dannig-optica`
   - Database password: (guardar para después)
   - Region: South America (São Paulo)

3. **Obtener credenciales:**
   - Ve a Settings → Database
   - Copia el **Connection String** (modo URI)
   - Ejemplo: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`

### Paso 2: Adaptar Prisma a PostgreSQL

**Actualizar `backend/prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"  // Cambiar de "mysql" a "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// CAMBIOS NECESARIOS EN LOS MODELOS:
// 1. TINYINT → SMALLINT (PostgreSQL no tiene TINYINT)
// 2. @db.DateTime(0) → @db.Timestamp(0)

model Cliente {
  idCliente     Int      @id @default(autoincrement()) @map("id_cliente")
  rut           String   @unique(map: "uq_cliente_rut") @db.VarChar(12)
  nombre        String   @db.VarChar(100)
  telefono      String?  @db.VarChar(15)
  correo        String?  @db.VarChar(120)
  direccion     String?  @db.VarChar(150)
  sector        String?  @db.VarChar(80)
  fechaCreacion DateTime @default(now()) @map("fecha_creacion") @db.Timestamp(0)
  alertas       Alerta[]
  citas         Cita[]
  ventas        Venta[]

  @@map("cliente")
}

model Usuario {
  idUsuario    Int          @id @default(autoincrement()) @map("id_usuario")
  nombre       String       @db.VarChar(100)
  correo       String       @unique(map: "uq_usuario_correo") @db.VarChar(120)
  hashPassword String       @map("hash_password") @db.VarChar(255)
  activo       Int          @default(1) @db.SmallInt  // Cambio: TinyInt → SmallInt
  roles        UsuarioRol[]

  @@map("usuario")
}

model Cita {
  idCita      Int           @id @default(autoincrement()) @map("id_cita")
  idCliente   Int           @map("id_cliente")
  idOperativo Int?          @map("id_operativo")
  fechaHora   DateTime      @map("fecha_hora") @db.Timestamp(0)  // Cambio
  estado      CitaEstado
  cliente     Cliente       @relation(fields: [idCliente], references: [idCliente], onDelete: NoAction, map: "fk_cita_cliente")
  operativo   Operativo?    @relation(fields: [idOperativo], references: [idOperativo], onDelete: NoAction, map: "fk_cita_operativo")
  ficha       FichaClinica?

  @@index([idCliente, fechaHora], map: "ix_cita_cliente_fecha")
  @@index([idOperativo, fechaHora], map: "ix_cita_operativo_fecha")
  @@map("cita")
}

model Alerta {
  idAlerta        Int         @id @default(autoincrement()) @map("id_alerta")
  idCliente       Int         @map("id_cliente")
  tipo            AlertaTipo
  canal           AlertaCanal
  mensaje         String      @db.VarChar(240)
  fechaProgramada DateTime    @map("fecha_programada") @db.Timestamp(0)  // Cambio
  enviado         Int         @default(0) @db.SmallInt  // Cambio
  cliente         Cliente     @relation(fields: [idCliente], references: [idCliente], onDelete: NoAction, map: "fk_alerta_cliente")

  @@index([fechaProgramada, enviado], map: "ix_alerta_programada")
  @@index([idCliente], map: "fk_alerta_cliente")
  @@map("alerta")
}

// ... resto de modelos igual, solo cambiar:
// - @db.DateTime(0) → @db.Timestamp(0)
// - @db.TinyInt → @db.SmallInt
```

### Paso 3: Deploy en Render

1. **Crear archivo `render.yaml` en la raíz:**

```yaml
services:
  # Backend API
  - type: web
    name: dannig-backend
    runtime: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    plan: free
    healthCheckPath: /health
    autoDeploy: true
    envVars:
      - key: DATABASE_URL
        sync: false  # Configurar manualmente con URL de Supabase
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: JWT_SECRET
        generateValue: true
      - key: ADMIN_NAME
        value: Admin
      - key: ADMIN_EMAIL
        value: admin@dannig.local
      - key: ADMIN_PASSWORD
        sync: false

  # Frontend React
  - type: web
    name: dannig-frontend
    runtime: docker
    dockerfilePath: ./frontend/Dockerfile
    dockerContext: ./frontend
    plan: free
    autoDeploy: true
    envVars:
      - key: VITE_API_URL
        value: https://dannig-backend.onrender.com  # Actualizar después
```

2. **Deploy:**
   - Ve a [render.com](https://render.com)
   - "New" → "Blueprint"
   - Conecta tu repo de GitHub
   - Render detecta `render.yaml`
   - En variables de entorno, configura:
     - `DATABASE_URL`: (pegar de Supabase)
     - `ADMIN_PASSWORD`: tu contraseña segura
   - Deploy!

3. **Actualizar VITE_API_URL:**
   - Después del primer deploy, copia la URL del backend
   - Actualiza la variable `VITE_API_URL` en el frontend
   - Redeploy frontend

**URLs resultantes (ejemplos):**
- Frontend: `https://dannig-frontend.onrender.com`
- Backend: `https://dannig-backend.onrender.com`

### Mantener los servicios "despiertos"

Render free tier duerme tras 15min de inactividad. Soluciones:

**Opción A: Cron-job.org (Gratis)**
```
https://cron-job.org
- Crear cuenta gratis
- Agregar job que haga GET a:
  - https://dannig-backend.onrender.com/health cada 14 minutos
  - https://dannig-frontend.onrender.com cada 14 minutos
```

**Opción B: UptimeRobot (Gratis)**
```
https://uptimerobot.com
- 50 monitores gratis
- Ping cada 5 minutos
- Mantiene tu app despierta
```

---

## 🎯 Opción 2: Fly.io Free Tier

**Lo que obtienes GRATIS:**
- ✅ 3 máquinas compartidas (256MB RAM cada una)
- ✅ 3GB de almacenamiento persistente
- ✅ 160GB bandwidth/mes
- ✅ PostgreSQL incluido
- ✅ No se duerme

**Deploy:**

```bash
# Instalar CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Backend
cd backend
fly launch --name dannig-backend --region scl --ha=false
fly postgres create --name dannig-db --region scl
fly postgres attach dannig-db --app dannig-backend

# Configurar secrets
fly secrets set \
  JWT_SECRET="your-secret" \
  ADMIN_EMAIL="admin@dannig.local" \
  ADMIN_PASSWORD="admin123"

fly deploy

# Frontend
cd ../frontend
fly launch --name dannig-frontend --region scl --ha=false
fly deploy
```

**Configuración para free tier:**

Crear/editar `backend/fly.toml`:
```toml
app = "dannig-backend"
primary_region = "scl"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = false  # No detener automáticamente
  auto_start_machines = true
  min_machines_running = 1    # Siempre 1 máquina corriendo

[[vm]]
  memory = '256mb'  # Free tier
  cpu_kind = 'shared'
  cpus = 1
```

---

## 🎯 Opción 3: Koyeb Free Tier

**Lo que obtienes GRATIS:**
- ✅ 1 servicio web
- ✅ 512MB RAM
- ✅ No se duerme
- ✅ Deploy desde GitHub
- ✅ PostgreSQL externo compatible

**Deploy:**

1. Ve a [koyeb.com](https://koyeb.com)
2. Conecta GitHub
3. Selecciona repo
4. Tipo: Docker
5. Dockerfile path: `backend/Dockerfile`
6. Variables de entorno:
   ```
   DATABASE_URL=<supabase-url>
   NODE_ENV=production
   PORT=8000  # Koyeb usa puerto 8000
   JWT_SECRET=<secret>
   ADMIN_EMAIL=admin@dannig.local
   ADMIN_PASSWORD=<password>
   ```
7. Deploy!

**Limitación:** Solo 1 servicio gratis, así que elige backend o frontend. Puedes desplegar el otro en Render.

---

## 🎯 Opción 4: Railway (Trial Gratuito)

**Lo que obtienes GRATIS:**
- ✅ $5 de crédito gratis (suficiente para ~1 mes)
- ✅ MySQL incluido
- ✅ No se duerme
- ✅ CI/CD automático

**Nota:** Después de gastar los $5, necesitas agregar tarjeta (pero puedes cancelar antes).

---

## 🎯 Opción 5: Alternativa Cloud Providers

### Oracle Cloud (Always Free)

**Lo que obtienes GRATIS para siempre:**
- ✅ 2 AMD VMs (1/8 OCPU, 1GB RAM cada una)
- ✅ 4 ARM VMs (hasta 24GB RAM total)
- ✅ 200GB block storage
- ✅ No expira nunca

**Configuración:**

1. Crear cuenta en [oracle.com/cloud/free](https://www.oracle.com/cloud/free/)
2. Crear VM con Ubuntu
3. Instalar Docker:
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose -y
   ```
4. Clonar repo y levantar:
   ```bash
   git clone <tu-repo>
   cd DannigOptica
   docker compose up -d
   ```

5. Configurar firewall:
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3001 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 5173 -j ACCEPT
   sudo netfilter-persistent save
   ```

**Ventajas:**
- ✅ 100% gratis para siempre
- ✅ Control total (VM completa)
- ✅ Usa tu docker-compose.yml actual sin cambios

**Desventajas:**
- ⚠️ Requiere configuración manual
- ⚠️ No CI/CD automático (necesitas configurar)

---

## 📊 Comparación Opciones Gratuitas

| Opción | Setup | MySQL/PostgreSQL | Sleeps | RAM | CI/CD | Duración |
|--------|-------|------------------|--------|-----|-------|----------|
| **Render + Supabase** | ⭐⭐⭐⭐⭐ | PostgreSQL | Sí (15min) | 512MB | ✅ | Para siempre |
| **Fly.io** | ⭐⭐⭐⭐ | PostgreSQL | No | 256MB | ⚠️ | Para siempre |
| **Koyeb** | ⭐⭐⭐⭐ | Externo | No | 512MB | ✅ | Para siempre |
| **Railway** | ⭐⭐⭐⭐⭐ | MySQL | No | Variable | ✅ | ~1 mes ($5) |
| **Oracle Cloud** | ⭐⭐ | MySQL | No | 1GB | ❌ | Para siempre |

---

## 🎯 Mi Recomendación: Render + Supabase

**Mejor opción gratis para tu proyecto:**

1. **Base de datos:** Supabase (PostgreSQL gratis)
2. **Backend:** Render (free tier)
3. **Frontend:** Render (free tier)
4. **Mantener despierto:** UptimeRobot (ping automático)

**Pros:**
- ✅ 100% gratis para siempre
- ✅ SSL incluido
- ✅ CI/CD automático
- ✅ Fácil configuración
- ✅ Buen performance

**Cons:**
- ⚠️ Necesitas migrar de MySQL a PostgreSQL
- ⚠️ Duerme tras 15min (pero UptimeRobot lo soluciona)
- ⚠️ Primer request lento al despertar (~30seg)

---

## 🚀 Guía Rápida: Deploy en 10 minutos

### Paso 1: Migrar a PostgreSQL
```bash
cd backend/prisma
# Editar schema.prisma: cambiar provider a "postgresql"
# Cambiar @db.DateTime(0) → @db.Timestamp(0)
# Cambiar @db.TinyInt → @db.SmallInt
```

### Paso 2: Crear DB en Supabase
- Ir a supabase.com → New project
- Copiar connection string

### Paso 3: Deploy en Render
- Ir a render.com → New Blueprint
- Conectar GitHub
- Configurar `DATABASE_URL` con string de Supabase
- Deploy!

### Paso 4: Configurar UptimeRobot
- uptimerobot.com → Add Monitor
- URL: tu backend en Render
- Interval: 5 minutos

**¡Listo! App corriendo 24/7 gratis.**

---

## 🆘 Troubleshooting

### "App se duerme muy seguido"
- Configurar UptimeRobot con ping cada 5 minutos
- Alternativamente, usar Fly.io que no duerme

### "PostgreSQL vs MySQL diferencias"
- Prisma maneja la mayoría automáticamente
- Cambios principales: tipos de datos y sintaxis de fechas
- Ejecutar `npx prisma db push` para sincronizar schema

### "Quiero mantener MySQL"
- Opción 1: Oracle Cloud (VM gratis con MySQL)
- Opción 2: PlanetScale (MySQL serverless, 5GB gratis)
- Opción 3: Railway trial ($5 crédito inicial)

---

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Render Free Tier](https://render.com/docs/free)
- [Fly.io Free Tier](https://fly.io/docs/about/pricing/#free-allowances)
- [UptimeRobot](https://uptimerobot.com)
- [Oracle Always Free](https://www.oracle.com/cloud/free/)

