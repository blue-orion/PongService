export function generateAccessToken(fastify, user) {
  return fastify.jwt.sign({ userId: user.id, username: user.username, type: "access" }, { expiresIn: "1h" });
}

export function generateRefreshToken(fastify, user) {
  return fastify.jwt.sign({ userId: user.id, type: "refresh" }, { expiresIn: "7d" });
}

export async function verifyToken(fastify, token) {
  try {
    return await fastify.jwt.verify(token);
  } catch {
    return null;
  }
}
