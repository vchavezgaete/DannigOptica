"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadRoutes = leadRoutes;
const db_1 = require("../db");
async function leadRoutes(app) {
    // 🔐 Todas las rutas requieren token
    app.addHook("preHandler", app.authenticate);
    // GET /leads  → lista clientes (opcional: ?q=texto&limit=100)
    app.get("/", { preHandler: app.authorize(["admin", "operador"]) }, async (req) => {
        const { q, limit } = (req.query ?? {});
        const take = Math.min(Math.max(Number(limit) || 100, 1), 500);
        const where = {};
        if (q && q.trim()) {
            where.OR = [
                { nombre: { contains: q } },
                { rut: { contains: q } },
                { telefono: { contains: q } },
                { correo: { contains: q } },
                { sector: { contains: q } },
            ];
        }
        return db_1.prisma.cliente.findMany({
            where,
            orderBy: { fechaCreacion: "desc" },
            take,
        });
    });
    // POST /leads  → crea cliente
    app.post("/", { preHandler: app.authorize(["admin"]) }, async (req, reply) => {
        const { nombre, documento, contacto, direccion, sector,
        // observaciones se ignora porque no existe en la tabla 'cliente'
         } = (req.body ?? {});
        if (!nombre) {
            return reply.code(400).send({ error: "nombre es requerido" });
        }
        if (!documento) {
            return reply.code(400).send({ error: "documento (RUT) es requerido" });
        }
        let telefono = null;
        let correo = null;
        if (contacto) {
            const c = contacto.trim();
            if (c.includes("@"))
                correo = c;
            else
                telefono = c;
        }
        try {
            const nuevo = await db_1.prisma.cliente.create({
                data: {
                    rut: documento,
                    nombre,
                    telefono,
                    correo,
                    direccion: direccion ?? null,
                    sector: sector ?? null,
                },
            });
            return reply.code(201).send(nuevo);
        }
        catch (e) {
            // Violación de UNIQUE (RUT duplicado)
            if (e?.code === "P2002") {
                return reply.code(409).send({ error: "RUT ya existe" });
            }
            return reply
                .code(500)
                .send({ error: e?.message || "Error al crear lead" });
        }
    });
}
