"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clienteRoutes = clienteRoutes;
const db_1 = require("../db");
async function clienteRoutes(app) {
    // 🔐 Requiere JWT en todas las rutas
    app.addHook("preHandler", app.authenticate);
    app.get("/", { preHandler: app.authorize(["admin", "captador", "oftalmologo"]) }, async (req) => {
        const { rut } = (req.query ?? {});
        const user = req.user;
        const where = {};
        // Si es captador, solo ver sus propios clientes
        if (user.roles.includes("captador") && !user.roles.includes("admin")) {
            where.idVendedor = user.sub;
        }
        // Si es oftalmólogo, puede ver todos los clientes (acceso clínico completo)
        // Si se proporciona RUT, buscar por RUT específico
        if (rut && rut.trim()) {
            where.OR = [
                { rut: rut.trim() },
                { rut: { contains: rut.trim() } }
            ];
        }
        // Si hay filtros de RUT, buscar específico
        if (rut && rut.trim()) {
            const cliente = await db_1.prisma.cliente.findFirst({
                where,
                orderBy: { fechaCreacion: "desc" }
            });
            return cliente;
        }
        // Si no hay RUT, listar clientes según permisos
        return db_1.prisma.cliente.findMany({
            where,
            take: 50,
            orderBy: { fechaCreacion: "desc" },
        });
    });
    app.post("/", { preHandler: app.authorize(["admin", "captador"]) }, async (req, reply) => {
        const body = req.body;
        if (!body?.rut || (!body.telefono && !body.correo)) {
            return reply.status(400).send({ error: "rut y (telefono|correo) son requeridos" });
        }
        try {
            // Capture the authenticated user as the salesperson
            const user = req.user;
            const nuevo = await db_1.prisma.cliente.create({
                data: {
                    ...body,
                    idVendedor: user?.sub || null
                }
            });
            return nuevo;
        }
        catch (e) {
            return reply.status(500).send({ error: e.message });
        }
    });
    // PUT /clientes/:id - Actualizar cliente (solo admin)
    app.put("/:id", { preHandler: app.authorize(["admin"]) }, async (req, reply) => {
        const { id } = req.params;
        const body = req.body;
        const idCliente = Number(id);
        if (isNaN(idCliente)) {
            return reply.status(400).send({ error: "ID inválido" });
        }
        try {
            // Verificar que el cliente existe
            const existe = await db_1.prisma.cliente.findUnique({ where: { idCliente } });
            if (!existe) {
                return reply.status(404).send({ error: "Cliente no encontrado" });
            }
            // Actualizar solo los campos proporcionados
            const actualizado = await db_1.prisma.cliente.update({
                where: { idCliente },
                data: body
            });
            return actualizado;
        }
        catch (e) {
            return reply.status(500).send({ error: e.message });
        }
    });
    // GET /clientes/:id/historial - Obtener historial del cliente
    app.get("/:id/historial", { preHandler: app.authorize(["admin", "captador", "oftalmologo"]) }, async (req, reply) => {
        const { id } = req.params;
        const idCliente = Number(id);
        const user = req.user;
        if (isNaN(idCliente)) {
            return reply.status(400).send({ error: "ID inválido" });
        }
        try {
            // Obtener información del cliente
            const cliente = await db_1.prisma.cliente.findUnique({
                where: { idCliente }
            });
            if (!cliente) {
                return reply.status(404).send({ error: "Cliente no encontrado" });
            }
            // Si es captador, verificar que el cliente le pertenece
            if (user.roles.includes("captador") && !user.roles.includes("admin") && !user.roles.includes("oftalmologo")) {
                if (cliente.idVendedor !== user.sub) {
                    return reply.status(403).send({ error: "No tienes acceso a este cliente" });
                }
            }
            // Si es oftalmólogo, puede ver historial de todos los clientes (acceso clínico completo)
            // Obtener citas del cliente
            const citas = await db_1.prisma.cita.findMany({
                where: { idCliente },
                orderBy: { fechaHora: "desc" },
                include: {
                    operativo: {
                        select: {
                            idOperativo: true,
                            nombre: true
                        }
                    }
                }
            });
            return {
                cliente,
                citas,
                estadisticas: {
                    totalCitas: citas.length,
                    citasConfirmadas: citas.filter((c) => c.estado === 'Confirmada').length,
                    citasCanceladas: citas.filter((c) => c.estado === 'Cancelada').length,
                    citasNoShow: citas.filter((c) => c.estado === 'NoShow').length,
                    ultimaCita: citas[0] || null
                }
            };
        }
        catch (e) {
            return reply.status(500).send({ error: e.message });
        }
    });
}
