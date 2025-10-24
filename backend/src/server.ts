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
import { prisma } from "./db";

const app = Fastify({ logger: true });

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
      reportes: "/reportes"
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

const PORT = 3001;
app
  .listen({ port: PORT, host: "0.0.0.0" })
  .then(() => console.log(`🚀 API running on http://localhost:${PORT}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
