import { authenticateUser } from "../service/authService.js";
import { generateAccessToken } from "../service/jwtService.js";

export function loginHandler(fastify) {
  return async function (request, reply) {
    const { username, password } = request.body;

    const user = await authenticateUser(username, password);
    if (!user) {
      return reply.code(401).send({ message: "Invalid username or password" });
    }

    const token = generateAccessToken(fastify, user);
    return reply.send({ token });
  };
}

export async function meHandler(request, reply) {
  return reply.send({ user: request.user });
}
