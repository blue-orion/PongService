import axios from "axios";

import TokenDto from "#domains/auth/model/tokenDto.js";
import RegisterDto from "#domains/user/model/registerDto.js";
import authRepo from "#domains/auth/repo/authRepo.js";
import userRepo from "#domains/user/repo/userRepo.js";
import twoFAService from "#domains/auth/service/2faService.js";
import PongException from "#shared/exception/pongException.js";

const authService = {
  async authenticateUser(username, passwd, token, jwtUtils, encryptUtils) {
    const user = await userRepo.getUserByUsername(username);

    if (!(await encryptUtils.comparePasswd(passwd, user.passwd))) throw new PongException("invalid password", 400);
    if (!user.enabled) throw PongException.UNAUTHORIZED;

    twoFAService.verify2FACode(user.twoFASecret, token);

    return await generateTokens(jwtUtils, user);
  },

  async signOutUser(userId) {
    if (!userId) throw PongException.BAD_REQUEST;

    await authRepo.removeUserRefreshToken(userId);
  },

  async registerUser(registerDto, encryptUtils) {
    const { username, passwd, nickname } = registerDto;
    if (!username || !passwd || !nickname) throw PongException.NOT_FOUND;

    const hashed = await encryptUtils.hashPasswd(passwd);
    registerDto.passwd = hashed;
    try {
      await userRepo.createUser(registerDto);
    } catch {
      throw PongException.ENTITY_NOT_FOUND;
    }
  },

  async refreshTokens(jwtUtils, refreshToken) {
    const user = userRepo.getUserByRefreshToken(refreshToken);
    if (user.refreshToken !== refreshToken) throw PongException.UNAUTHORIZED;
    return await generateTokens(jwtUtils, user);
  },

  async googleOAuth(jwtUtils, token) {
    const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const { email, picture } = userRes.data;

    let user;
    try {
      user = await userRepo.getUserByUsername(email);
    } catch {
      user = await userRepo.createUser(new RegisterDto(email, null, email, picture));
    }

    return await generateTokens(jwtUtils, user);
  },

  async enableUser(username, passwd, encryptUtils) {
    const user = await userRepo.getUserByUsername(username);
    if (!(await encryptUtils.comparePasswd(passwd, user.passwd))) throw PongException.UNAUTHORIZED;

    if (user.enabled) throw PongException.BAD_REQUEST;
    const userId = user.id;
    await authRepo.removeUserRefreshToken(userId);
    await userRepo.enableUser(userId);
  },
};

async function generateTokens(jwtUtils, user) {
  const accessToken = jwtUtils.generateAccessToken(user);
  const refreshToken = jwtUtils.generateRefreshToken(user);
  await authRepo.updateUserRefreshToken(user.id, refreshToken);

  return new TokenDto(accessToken, refreshToken);
}

export default authService;
