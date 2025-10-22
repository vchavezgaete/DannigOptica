import Fastify from "fastify";
import cors from "@fastify/cors";
import { authRoutes } from "./routes/auth";
import { leadRoutes } from "./routes/leads";
import { appointmentRoutes } from "./routes/appointments";
import { clienteRoutes } from "./routes/clientes";
import authPlugin from "./plugins/auth";
import { productoRoutes } from "./routes/productos";
import { reporteRoutes } from "./routes/reportes";
import { prisma } from "./db";

const app = Fastify({ logger: true });

// Registrar CORS una sola vez
app.register(cors, { origin: true });

// Registrar plugin de auth (JWT) una vez
app.register(authPlugin);

// Health check endpoint
app.get("/health", async (request, reply) => {
  let dbStatus = "disconnected";
  
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "error";
    console.error("Database health check failed:", error);
  }

  const healthCheck = {
    status: dbStatus === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    services: {
      database: dbStatus,
      api: "running"
    }
  };
  
  const statusCode = dbStatus === "connected" ? 200 : 503;
  return reply.code(statusCode).send(healthCheck);
});

// Rutas
app.register(authRoutes, { prefix: "/auth" });
app.register(leadRoutes, { prefix: "/leads" });
app.register(appointmentRoutes, { prefix: "/appointments" });
app.register(clienteRoutes, { prefix: "/clientes" }); // ← asegúrate de que exista este archivo y export
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
