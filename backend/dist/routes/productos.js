"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productoRoutes = productoRoutes;
const db_1 = require("../db");
async function productoRoutes(app) {
    // 🔐 Requiere JWT en todas las rutas
    app.addHook("preHandler", app.authenticate);
    // 🔒 Solo admin puede acceder a productos
    app.addHook("preHandler", app.authorize(["admin"]));
    // GET /productos
    app.get("/", async () => {
        const productos = await db_1.prisma.producto.findMany({
            orderBy: { idProducto: "asc" },
        });
        return productos;
    });
    // (Opcional) GET /productos/:id
    app.get("/:id", async (request, reply) => {
        const id = Number(request.params.id);
        const prod = await db_1.prisma.producto.findUnique({ where: { idProducto: id } });
        if (!prod)
            return reply.code(404).send({ error: "Producto no encontrado" });
        return prod;
    });
}
