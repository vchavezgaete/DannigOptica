import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";

// Aceptamos los "nombres viejos" y los mapeamos a los de la BD
const estadoInputEnum = z.enum([
  "pendiente",
  "confirmada",
  "cancelada",
  "no-show",
  "atendida",
]);

function mapEstado(input?: z.infer<typeof estadoInputEnum>) {
  switch (input) {
    case "pendiente":  return "Programada";
    case "confirmada": return "Confirmada";
    case "cancelada":  return "Cancelada";
    case "no-show":    return "NoShow";  
    case "atendida":   return "Atendida";
    default:           return "Programada";
  }
}

export async function appointmentRoutes(app: FastifyInstance) {
  // 🔐 Requiere JWT en todas las rutas de este módulo
  app.addHook("preHandler", (app as any).authenticate);

  // ── Schemas (compat: aceptamos leadId o clienteId)
  const createSchema = z.object({
    // compat viejo:
    leadId: z.number().int().optional(),
    // nuevo recomendado:
    clienteId: z.number().int().optional(),
    idOperativo: z.number().int().optional().nullable(),
    // string ISO -> Date
    fechaHora: z.string().transform((v) => new Date(v)),
    estado: estadoInputEnum.optional(),
  });

  const estadoSchema = z.object({
    estado: estadoInputEnum,
  });

  // ── Crear cita
  app.post("/", async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Datos inválidos", issues: parsed.error.flatten() });
    }
    const { leadId, clienteId, idOperativo, fechaHora, estado } = parsed.data;
    if (isNaN(+fechaHora)) return reply.code(400).send({ error: "fechaHora inválida" });

    // compat: si viene leadId, lo usamos como clienteId
    const idCliente =
      typeof clienteId === "number" ? clienteId :
      typeof leadId === "number" ? leadId : undefined;

    if (!idCliente) return reply.code(400).send({ error: "clienteId (o leadId) es requerido" });

    // Validar que el cliente exista
    const existe = await prisma.cliente.findUnique({ where: { idCliente } });
    if (!existe) return reply.code(404).send({ error: "Cliente no existe" });

    const cita = await prisma.cita.create({
      data: {
        idCliente,
        idOperativo: idOperativo ?? null,
        fechaHora,
        estado: mapEstado(estado) as any,
      },
      include: { cliente: true },
    });
    return reply.code(201).send(cita);
  });

  // ── Cambiar estado
  app.patch("/:id/estado", async (req, reply) => {
    const id = Number((req.params as any).id);
    console.log(`[DEBUG] Cambiando estado de cita ${id}`, req.body);
    
    if (!Number.isInteger(id)) {
      return reply.code(400).send({ error: "ID inválido" });
    }

    const parsed = estadoSchema.safeParse(req.body);
    if (!parsed.success) {
      console.log('[DEBUG] Error de validación:', parsed.error);
      return reply.code(400).send({ error: "Estado inválido" });
    }

    const nuevoEstado = mapEstado(parsed.data.estado);
    console.log(`[DEBUG] Estado mapeado: ${parsed.data.estado} -> ${nuevoEstado}`);
    
    const updated = await prisma.cita
      .update({
        where: { idCita: id },
        data: { estado: nuevoEstado as any },
        include: { cliente: true },
      })
      .catch((error: any) => {
        console.log('[DEBUG] Error en Prisma:', error);
        return null;
      });

    if (!updated) return reply.code(404).send({ error: "Cita no encontrada" });
    console.log('[DEBUG] Cita actualizada exitosamente:', updated);
    return updated;
  });

  // ── Reprogramar (cambiar fecha/hora)
  app.patch("/:id", async (req, reply) => {
    const id = Number((req.params as any).id);
    if (!Number.isInteger(id)) {
      return reply.code(400).send({ error: "ID inválido" });
    }

    const schema = z.object({ fechaHora: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Datos inválidos", issues: parsed.error.flatten() });
    }

    const fechaHora = new Date(parsed.data.fechaHora);
    if (isNaN(+fechaHora)) {
      return reply.code(400).send({ error: "fechaHora inválida" });
    }

    const updated = await prisma.cita
      .update({
        where: { idCita: id },
        data: { fechaHora },
        include: { cliente: true },
      })
      .catch(() => null);

    if (!updated) return reply.code(404).send({ error: "Cita no encontrada" });
    return updated;
  });

  // ── Listar (?from=ISO&to=ISO&clienteId=1&estado=confirmada)
  app.get("/", async (req) => {
    const { from, to, leadId, clienteId, estado } = (req.query || {}) as {
      from?: string;
      to?: string;
      leadId?: string;     // compat
      clienteId?: string;  // preferido
      estado?: "pendiente" | "confirmada" | "cancelada" | "no-show" | "atendida";
    };

    const where: any = {};
    if (from || to) {
      where.fechaHora = {};
      if (from) where.fechaHora.gte = new Date(from);
      if (to) where.fechaHora.lte = new Date(to);
    }

    const idCliente = clienteId ? Number(clienteId) : leadId ? Number(leadId) : undefined;
    if (idCliente) where.idCliente = idCliente;

    if (estado) where.estado = mapEstado(estado);

    return prisma.cita.findMany({
      where,
      include: { cliente: true },
      orderBy: { fechaHora: "desc" },
      take: 200,
    });
  });
}
