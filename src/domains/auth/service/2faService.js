import speakeasy from "speakeasy";
import qrcode from "qrcode";

import userRepo from "#domains/user/repo/userRepo.js";
import PongException from "#shared/exception/pongException.js";

const twoFAService = {
  async setup2FA(username) {
    const user = userRepo.getUserByUsername(username);
    if (!user) throw new PongException.NOT_FOUND();

    const { secret, qrCodeDataURL } = await generate2FASecret(username);
    await userRepo.updateUser2FASecret(user.id, secret);
    return { qrCodeDataURL };
  },

  async generate2FASecret(username) {
    const secret = speakeasy.generateSecret({ name: `MyApp (${username})` });
    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataURL = await qrcode.toDataURL(otpauthUrl);
    return { secret: secret.base32, otpauthUrl, qrCodeDataURL };
  },

  async verifyUser2FA(username, token) {
    const user = await userRepo.getUserByUsername(username);
    if (!user || !user.twoFASecret) throw new PongException.ENTITY_NOT_FOUNT();

    const verified = twoFAService.verify2FACode(username, token);
    return true;
  },

  verify2FACode(secret, token) {
    if (!secret) return;
    if (!token) throw new PongException("2FA code required", 400);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
    if (!verified) throw new PongException("Invalid 2FA code", 400);

    return verified;
  },
};

export default twoFAService;
