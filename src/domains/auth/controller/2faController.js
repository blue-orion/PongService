import { generate2FASecret, verify2FACode } from "../service/2faService.js";
import { getUserByUsername, updateUser2FASecret } from "../repo/authRepo.js";

// 2FA 시크릿 및 QR코드 발급
export async function setup2FAHandler(request, reply) {
  const { username } = request.body;
  const user = await getUserByUsername(username);
  if (!user) {
    return reply.code(404).send({ message: "User not found" });
  }
  const { secret, qrCodeDataURL } = await generate2FASecret(username);
  await updateUser2FASecret(user.id, secret); // DB에 시크릿 저장
  return reply.send({ qrCodeDataURL });
}

// 2FA 코드 검증
export async function verify2FAHandler(request, reply) {
  const { username, token } = request.body;
  const user = await getUserByUsername(username);
  if (!user || !user.twoFASecret) {
    return reply.code(400).send({ message: "2FA not setup" });
  }
  const verified = verify2FACode(user.twoFASecret, token);
  if (!verified) {
    return reply.code(401).send({ message: "Invalid 2FA code" });
  }
  return reply.send({ verified: true });
}
