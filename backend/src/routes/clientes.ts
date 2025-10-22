// src/routes/clientes.ts
import { FastifyInstance } from "fastify";
import { prisma } from "../db";

export async function clienteRoutes(app: FastifyInstance) {
  // 🔐 Requiere JWT en todas las rutas
  app.addHook("preHandler", (app as any).authenticate);

  app.get("/", async (req) => {
    const { rut } = (req.query ?? {}) as { rut?: string };
    
    // Si se proporciona RUT, buscar por RUT específico
    if (rut && rut.trim()) {
      const cliente = await prisma.cliente.findFirst({
        where: {
          OR: [
            { rut: rut.trim() },
            { rut: { contains: rut.trim() } }
          ]
        },
        orderBy: { fechaCreacion: "desc" }
      });
      return cliente;
    }
    
    // Si no hay RUT, listar todos los clientes
    return prisma.cliente.findMany({
      take: 50,
      orderBy: { fechaCreacion: "desc" },
    });
  });

  app.post("/", async (req, reply) => {
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
          idVendedor: user?.id || null 
        } 
      });
      return nuevo;
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });

  // PUT /clientes/:id - Actualizar cliente
  app.put("/:id", async (req, reply) => {
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
  });

  // GET /clientes/:id/historial - Obtener historial del cliente
  app.get("/:id/historial", async (req, reply) => {
    const { id } = req.params as { id: string };
    const idCliente = Number(id);
    
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
  });
}
