import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth";
import { leadRoutes } from "./routes/leads";
import { appointmentRoutes } from "./routes/appointments";
import { clienteRoutes } from "./routes/clientes";
import { fichaClinicaRoutes } from "./routes/fichas-clinicas";
import { recetaRoutes } from "./routes/recetas";
import authPlugin from "./plugins/auth";
import { productoRoutes } from "./routes/productos";
import { reporteRoutes } from "./routes/reportes";
import { ventaRoutes } from "./routes/ventas";
import { garantiaRoutes } from "./routes/garantias";
import { alertaRoutes } from "./routes/alertas";
import { prisma } from "./db";
import { iniciarCronJobs } from "./jobs/alertas-cron";

const app = Fastify({ 
  logger: {
    level: 'info'
  }
});

// Registrar CORS una sola vez
app.register(cors, { origin: true });

// Registrar plugin de auth (JWT) una vez
app.register(authPlugin);

// Root endpoint para Railway
app.get("/", async (request, reply) => {
  return reply.code(200).send({
    message: "DannigOptica API",
    version: "1.0.0",
    status: "running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
      endpoints: {
        health: "/health",
        auth: "/auth",
        leads: "/leads",
        appointments: "/appointments",
        clientes: "/clientes",
        productos: "/productos",
        reportes: "/reportes",
        ventas: "/ventas",
        garantias: "/garantias",
        alertas: "/alertas"
      }
  });
});

// Health check endpoint simple y robusto
app.get("/health", async (request, reply) => {
  // Health check simple que siempre responde 200
  // Esto permite que el servicio se marque como saludable inmediatamente
  const healthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    services: {
      api: "running"
    }
  };

  return reply.code(200).send(healthCheck);
});

// Rutas
app.register(authRoutes, { prefix: "/auth" });
app.register(leadRoutes, { prefix: "/leads" });
app.register(appointmentRoutes, { prefix: "/appointments" });
app.register(clienteRoutes, { prefix: "/clientes" });
app.register(fichaClinicaRoutes, { prefix: "/fichas-clinicas" });
app.register(recetaRoutes, { prefix: "/recetas" });
app.register(productoRoutes, { prefix: "/productos" });
app.register(reporteRoutes, { prefix: "/reportes" });
app.register(ventaRoutes, { prefix: "/ventas" });
app.register(garantiaRoutes, { prefix: "/garantias" });
app.register(alertaRoutes, { prefix: "/alertas" });

const PORT = process.env.PORT || 3001;
const HOST = "0.0.0.0";

// Manejo de errores global
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Inicializar servidor con manejo robusto de errores
async function startServer() {
  try {
    console.log('Starting DannigOptica Backend...');
    console.log('Environment variables:');
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - PORT: ${PORT}`);
    console.log(`   - DATABASE_URL: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`);
    console.log(`   - JWT_SECRET: ${process.env.JWT_SECRET ? 'configured' : 'not configured'}`);
    
    await app.listen({ port: Number(PORT), host: HOST });
    console.log(`API running on http://${HOST}:${PORT}`);
    console.log('Server started successfully');
    
    // Iniciar sistema de alertas automatizadas
    iniciarCronJobs();
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

startServer();
