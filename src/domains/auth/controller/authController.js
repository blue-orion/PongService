import AuthService from "#domains/auth/service/authService.js";
import RegisterDto from "#domains/user/model/registerDto.js";
import { ApiResponse } from "#shared/api/response.js";
import PongException from "#shared/exception/pongException.js";

const authController = {
  // POST /v1/auth/login
  async loginHandler(request, reply) {
    const { username, passwd, token } = request.body;
    const jwtUtils = request.server.jwtUtils;
    const encryptUtils = await request.server.encryptUtils;
    const jwt = await AuthService.authenticateUser(username, passwd, token, jwtUtils, encryptUtils);
    return ApiResponse.ok(reply, jwt);
  },

  // POST /v1/auth/logout
  async logoutHandler(request, reply) {
    const userId = request.user.id;
    if (!userId) throw PongException.BAD_REQUEST;
    await AuthService.signOutUser(userId);
    return ApiResponse.ok(reply, { message: "Logged out successfully" });
  },

  // POST /v1/auth/register
  async registerHandler(request, reply) {
    const registerDto = new RegisterDto(request.body);
    console.log("Registering user:", registerDto);
    const encryptUtils = await request.server.encryptUtils;
    await AuthService.registerUser(registerDto, encryptUtils);
    return ApiResponse.ok(reply, { message: "User registered successfully" });
  },

  // POST /v1/auth/refresh
  async refreshTokenHandler(request, reply) {
    const refreshToken = request.headers.authorization?.replace(/^Bearer\s/, "");
    const jwtUtils = request.server.jwtUtils;
    const jwt = await AuthService.refreshTokens(jwtUtils, refreshToken);
    return ApiResponse.ok(reply, jwt);
  },

  // GET /v1/auth/google/callback
  async googleOAuthCallbackHandler(request, reply) {
    const jwtUtils = request.server.jwtUtils;
    const token = await request.server.googleOAuth.getAccessTokenFromAuthorizationCodeFlow(request);
    const jwt = await AuthService.googleOAuth(jwtUtils, token);
    return ApiResponse.ok(reply, jwt);
  },

  // GET /v1/auth/42/callback
  async fortyOAuthCallbackHandler(request, reply) {
    const jwtUtils = request.server.jwtUtils;
    const token = await request.server.fortyTwoOAuth.getAccessTokenFromAuthorizationCodeFlow(request);
    const jwt = await AuthService.fortyTwoOAuth(jwtUtils, token);
    return ApiResponse.ok(reply, jwt);
  },
};

export default authController;
