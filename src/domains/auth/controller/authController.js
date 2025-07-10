import { authenticateUser } from "../service/authService.js";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../service/jwtService.js";
import { verify2FACode } from "../service/2faService.js";
import { updateUserRefreshToken, removeUserRefreshToken } from "#domains/auth/repo/authRepo.js";
import { getUserById, createUser } from "#domains/user/repo/userRepo.js";
import bcrypt from "bcrypt";

/**
 /auth/login
 */
export function loginHandler(fastify) {
  return async function (request, reply) {
    const { username, password, token } = request.body;

    const user = await authenticateUser(username, password);
    if (!user) {
      return reply.code(401).send({ message: "Invalid username or password" });
    }

    if (user.twoFASecret) {
      if (!token) {
        return reply.code(206).send({ message: "2FA code required" });
      }
      const verified = verify2FACode(user.twoFASecret, token);
      if (!verified) {
        return reply.code(401).send({ message: "Invalid 2FA code" });
      }
    }

    const accessToken = generateAccessToken(fastify, user);
    const refreshToken = generateRefreshToken(fastify, user);
    await updateUserRefreshToken(user.id, refreshToken);

    return reply.send({ accessToken, refreshToken });
  };
}

/**
 /auth/logout
 */
export function logoutHandler() {
  return async function (request, reply) {
    const userId = request.user.id;
    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }
    await removeUserRefreshToken(userId);
    return reply.send({ message: "Logged out successfully" });
  };
}

export async function registerHandler(request, reply) {
  const { username, password } = request.body;
  if (!username || !password) {
    return reply.code(400).send({ message: "Username and password required" });
  }

  const hashed = await bcrypt.hash(password, 10);
  try {
    await createUser({ username, passwd: hashed });
    return reply.send({ message: "User registered successfully" });
  } catch {
    return reply.code(409).send({ message: "Username already exists" });
  }
}

/**
 /auth/refresh
 */
export function refreshTokenHandler(fastify) {
  return async function (request, reply) {
    const { refreshToken } = request.body;
    if (!refreshToken) {
      return reply.code(400).send({ message: "Refresh token required" });
    }

    const payload = await verifyToken(fastify, refreshToken);
    if (!payload || payload.type !== "refresh") {
      return reply.code(401).send({ message: "Invalid refresh token" });
    }

    const user = await getUserById(payload.userId);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }

    if (user.refresh_token !== refreshToken) {
      return reply.code(401).send({ message: "Refresh token mismatch" });
    }

    const accessToken = generateAccessToken(fastify, user);
    return reply.send({ accessToken });
  };
}

/**
 /auth/me
 */
export async function meHandler(request, reply) {
  return reply.send({ user: request.user });
}
