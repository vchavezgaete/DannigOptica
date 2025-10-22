import { FastifyInstance } from "fastify";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function authRoutes(app: FastifyInstance) {
  // Semilla opcional para crear rol y usuario admin
  app.post("/seed", async (req, reply) => {
    try {
      // Lee credenciales desde variables de entorno
      const adminName = process.env.ADMIN_NAME || "Admin";
      const adminEmail = process.env.ADMIN_EMAIL || "admin@dannig.local";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

      const adminRol = await prisma.rol.upsert({
        where: { nombre: "admin" },
        update: {},
        create: { nombre: "admin" },
      });

      const hash = await bcrypt.hash(adminPassword, 10);

      const adminUser = await prisma.usuario.upsert({
        where: { correo: adminEmail },
        update: { nombre: adminName, hashPassword: hash, activo: 1 }, // <- number
        create: {
          nombre: adminName,
          correo: adminEmail,
          hashPassword: hash,
          activo: 1, // <- number
        },
      });

      await prisma.usuarioRol.upsert({
        where: {
          idUsuario_idRol: {
            idUsuario: adminUser.idUsuario,
            idRol: adminRol.idRol,
          },
        },
        update: {},
        create: {
          idUsuario: adminUser.idUsuario,
          idRol: adminRol.idRol,
        },
      });

      return {
        ok: true,
        usuario: { id: adminUser.idUsuario, correo: adminUser.correo },
        rol: adminRol.nombre,
      };
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: "Error en seed: " + err.message });
    }
  });

  // Login
  app.post("/login", async (req, reply) => {
    try {
      const body = req.body as { email?: string; password?: string };
      if (!body?.email || !body?.password) {
        return reply.code(400).send({ error: "email y password son requeridos" });
      }

      const user = await prisma.usuario.findUnique({
        where: { correo: body.email },
        include: { roles: { include: { rol: true } } },
      });

      if (!user || user.activo !== 1) {
        return reply.code(401).send({ error: "Credenciales inválidas" });
      }

      const ok = await bcrypt.compare(body.password, user.hashPassword);
      if (!ok) return reply.code(401).send({ error: "Credenciales inválidas" });

      const token = jwt.sign(
        {
          sub: user.idUsuario,
          correo: user.correo,
          roles: user.roles.map(r => r.rol.nombre),
        },
        process.env.JWT_SECRET || "dev_secret",
        { expiresIn: "8h" }
      );

      return {
        token,
        user: {
          id: user.idUsuario,
          nombre: user.nombre,
          correo: user.correo,
          roles: user.roles.map(r => r.rol.nombre),
        },
      };
    } catch (err: any) {
      req.log.error(err);
      return reply.status(500).send({ error: "Error en login: " + err.message });
    }
  });
}
