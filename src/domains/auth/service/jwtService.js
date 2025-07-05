export function generateAccessToken(fastify, user) {
  return fastify.jwt.sign({ userId: user.id, username: user.username }, { expiresIn: "1h" });
}

export function generateRefreshToken(fastify, user) {
  return fastify.jwt.sign({ userId: user.id }, { expiresIn: "7d" });
}

export async function verifyToken(fastify, token) {
  try {
    return await fastify.jwt.verify(token);
  } catch {
    return null;
  }
}
