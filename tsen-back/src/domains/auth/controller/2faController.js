import { ApiResponse } from "#shared/api/response.js";

import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import TwoFAConfirmDto from "#domains/auth/model/twoFAConfirmDto.js";
import TwoFAService from "#domains/auth/service/2faService.js";
import TwoFADto from "#domains/auth/model/twoFADto.js";

const twoFAService = new TwoFAService();
const authHelpers = new AuthHelpers();

const twoFAController = {
  // POST /v1/auth/2fa/setup
  async setup2FAHandler(request, reply) {
    const twoFADto = new TwoFADto(request.body);
    authHelpers.validate2FAForm(twoFADto);

    const twoFATemp = await twoFAService.setup2FA(twoFADto.username);
    return ApiResponse.ok(reply, twoFATemp);
  },

  // POST /v1/auth/2fa/confirm
  async confirm2FAHandler(request, reply) {
    const twoFAConfirmDto = new TwoFAConfirmDto(request.body);
    authHelpers.validate2FAConfirmForm(twoFAConfirmDto);

    await twoFAService.confirm2FASetup(twoFAConfirmDto);
    return ApiResponse.ok(reply, { message: "2FA activated successfully" });
  },

  // POST /v1/auth/2fa/disable
  async disable2FAHandler(request, reply) {
    const twoFADto = new TwoFADto(request.body);
    authHelpers.validate2FAForm(twoFADto);

    await twoFAService.disable2FA(twoFADto.username);
    return ApiResponse.ok(reply, { message: "2FA disabled successfully" });
  },

  // POST /v1/auth/2fa/verify
  async verify2FAHandler(request, reply) {
    const twoFADto = new TwoFADto(request.body);
    authHelpers.validate2FAForm(twoFADto);

    await twoFAService.verifyUser2FA(twoFADto);
    return ApiResponse.ok(reply, { verified: true });
  },
};

export default twoFAController;
