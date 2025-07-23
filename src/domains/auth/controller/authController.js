import { ApiResponse } from "#shared/api/response.js";

import AuthService from "#domains/auth/service/authService.js";
import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import LoginDto from "#domains/auth/model/loginDto.js";
import RegisterDto from "#domains/auth/model/registerDto.js";

const authService = new AuthService();
const authHelpers = new AuthHelpers();

const authController = {
  // POST /v1/auth/login
  async loginHandler(request, reply) {
    const loginDto = new LoginDto(request.body);
    authHelpers.validateLoginForm(loginDto);

    const jwtUtils = request.server.jwtUtils;
    const encryptUtils = await request.server.encryptUtils;
    const jwt = await authService.authenticateUser(loginDto, jwtUtils, encryptUtils);
    return ApiResponse.ok(reply, jwt);
  },

  // POST /v1/auth/login/check
  async checkLoginHandler(request, reply) {
    const loginDto = new LoginDto(request.body);
    authHelpers.validateLoginForm(loginDto);

    const isValid = await authService.checkUser2FAEnabled(loginDto);
    return ApiResponse.ok(reply, { isValid });
  },

  // POST /v1/auth/logout
  async logoutHandler(request, reply) {
    const formData = { userId: request.body.id };
    authHelpers.validateLogoutForm(formData);

    await authService.signOutUser(formData.userId);
    return ApiResponse.ok(reply, { message: "Logged out successfully" });
  },

  // POST /v1/auth/register
  async registerHandler(request, reply) {
    const registerDto = new RegisterDto(request.body);
    authHelpers.validateRegisterForm(registerDto);

    const encryptUtils = await request.server.encryptUtils;
    await authService.registerUser(registerDto, encryptUtils);
    return ApiResponse.ok(reply, { message: "User registered successfully" });
  },

  // GET /v1/auth/refresh
  async refreshTokenHandler(request, reply) {
    const userId = Number(request.user.id);
    const refreshToken = request.headers.authorization?.replace(/^Bearer\s/, "");
    const jwtUtils = request.server.jwtUtils;
    const jwt = await authService.refreshTokens(userId, jwtUtils, refreshToken);
    return ApiResponse.ok(reply, jwt);
  },

  // GET /v1/auth/google/callback
  async googleOAuthCallbackHandler(request, reply) {
    const jwtUtils = request.server.jwtUtils;
    const token = await request.server.googleOAuth.getAccessTokenFromAuthorizationCodeFlow(request);
    const jwt = await this.authService.googleOAuth(jwtUtils, token);
    reply.type("text/html").send(this.oauthTokenFormat(jwt));
  },

  // GET /v1/auth/42/callback
  async fortyOAuthCallbackHandler(request, reply) {
    const jwtUtils = request.server.jwtUtils;
    const token = await request.server.fortyTwoOAuth.getAccessTokenFromAuthorizationCodeFlow(request);
    const jwt = await authService.fortyTwoOAuth(jwtUtils, token);
    reply.type("text/html").send(this.oauthTokenFormat(jwt));
  },

  oauthTokenFormat(token) {
    return `
            <!DOCTYPE html>
            <html>
            <head></head>
            <body>
                <script>
                    window.opener.postMessage({
                        type: 'OAUTH_RESULT',
                        success: true,
                        data: ${JSON.stringify(token)}
                    }, '*');
                    window.close();
                </script>
            </body>
            </html>
        `;
  },
};

export default authController;
