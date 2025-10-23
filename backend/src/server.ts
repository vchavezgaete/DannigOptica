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

// Health check endpoint mejorado
app.get("/health", async (request, reply) => {
  let dbStatus = "disconnected";
  let dbError = null;

  try {
    // Test database connection with timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      )
    ]);
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "error";
    dbError = error instanceof Error ? error.message : 'Unknown error';
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
    },
    ...(dbError && { error: dbError })
  };

  // Return 200 even if DB is not connected during startup
  // This allows the service to be marked as healthy while DB initializes
  return reply.code(200).send(healthCheck);
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
