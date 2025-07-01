import { findUserByUsername, validatePassword } from "../domains/user/user.service.js";

export default async function authRoutes(fastify) {
  fastify.post("/auth/login", async (request, reply) => {
    const { username, password } = request.body;

    const user = await findUserByUsername(username);
    if (!user) {
      return reply.code(401).send({ message: "Invalid username or password" });
    }

    const isValid = await validatePassword(password, user.passwordHash);
    if (!isValid) {
      return reply.code(401).send({ message: "Invalid username or password" });
    }

    const token = fastify.jwt.sign({ userId: user.id, username: user.username });
    return reply.send({ token });
  });

  fastify.get("/auth/me", { preHandler: [fastify.authenticate] }, async (request, reply) => {
    return reply.send({ user: request.user });
  });
}
