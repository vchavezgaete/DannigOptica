"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.default = (0, fastify_plugin_1.default)(async (app) => {
    // Verifica el Bearer Token y adjunta el payload a req.user
    app.decorate("authenticate", async (req, reply) => {
        const auth = req.headers?.authorization || "";
        if (!auth.startsWith("Bearer ")) {
            return reply.code(401).send({ error: "Token requerido" });
        }
        const token = auth.slice("Bearer ".length);
        try {
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "dev_secret");
            req.user = payload; // { sub, correo, roles: string[] }
        }
        catch {
            return reply.code(401).send({ error: "Token inválido" });
        }
    });
    // Crea un preHandler que exige uno de los roles indicados
    app.decorate("authorize", (roles) => {
        return async (req, reply) => {
            if (!req.user?.roles?.some((r) => roles.includes(r))) {
                return reply.code(403).send({ error: "No autorizado" });
            }
        };
    });
});
