import authService from "#domains/auth/service/authService.js";
import { RegisterDto } from "#domains/user/model/registerDto.js";
import { ApiResponse } from "#shared/api/response.js";

const authController = {
  // POST /v1/auth/login
  async loginHandler(request, reply) {
    const { username, passwd, token } = request.body;
    const jwtUtils = request.server.jwtUtils;
    const encryptUtils = await request.server.encryptUtils;
    const jwt = await authService.authenticateUser(username, passwd, token, jwtUtils, encryptUtils);
    return ApiResponse.ok(reply, jwt);
  },

  // POST /v1/auth/logout
  async logoutHandler(request, reply) {
    const userId = request.user.id;
    await authService.signOutUser(userId);
    return ApiResponse.ok(reply, { message: "Logged out successfully" });
  },

  // POST /v1/auth/register
  async registerHandler(request, reply) {
    const registerDto = new RegisterDto(request.body);
    const encryptUtils = await request.server.encryptUtils;
    await authService.registerUser(registerDto, encryptUtils);
    return ApiResponse.ok(reply, { message: "User registered successfully" });
  },

  // POST /v1/auth/refresh
  async refreshTokenHandler(request, reply) {
    const refreshToken = request.headers.authorization?.replace(/^Bearer\s/, "");
    const jwtUtils = request.server.jwtUtils;
    const { userId } = request.user;
    const jwt = await authService.refreshTokens(userId, refreshToken, jwtUtils);
    return ApiResponse.ok(reply, jwt);
  },

  // GET /v1/auth/google/callback
  async googleOAuthCallbackHandler(request, reply) {
    const jwtUtils = request.server.jwtUtils;
    const token = await request.server.googleOAuth.getAccessTokenFromAuthorizationCodeFlow(request);
    const jwt = await authService.googleOAuth(jwtUtils, token);
    return ApiResponse.ok(reply, jwt);
  },
};

export default authController;

/** todo
 * 회원 탈퇴 로직
 * enable colume 확인 로직/ 분기/ 필요한 부분 확인
 */
