import speakeasy from "speakeasy";
import qrcode from "qrcode";

import PongException from "#shared/exception/pongException.js";

const twoFAService = {
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

// 2FA 시크릿 생성 및 QR코드 데이터 반환
export async function generate2FASecret(username) {
  const secret = speakeasy.generateSecret({
    name: `MyApp (${username})`,
  });
  const otpauthUrl = secret.otpauth_url;
  const qrCodeDataURL = await qrcode.toDataURL(otpauthUrl);
  return {
    secret: secret.base32,
    otpauthUrl,
    qrCodeDataURL,
  };
}
