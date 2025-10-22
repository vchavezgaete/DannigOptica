// src/routes/clientes.ts
import { FastifyInstance } from "fastify";
import { prisma } from "../db";

export async function clienteRoutes(app: FastifyInstance) {
  // 🔐 Requiere JWT en todas las rutas
  app.addHook("preHandler", (app as any).authenticate);

  app.get("/", 
    { preHandler: (app as any).authorize(["admin", "captador"]) },
    async (req) => {
      const { rut } = (req.query ?? {}) as { rut?: string };
      const user = (req as any).user;
      
      const where: any = {};
      
      // Si es captador, solo ver sus propios clientes
      if (user.roles.includes("captador") && !user.roles.includes("admin")) {
        where.idVendedor = user.sub;
      }
      
      // Si se proporciona RUT, buscar por RUT específico
      if (rut && rut.trim()) {
        where.OR = [
          { rut: rut.trim() },
          { rut: { contains: rut.trim() } }
        ];
      }
      
      // Si hay filtros de RUT, buscar específico
      if (rut && rut.trim()) {
        const cliente = await prisma.cliente.findFirst({
          where,
          orderBy: { fechaCreacion: "desc" }
        });
        return cliente;
      }
      
      // Si no hay RUT, listar clientes según permisos
      return prisma.cliente.findMany({
        where,
        take: 50,
        orderBy: { fechaCreacion: "desc" },
      });
    }
  );

  app.post("/", 
    { preHandler: (app as any).authorize(["admin", "captador"]) },
    async (req, reply) => {
      const body = req.body as {
        rut: string;
        nombre: string;
        telefono?: string;
        correo?: string;
        direccion?: string;
        sector?: string;
      };

      if (!body?.rut || (!body.telefono && !body.correo)) {
        return reply.status(400).send({ error: "rut y (telefono|correo) son requeridos" });
      }

      try {
        // Capture the authenticated user as the salesperson
        const user = (req as any).user;
        const nuevo = await prisma.cliente.create({ 
          data: { 
            ...body, 
            idVendedor: user?.sub || null 
          } 
        });
        return nuevo;
      } catch (e: any) {
        return reply.status(500).send({ error: e.message });
      }
    }
  );

  // PUT /clientes/:id - Actualizar cliente (solo admin)
  app.put("/:id", 
    { preHandler: (app as any).authorize(["admin"]) },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const body = req.body as {
        rut?: string;
        nombre?: string;
        telefono?: string;
        correo?: string;
        direccion?: string;
        sector?: string;
      };

      const idCliente = Number(id);
      if (isNaN(idCliente)) {
        return reply.status(400).send({ error: "ID inválido" });
      }

      try {
        // Verificar que el cliente existe
        const existe = await prisma.cliente.findUnique({ where: { idCliente } });
        if (!existe) {
          return reply.status(404).send({ error: "Cliente no encontrado" });
        }

        // Actualizar solo los campos proporcionados
        const actualizado = await prisma.cliente.update({
          where: { idCliente },
          data: body
        });
        
        return actualizado;
      } catch (e: any) {
        return reply.status(500).send({ error: e.message });
      }
    }
  );

  // GET /clientes/:id/historial - Obtener historial del cliente
  app.get("/:id/historial", 
    { preHandler: (app as any).authorize(["admin", "captador"]) },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const idCliente = Number(id);
      const user = (req as any).user;
      
      if (isNaN(idCliente)) {
        return reply.status(400).send({ error: "ID inválido" });
      }

      try {
        // Obtener información del cliente
        const cliente = await prisma.cliente.findUnique({ 
          where: { idCliente } 
        });
        
        if (!cliente) {
          return reply.status(404).send({ error: "Cliente no encontrado" });
        }

        // Si es captador, verificar que el cliente le pertenece
        if (user.roles.includes("captador") && !user.roles.includes("admin")) {
          if (cliente.idVendedor !== user.sub) {
            return reply.status(403).send({ error: "No tienes acceso a este cliente" });
          }
        }

        // Obtener citas del cliente
        const citas = await prisma.cita.findMany({
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
            citasConfirmadas: citas.filter((c: any) => c.estado === 'Confirmada').length,
            citasCanceladas: citas.filter((c: any) => c.estado === 'Cancelada').length,
            citasNoShow: citas.filter((c: any) => c.estado === 'NoShow').length,
            ultimaCita: citas[0] || null
          }
        };
      } catch (e: any) {
        return reply.status(500).send({ error: e.message });
      }
    }
  );
}
