import { authenticateUser } from "../service/authService.js";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../service/jwtService.js";
import { verify2FACode } from "../service/2faService.js";
import { updateUserRefreshToken, removeUserRefreshToken } from "#domains/auth/repo/authRepo.js";
import { getUserById, getUserByUsername, createUser } from "#domains/user/repo/userRepo.js";
import bcrypt from "bcrypt";
import axios from "axios";

/**
 * /auth/login
 */
export function loginHandler(fastify) {
  return async function (request, reply) {
    const { username, passwd, token } = request.body;

    const user = await authenticateUser(username, passwd);
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
 * /auth/logout
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

/**
 * /auth/register
 */
export async function registerHandler(request, reply) {
  const { username, passwd } = request.body;
  if (!username || !passwd) {
    return reply.code(400).send({ message: "Username and password required" });
  }

  const hashed = await bcrypt.hash(passwd, 10);
  try {
    await createUser({ username, passwd: hashed });
    return reply.send({ message: "User registered successfully" });
  } catch {
    return reply.code(409).send({ message: "Username already exists" });
  }
}

/**
 * /auth/refresh
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
    const newRefreshToken = generateRefreshToken(fastify, user);
    await updateUserRefreshToken(user.id, newRefreshToken);

    return reply.send({ accessToken, newRefreshToken });
  };
}

/**
 * /auth/google/callback
 */
export function googleOAuthCallbackHandler(fastify) {
  return async function (request, reply) {
    const token = await fastify.googleOAuth.getAccessTokenFromAuthorizationCodeFlow(request);

    const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const { email, picture } = userRes.data;

    let user = await getUserByUsername(email);
    if (!user) {
      user = await createUser({ username: email, passwd: null, profile_image: picture });
    }

    const accessToken = generateAccessToken(fastify, user);
    const refreshToken = generateRefreshToken(fastify, user);
    await updateUserRefreshToken(user.id, refreshToken);

    return reply.send({
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, profile_image: user.profile_image },
    });
  };
}

/**
 * /auth/me
 */
export async function meHandler(request, reply) {
  return reply.send({ user: request.user });
}

/**
 * 회원 탈퇴 로직
 * enable colume 확인 로직/ 분기/ 필요한 부분 확인
 */
