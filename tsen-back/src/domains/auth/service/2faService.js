import speakeasy from "speakeasy";
import qrcode from "qrcode";

import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import TwoFASecretDto from "#domains/auth/model/twoFASecretDto.js";
import TwoFATempDto from "#domains/auth/model/twoFATempDto.js";
import UserRepo from "#domains/user/repo/userRepo.js";

class TwoFAService {
  constructor(userRepo = new UserRepo(), authHelpers = new AuthHelpers()) {
    this.userRepo = userRepo;
    this.authHelpers = authHelpers;
  }

  async setup2FA(username) {
    await this.userRepo.getUserByUsername(username);
    const twoFASecretDto = await this.generate2FASecret(username);
    this.authHelpers.validate2FASecretForm(twoFASecretDto);

    return new TwoFATempDto(twoFASecretDto);
  }

  async confirm2FASetup(twoFAConfirmDto) {
    const user = await this.userRepo.getUserByUsername(twoFAConfirmDto.username);
    const verified = this.verify2FACode(twoFAConfirmDto.tempSecret, twoFAConfirmDto.token);
    this.authHelpers.validate2FAToken(verified);

    await this.userRepo.updateUser2FASecret(user.id, twoFAConfirmDto.tempSecret);
  }

  async generate2FASecret(username) {
    const secret = speakeasy.generateSecret({ name: `MyApp (${username})` });
    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataURL = await qrcode.toDataURL(otpauthUrl);
    return new TwoFASecretDto(secret.base32, otpauthUrl, qrCodeDataURL);
  }

  async disable2FA(username) {
    const user = await this.userRepo.getUserByUsername(username);
    this.authHelpers.validateUser2FAEnable(user);

    await this.userRepo.updateUser2FASecret(user.id, null);
  }

  async verifyUser2FA(twoFADto) {
    const user = await this.userRepo.getUserByUsername(twoFADto.username);
    this.authHelpers.validate2FASecret(user.two_fa_secret);

    this.verify2FACode(user.two_fa_secret, twoFADto.token);
  }

  verify2FACode(secret, token) {
    if (!secret) {
      return false;
    }
    const verified = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });
    this.authHelpers.validate2FAToken(verified);
    return verified;
  }
}

export default TwoFAService;
