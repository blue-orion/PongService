import speakeasy from "speakeasy";
import qrcode from "qrcode";

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

// 2FA 코드 검증
export function verify2FACode(secret, token) {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}
