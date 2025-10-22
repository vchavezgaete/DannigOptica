import fp from "fastify-plugin";
import jwt from "jsonwebtoken";

export default fp(async (app) => {
  // Verifica el Bearer Token y adjunta el payload a req.user
  app.decorate("authenticate", async (req: any, reply: any) => {
    const auth = req.headers?.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return reply.code(401).send({ error: "Token requerido" });
    }
    const token = auth.slice("Bearer ".length);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
      req.user = payload; // { sub, correo, roles: string[] }
    } catch {
      return reply.code(401).send({ error: "Token inválido" });
    }
  });

  // Crea un preHandler que exige uno de los roles indicados
  app.decorate("authorize", (roles: string[]) => {
    return async (req: any, reply: any) => {
      if (!req.user?.roles?.some((r: string) => roles.includes(r))) {
        return reply.code(403).send({ error: "No autorizado" });
      }
    };
  });
});
