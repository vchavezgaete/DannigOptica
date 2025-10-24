"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function authRoutes(app) {
    // Semilla opcional para crear roles y usuarios admin y captador
    app.post("/seed", async (req, reply) => {
        try {
            // Lee credenciales desde variables de entorno
            const adminName = process.env.ADMIN_NAME || "Admin";
            const adminEmail = process.env.ADMIN_EMAIL || "admin@dannig.local";
            const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
            const captadorName = process.env.CAPTADOR_NAME || "Captador";
            const captadorEmail = process.env.CAPTADOR_EMAIL || "captador@dannig.local";
            const captadorPassword = process.env.CAPTADOR_PASSWORD || "captador123";
            const oftalmologoName = process.env.OFTALMOLOGO_NAME || "Dr. Oftalmólogo";
            const oftalmologoEmail = process.env.OFTALMOLOGO_EMAIL || "oftalmologo@dannig.local";
            const oftalmologoPassword = process.env.OFTALMOLOGO_PASSWORD || "oftalmologo123";
            // Crear roles
            const adminRol = await prisma.rol.upsert({
                where: { nombre: "admin" },
                update: {},
                create: { nombre: "admin" },
            });
            const captadorRol = await prisma.rol.upsert({
                where: { nombre: "captador" },
                update: {},
                create: { nombre: "captador" },
            });
            const oftalmologoRol = await prisma.rol.upsert({
                where: { nombre: "oftalmologo" },
                update: {},
                create: { nombre: "oftalmologo" },
            });
            // Crear usuario admin
            const adminHash = await bcrypt_1.default.hash(adminPassword, 10);
            const adminUser = await prisma.usuario.upsert({
                where: { correo: adminEmail },
                update: { nombre: adminName, hashPassword: adminHash, activo: 1 },
                create: {
                    nombre: adminName,
                    correo: adminEmail,
                    hashPassword: adminHash,
                    activo: 1,
                },
            });
            // Crear usuario captador
            const captadorHash = await bcrypt_1.default.hash(captadorPassword, 10);
            const captadorUser = await prisma.usuario.upsert({
                where: { correo: captadorEmail },
                update: { nombre: captadorName, hashPassword: captadorHash, activo: 1 },
                create: {
                    nombre: captadorName,
                    correo: captadorEmail,
                    hashPassword: captadorHash,
                    activo: 1,
                },
            });
            // Crear usuario oftalmólogo
            const oftalmologoHash = await bcrypt_1.default.hash(oftalmologoPassword, 10);
            const oftalmologoUser = await prisma.usuario.upsert({
                where: { correo: oftalmologoEmail },
                update: { nombre: oftalmologoName, hashPassword: oftalmologoHash, activo: 1 },
                create: {
                    nombre: oftalmologoName,
                    correo: oftalmologoEmail,
                    hashPassword: oftalmologoHash,
                    activo: 1,
                },
            });
            // Asignar rol admin
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
            // Asignar rol captador
            await prisma.usuarioRol.upsert({
                where: {
                    idUsuario_idRol: {
                        idUsuario: captadorUser.idUsuario,
                        idRol: captadorRol.idRol,
                    },
                },
                update: {},
                create: {
                    idUsuario: captadorUser.idUsuario,
                    idRol: captadorRol.idRol,
                },
            });
            // Asignar rol oftalmólogo
            await prisma.usuarioRol.upsert({
                where: {
                    idUsuario_idRol: {
                        idUsuario: oftalmologoUser.idUsuario,
                        idRol: oftalmologoRol.idRol,
                    },
                },
                update: {},
                create: {
                    idUsuario: oftalmologoUser.idUsuario,
                    idRol: oftalmologoRol.idRol,
                },
            });
            return {
                ok: true,
                usuarios: [
                    { id: adminUser.idUsuario, correo: adminUser.correo, rol: adminRol.nombre },
                    { id: captadorUser.idUsuario, correo: captadorUser.correo, rol: captadorRol.nombre },
                    { id: oftalmologoUser.idUsuario, correo: oftalmologoUser.correo, rol: oftalmologoRol.nombre },
                ],
            };
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Error en seed: " + err.message });
        }
    });
    // Login
    app.post("/login", async (req, reply) => {
        try {
            const body = req.body;
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
            const ok = await bcrypt_1.default.compare(body.password, user.hashPassword);
            if (!ok)
                return reply.code(401).send({ error: "Credenciales inválidas" });
            const token = jsonwebtoken_1.default.sign({
                sub: user.idUsuario,
                correo: user.correo,
                roles: user.roles.map(r => r.rol.nombre),
            }, process.env.JWT_SECRET || "dev_secret", { expiresIn: "8h" });
            return {
                token,
                user: {
                    id: user.idUsuario,
                    nombre: user.nombre,
                    correo: user.correo,
                    roles: user.roles.map(r => r.rol.nombre),
                },
            };
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Error en login: " + err.message });
        }
    });
}
