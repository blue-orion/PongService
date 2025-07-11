import bcrypt from "bcrypt";

import TokenDto from "#domains/auth/model/tokenDto.js";
import authRepo from "#domains/auth/repo/authRepo.js";
import userRepo from "#domains/user/repo/userRepo.js";
import twoFAService from "#domains/auth/service/2faService.js";
import PongException from "#shared/exception/pongException.js";

const authService = {
  async authenticateUser(username, passwd, token, jwtUtils) {
    const user = await userRepo.getUserByUsername(username);
    if (!user) throw PongException.ENTITY_NOT_FOUNT;
    if (!(await bcrypt.compare(passwd, user.passwd))) throw new PongException("invalid password", 400);

    twoFAService.verify2FACode(user.twoFASecret, token);

    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
    await authRepo.updateUserRefreshToken(user.id, refreshToken);

    return new TokenDto(accessToken, refreshToken);
  },
};

export default authService;
