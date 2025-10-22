# 📊 Sistema de Reportes - DannigOptica

## Descripción

El sistema de reportes permite analizar el desempeño de la óptica con visualizaciones interactivas y datos detallados.

## Tipos de Reportes Disponibles

### 1. 🏆 Top Vendedores
Muestra los vendedores con más clientes captados.
- **Visualización**: Gráfico de barras
- **Métricas**: Total de clientes por vendedor
- **Filtros**: Fecha de creación del cliente

### 2. 📦 Productos Más Vendidos
Muestra los productos ordenados por cantidad vendida.
- **Visualizaciones**: 
  - Gráfico de torta (distribución por cantidad)
  - Gráfico de barras (ingresos por producto)
- **Métricas**: Cantidad vendida e ingresos totales
- **Filtros**: Fecha de venta

### 3. 💰 Ventas por Período
Muestra estadísticas agregadas de ventas.
- **Visualización**: Cards de estadísticas + tabla de ventas
- **Métricas**: 
  - Total de ventas
  - Ingreso total
  - Promedio por venta
- **Filtros**: Fecha de venta

### 4. 👥 Clientes Nuevos
Lista de clientes registrados recientemente.
- **Visualización**: Tabla con información detallada
- **Métricas**: Información de contacto y vendedor asignado
- **Filtros**: Fecha de registro

### 5. ⭐ Top Clientes
Muestra los clientes con mayor monto de compras.
- **Visualizaciones**:
  - Gráfico de barras (monto total)
  - Gráfico de barras (número de compras)
- **Métricas**: Total compras, monto total, promedio
- **Filtros**: Fecha de compra

## Uso del Sistema

### Acceso
1. Inicia sesión en el sistema
2. Ve al menú "📊 Reportes"

### Generación de Reportes
1. Selecciona el tipo de reporte deseado
2. (Opcional) Activa los filtros de fecha
3. Configura las fechas de inicio y fin si lo deseas
4. Haz clic en "📊 Generar Reporte"

### Interpretación
- Los gráficos se muestran primero para una visualización rápida
- Las tablas detalladas aparecen debajo con información completa
- Los top 3 en rankings están resaltados con medallas 🥇🥈🥉

## API Endpoint

### GET `/reportes`

**Query Parameters:**
- `tipo` (requerido): Tipo de reporte
  - `top-vendedores`
  - `productos-mas-vendidos`
  - `ventas-por-periodo`
  - `clientes-nuevos`
  - `top-clientes`
- `fechaDesde` (opcional): Fecha de inicio (ISO 8601)
- `fechaHasta` (opcional): Fecha de fin (ISO 8601)
- `limit` (opcional): Número máximo de resultados (default: 10)

**Ejemplo:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/reportes?tipo=top-vendedores&fechaDesde=2025-01-01&limit=5"
```

**Respuesta:**
```json
{
  "tipo": "top-vendedores",
  "fechaDesde": "2025-01-01",
  "fechaHasta": null,
  "total": 4,
  "datos": [
    {
      "idUsuario": 1,
      "nombre": "Juan Pérez",
      "correo": "juan.perez@dannig.cl",
      "totalClientes": 5,
      "roles": ["Vendedor"]
    }
  ]
}
```

## Datos Demo

### Generación de Datos Demo

Para poblar la base de datos con datos de prueba:

```bash
cd backend
npm run seed:demo
```

Esto creará:
- 4 vendedores
- 12 clientes (3 por vendedor)
- 8 productos
- 30 ventas con items

### Credenciales Demo

**Email**: juan.perez@dannig.cl  
**Password**: demo123

### Otros Usuarios Demo

- maria.gonzalez@dannig.cl
- carlos.rodriguez@dannig.cl
- ana.martinez@dannig.cl

(Todos con password: `demo123`)

## Características Técnicas

### Backend
- **Framework**: Fastify
- **ORM**: Prisma
- **Base de datos**: MySQL
- **Autenticación**: JWT

### Frontend
- **Framework**: React + TypeScript
- **Gráficos**: Recharts
- **Routing**: React Router
- **Estilos**: CSS custom (consistente con el diseño existente)

### Tipos de Gráficos
- **BarChart**: Gráficos de barras verticales
- **PieChart**: Gráficos de torta/pastel
- **ResponsiveContainer**: Contenedores responsivos que se adaptan al tamaño

## Notas de Implementación

### Relación Vendedor-Cliente
Se agregó un campo `idVendedor` a la tabla `Cliente` que se asigna automáticamente al crear un cliente nuevo. El vendedor es el usuario autenticado que realiza la creación.

### Filtros de Fecha
Los filtros son opcionales y pueden ser:
- Solo fecha desde
- Solo fecha hasta
- Ambas fechas
- Sin filtros (histórico completo)

### Rendimiento
- Los reportes están optimizados para consultas rápidas
- Se incluyen índices en las tablas relevantes
- Los gráficos se renderizan del lado del cliente

## Próximas Mejoras

- [ ] Exportar reportes a PDF
- [ ] Exportar datos a Excel/CSV
- [ ] Reportes programados por email
- [ ] Gráficos de tendencias temporales
- [ ] Comparación entre períodos
- [ ] Dashboard con múltiples reportes
- [ ] Reportes personalizados por rol

## Soporte

Para problemas o sugerencias, contactar al equipo de desarrollo.

