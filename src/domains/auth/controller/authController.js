import authService from "#domains/auth/service/authService.js";
import { ApiResponse } from "#shared/api/response.js";

const authController = {
  // POST /v1/auth/login
  async loginHandler(request, reply) {
    const { username, passwd, token } = request.body;
    const jwtUtils = request.server.jwtUtils;
    const jwt = await authService.authenticateUser(username, passwd, token, jwtUtils);
    return ApiResponse.ok(reply, jwt);
  },

  // POST /v1/auth/logout
  async logoutHandler() {
    const userId = request.user.id;
    await authService.signOutUser(userId);
    return ApiResponse.ok(reply, { message: "Logged out successfully" });
  },

  // POST /v1/auth/register
  async registerHandler(request, reply) {
    const { username, passwd } = request.body;
    await authService.registerUser(username, passwd);
    return ApiResponse.ok(reply, { message: "User registered successfully" });
  },

  // POST /v1/auth/refresh
  async refreshTokenHandler(request, reply) {
    const { refreshToken } = request.body;
    const jwtUtils = request.server.jwtUtils;
    const jwt = await authService.refreshTokens(refreshToken, jwtUtils);
    return ApiResponse.ok(reply, jwt);
  },

  // GET /v1/auth/google/callback
  async googleOAuthCallbackHandler(request, reply) {
    const fastify = request.server;
    const jwtUtils = request.server.jwtUtils;
    const { jwt, user } = await authService.googleOAuth(fastify, jwtUtils);
    return ApiResponse.ok(reply, { jwt, user });
  },
};

export default authController;

/**
 * 회원 탈퇴 로직
 * enable colume 확인 로직/ 분기/ 필요한 부분 확인
 */
