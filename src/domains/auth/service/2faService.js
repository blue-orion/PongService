import speakeasy from "speakeasy";
import qrcode from "qrcode";

import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import TwoFASecretDto from "#domains/auth/model/twoFASecretDto.js";
import UserRepo from "#domains/user/repo/userRepo.js";

class TwoFAService {
  constructor(userRepo = new UserRepo(), authHelpers = new AuthHelpers()) {
    this.userRepo = userRepo;
    this.authHelpers = authHelpers;
  }

  async setup2FA(username) {
    const user = await this.userRepo.getUserByUsername(username);
    const twoFASecretDto = await this.generate2FASecret(username);
    this.authHelpers.validate2FASecretForm(twoFASecretDto);

    await this.userRepo.updateUser2FASecret(user.id, twoFASecretDto.secret);
    return { qrCodeDataURL: twoFASecretDto.qrCodeDataURL };
  }

  async generate2FASecret(username) {
    const secret = speakeasy.generateSecret({ name: `MyApp (${username})` });
    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataURL = await qrcode.toDataURL(otpauthUrl);
    return new TwoFASecretDto(secret.base32, otpauthUrl, qrCodeDataURL);
  }

  async verifyUser2FA(twoFADto) {
    const user = await this.userRepo.getUserByUsername(twoFADto.username);
    this.authHelpers.validate2FASecret(user.two_fa_secret);

    this.verify2FACode(user.two_fa_secret, twoFADto.token);
  }

  verify2FACode(secret, token) {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
    this.authHelpers.validate2FAToken(verified);
  }
}

export default TwoFAService;
