import twoFAService from "#domains/auth/service/2faService.js";
import { ApiResponse } from "#shared/api/response.js";

const twoFAController = {
  // POST /v1/auth/2fa/setup
  async setup2FAHandler(request, reply) {
    const { username } = request.body;
    const qrCodeDataURL = await twoFAService.setup2FA(username);
    return ApiResponse.ok(reply, qrCodeDataURL);
  },

  // POST /v1/auth/2fa/verify
  async verify2FAHandler(request, reply) {
    const { username, token } = request.body;
    await twoFAService.verifyUser2FA(username, token);
    return ApiResponse.ok(reply, { verified: true });
  },
};

export default twoFAController;
