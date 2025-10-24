"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const auth_1 = require("./routes/auth");
const leads_1 = require("./routes/leads");
const appointments_1 = require("./routes/appointments");
const clientes_1 = require("./routes/clientes");
const fichas_clinicas_1 = require("./routes/fichas-clinicas");
const recetas_1 = require("./routes/recetas");
const auth_2 = __importDefault(require("./plugins/auth"));
const productos_1 = require("./routes/productos");
const reportes_1 = require("./routes/reportes");
const app = (0, fastify_1.default)({ logger: true });
// Registrar CORS una sola vez
app.register(cors_1.default, { origin: true });
// Registrar plugin de auth (JWT) una vez
app.register(auth_2.default);
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
app.register(auth_1.authRoutes, { prefix: "/auth" });
app.register(leads_1.leadRoutes, { prefix: "/leads" });
app.register(appointments_1.appointmentRoutes, { prefix: "/appointments" });
app.register(clientes_1.clienteRoutes, { prefix: "/clientes" });
app.register(fichas_clinicas_1.fichaClinicaRoutes, { prefix: "/fichas-clinicas" });
app.register(recetas_1.recetaRoutes, { prefix: "/recetas" });
app.register(productos_1.productoRoutes, { prefix: "/productos" });
app.register(reportes_1.reporteRoutes, { prefix: "/reportes" });
const PORT = 3001;
app
    .listen({ port: PORT, host: "0.0.0.0" })
    .then(() => console.log(`🚀 API running on http://localhost:${PORT}`))
    .catch((err) => {
    app.log.error(err);
    process.exit(1);
});
