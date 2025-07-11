import { removeUserRefreshToken } from "#domains/auth/repo/authRepo.js";
import { getUserById, createUser } from "#domains/user/repo/userRepo.js";
import bcrypt from "bcrypt";
import axios from "axios";

import authService from "#domains/auth/service/authService.js";
import userRepo from "#domains/user/repo/userRepo.js"; // 실행을 위해 임시로 달아놨지만 userService를 통해 호출되어야 함 여기 있으면 안됨
import authRepo from "#domains/auth/repo/authRepo.js"; // 마찬가지
import { ApiResponse } from "#shared/api/response.js";

const authController = {
  // POST /v1/auth/login
  async loginHandler(request, reply) {
    const { username, passwd, token } = request.body;
    const jwtUtils = request.server.jwtUtils;
    const result = await authService.authenticateUser(username, passwd, token, jwtUtils);
    return ApiResponse.ok(reply, result);
  },
};

export default authController;

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
    const jwtUtils = request.server.jwtUtils;

    if (!refreshToken) {
      return reply.code(400).send({ message: "Refresh token required" });
    }

    const payload = jwtUtils.verifyToken(fastify, refreshToken);
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

    const accessToken = jwtUtils.generateAccessToken(fastify, user);
    const newRefreshToken = jwtUtils.generateRefreshToken(fastify, user);
    await authRepo.updateUserRefreshToken(user.id, newRefreshToken);

    return reply.send({ accessToken, newRefreshToken });
  };
}

/**
 * /auth/google/callback
 */
export function googleOAuthCallbackHandler(fastify) {
  return async function (request, reply) {
    const jwtUtils = request.server.jwtUtils;
    const token = await fastify.googleOAuth.getAccessTokenFromAuthorizationCodeFlow(request);

    const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const { email, picture } = userRes.data;

    let user = await userRepo.getUserByUsername(email);
    if (!user) {
      user = await createUser({ username: email, passwd: null, profile_image: picture });
    }

    const accessToken = jwtUtils.generateAccessToken(fastify, user);
    const refreshToken = jwtUtils.generateRefreshToken(fastify, user);
    await authRepo.updateUserRefreshToken(user.id, refreshToken);

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
