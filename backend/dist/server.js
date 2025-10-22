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
const auth_2 = __importDefault(require("./plugins/auth"));
const productos_1 = require("./routes/productos");
const reportes_1 = require("./routes/reportes");
const app = (0, fastify_1.default)({ logger: true });
// Registrar CORS una sola vez
app.register(cors_1.default, { origin: true });
// Registrar plugin de auth (JWT) una vez
app.register(auth_2.default);
app.get("/health", async () => ({ ok: true }));
// Rutas
app.register(auth_1.authRoutes, { prefix: "/auth" });
app.register(leads_1.leadRoutes, { prefix: "/leads" });
app.register(appointments_1.appointmentRoutes, { prefix: "/appointments" });
app.register(clientes_1.clienteRoutes, { prefix: "/clientes" }); // ← asegúrate de que exista este archivo y export
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
