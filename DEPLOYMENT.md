# 🚀 Guía de Deployment

Esta guía cubre el despliegue de DannigOptica usando Docker en diferentes plataformas cloud con CI/CD automático.

## 📋 Tabla de Contenidos

- [Railway (Recomendado)](#railway-recomendado)
- [Render](#render)
- [Fly.io](#flyio)
- [Google Cloud Run](#google-cloud-run)

---

## Railway (Recomendado)

Railway detecta automáticamente Docker y ofrece CI/CD integrado.

### Ventajas
- ✅ Deploy automático desde GitHub
- ✅ Soporta `docker-compose.yml`
- ✅ MySQL incluido ($5/mes)
- ✅ Variables de entorno en UI
- ✅ SSL automático
- ✅ Zero config

### Pasos de Deployment

#### 1. Crear Cuenta
- Ve a [railway.app](https://railway.app)
- Conecta tu cuenta de GitHub

#### 2. Crear Proyecto
- Click en "New Project"
- Selecciona "Deploy from GitHub repo"
- Busca y selecciona `DannigOptica`
- Railway detectará automáticamente los Dockerfiles

#### 3. Configurar Servicios

Railway creará servicios automáticamente. Necesitas configurar:

**MySQL Service:**
- Railway ofrece MySQL como servicio administrado
- Click "New" → "Database" → "Add MySQL"
- Copia la `DATABASE_URL` generada

**Backend Service:**
- Configurar variables de entorno:
  ```
  DATABASE_URL=<pegar URL de MySQL>
  NODE_ENV=production
  PORT=3001
  JWT_SECRET=<generar-secreto-seguro>
  ADMIN_NAME=Admin
  ADMIN_EMAIL=admin@dannig.local
  ADMIN_PASSWORD=<contraseña-segura>
  ```

**Frontend Service:**
- Configurar variables de entorno:
  ```
  VITE_API_URL=https://<backend-url>.railway.app
  ```

#### 4. Deploy
- Railway despliega automáticamente
- Cada push a `main` dispara un nuevo deploy
- Logs en tiempo real en la UI

#### 5. Obtener URLs
- Backend: `https://<nombre-backend>.railway.app`
- Frontend: `https://<nombre-frontend>.railway.app`

### CI/CD Automático

Railway incluye CI/CD por defecto:
- ✅ Deploy automático en cada push a main
- ✅ Preview deployments en PRs
- ✅ Rollback con un click
- ✅ Build logs en tiempo real

---

## Render

Render ofrece tier gratuito con PostgreSQL.

### Ventajas
- ✅ Tier gratuito generoso
- ✅ PostgreSQL gratis
- ✅ SSL automático
- ✅ CI/CD desde Git

### Configuración

#### 1. Preparar Proyecto

El archivo `render.yaml` ya está incluido en el proyecto.

#### 2. Migrar a PostgreSQL (Opcional)

Si usas el tier gratuito, necesitas PostgreSQL en lugar de MySQL:

```bash
# Actualizar schema.prisma
datasource db {
  provider = "postgresql"  # Cambiar de "mysql"
  url      = env("DATABASE_URL")
}

# Regenerar cliente
cd backend
npx prisma generate
```

#### 3. Deploy

- Ve a [render.com](https://render.com)
- "New" → "Blueprint"
- Conecta GitHub y selecciona el repo
- Render detecta `render.yaml`
- Configura secretos en la UI
- Deploy!

### URLs de Producción
- Backend: `https://dannig-backend.onrender.com`
- Frontend: `https://dannig-frontend.onrender.com`

---

## Fly.io

Mejor para apps con baja latencia global.

### Ventajas
- ✅ Edge computing
- ✅ PostgreSQL incluido
- ✅ Free tier: 3 VMs
- ✅ Deploy global

### Deployment

#### 1. Instalar CLI

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Login
fly auth login
```

#### 2. Crear Apps

```bash
# Backend
cd backend
fly launch --name dannig-backend --region scl

# Frontend
cd ../frontend
fly launch --name dannig-frontend --region scl
```

#### 3. Configurar Database

```bash
# Crear PostgreSQL
fly postgres create --name dannig-db --region scl

# Conectar al backend
fly postgres attach dannig-db --app dannig-backend
```

#### 4. Configurar Secrets

```bash
cd backend
fly secrets set \
  JWT_SECRET="your-secret-key" \
  ADMIN_NAME="Admin" \
  ADMIN_EMAIL="admin@dannig.local" \
  ADMIN_PASSWORD="secure-password"
```

#### 5. Deploy

```bash
# Backend
cd backend
fly deploy

# Frontend
cd ../frontend
fly deploy
```

### CI/CD con GitHub Actions

El archivo `.github/workflows/fly-deploy.yml` está incluido:

```yaml
name: Deploy to Fly.io
on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        working-directory: ./backend
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## Google Cloud Run

Para aplicaciones enterprise con auto-scaling.

### Ventajas
- ✅ Escala a cero (sin costo cuando no se usa)
- ✅ Auto-scaling ilimitado
- ✅ Integración con GCP
- ✅ Alta disponibilidad

### Deployment

#### 1. Configurar GCP

```bash
# Instalar gcloud CLI
# Seguir: https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Crear proyecto
gcloud projects create dannig-optica --name="DannigOptica"
gcloud config set project dannig-optica

# Habilitar APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

#### 2. Crear Cloud SQL (MySQL)

```bash
gcloud sql instances create dannig-mysql \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql databases create dannig \
  --instance=dannig-mysql

gcloud sql users create dannig \
  --instance=dannig-mysql \
  --password=secure-password
```

#### 3. Build y Deploy

```bash
# Backend
cd backend
gcloud builds submit --tag gcr.io/dannig-optica/backend
gcloud run deploy dannig-backend \
  --image gcr.io/dannig-optica/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,JWT_SECRET=your-secret"

# Frontend
cd ../frontend
gcloud builds submit --tag gcr.io/dannig-optica/frontend
gcloud run deploy dannig-frontend \
  --image gcr.io/dannig-optica/frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### 4. CI/CD con Cloud Build

El archivo `cloudbuild.yaml` está incluido. Para activar CI/CD:

```bash
# Conectar GitHub
gcloud builds triggers create github \
  --repo-name=DannigOptica \
  --repo-owner=tu-usuario \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
```

---

## 📊 Comparación de Plataformas

| Característica | Railway | Render | Fly.io | Cloud Run |
|----------------|---------|--------|--------|-----------|
| **Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **MySQL Nativo** | ✅ | ❌ (PostgreSQL) | ❌ (PostgreSQL) | ✅ |
| **CI/CD Incluido** | ✅ | ✅ | ⚠️ Manual | ⚠️ Manual |
| **Precio Free Tier** | $5 crédito | Gratis limitado | 3 VMs gratis | $300 crédito |
| **SSL Automático** | ✅ | ✅ | ✅ | ✅ |
| **Docker Compose** | ✅ | ❌ | ❌ | ❌ |
| **Escalabilidad** | Media | Media | Alta | Muy Alta |
| **Latencia LATAM** | Buena | Buena | Excelente | Excelente |

## 🎯 Recomendación

**Para desarrollo y MVP:** Railway (más simple, MySQL nativo)
**Para producción pequeña:** Render (tier gratuito)
**Para producción global:** Fly.io (mejor latencia)
**Para enterprise:** Google Cloud Run (auto-scaling ilimitado)

## 🔐 Variables de Entorno Requeridas

### Backend
```
DATABASE_URL=mysql://user:pass@host:3306/dannig
NODE_ENV=production
PORT=3001
JWT_SECRET=<generar-secreto-seguro>
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@dannig.local
ADMIN_PASSWORD=<contraseña-segura>
```

### Frontend
```
VITE_API_URL=<url-del-backend>
```

## 📝 Checklist Pre-Deploy

- [ ] Commit y push de todo el código a GitHub
- [ ] Variables de entorno configuradas
- [ ] Secretos sensibles NO en el código
- [ ] Health check endpoint funcionando (`/health`)
- [ ] Prisma schema sincronizado
- [ ] Docker builds localmente sin errores
- [ ] README actualizado con URLs de producción

## 🆘 Troubleshooting

### Error: "Cannot connect to database"
- Verificar `DATABASE_URL` en variables de entorno
- Confirmar que el servicio de DB está corriendo
- Revisar logs del backend

### Error: "Module not found"
- Limpiar caché de build
- Verificar que `npm install` se ejecutó
- Revisar Dockerfile copia todos los archivos necesarios

### Error: "Health check failed"
- Verificar que `/health` endpoint responde
- Confirmar `PORT` en variables de entorno
- Revisar logs de inicio del servidor

## 📚 Recursos Adicionales

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Fly.io Docs](https://fly.io/docs)
- [Cloud Run Docs](https://cloud.google.com/run/docs)

