import { ApiResponse } from "#shared/api/response.js";

import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import TwoFAService from "#domains/auth/service/2faService.js";
import TwoFADto from "#domains/auth/model/twoFADto.js";

const twoFAService = new TwoFAService();
const authHelpers = new AuthHelpers();

const twoFAController = {
  // POST /v1/auth/2fa/setup
  async setup2FAHandler(request, reply) {
    const twoFADto = new TwoFADto(request.body);
    authHelpers.validate2FASetupForm(twoFADto);

    const qrCodeDataURL = await twoFAService.setup2FA(twoFADto.username);
    return ApiResponse.ok(reply, qrCodeDataURL);
  },

  // POST /v1/auth/2fa/verify
  async verify2FAHandler(request, reply) {
    const twoFADto = new TwoFADto(request.body);
    authHelpers.validate2FAVerifyForm(twoFADto);

    await twoFAService.verifyUser2FA(twoFADto);
    return ApiResponse.ok(reply, { verified: true });
  },
};

export default twoFAController;
