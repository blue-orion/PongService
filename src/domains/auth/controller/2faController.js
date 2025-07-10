import { generate2FASecret, verify2FACode } from "../service/2faService.js";
import { getUserByUsername, updateUser2FASecret } from "#domains/user/repo/userRepo.js";

/**
 /auth/2fa/setup 
 */
export async function setup2FAHandler(request, reply) {
  const { username } = request.body;
  const user = await getUserByUsername(username);
  if (!user) {
    return reply.code(404).send({ message: "User not found" });
  }
  const { secret, qrCodeDataURL } = await generate2FASecret(username);
  await updateUser2FASecret(user.id, secret);
  return reply.send({ qrCodeDataURL });
}

/**
 /auth/2fa/verify
 */
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
