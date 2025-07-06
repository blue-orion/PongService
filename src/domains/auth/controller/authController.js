import { authenticateUser } from "../service/authService.js";
import { generateAccessToken } from "../service/jwtService.js";
import { verify2FACode } from "../service/2faService.js";

export function loginHandler(fastify) {
  return async function (request, reply) {
    const { username, password, token } = request.body;

    const user = await authenticateUser(username, password);
    if (!user) {
      return reply.code(401).send({ message: "Invalid username or password" });
    }

    // 2FA 활성화 여부 확인
    if (user.twoFASecret) {
      if (!token) {
        return reply.code(206).send({ message: "2FA code required" });
      }
      const verified = verify2FACode(user.twoFASecret, token);
      if (!verified) {
        return reply.code(401).send({ message: "Invalid 2FA code" });
      }
    }

    const jwt = generateAccessToken(fastify, user);
    return reply.send({ token: jwt });
  };
}

export async function meHandler(request, reply) {
  return reply.send({ user: request.user });
}
