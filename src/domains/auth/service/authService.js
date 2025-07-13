import bcrypt from "bcrypt";
import axios from "axios";

import TokenDto from "#domains/auth/model/tokenDto.js";
import UserDto from "#domains/user/model/userDto.js";
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

  async signOutUser(userId) {
    if (!userId) throw PongException.UNAUTHORIZE;

    await authRepo.removeUserRefreshToken(userId);
  },

  async registerUser(username, passwd) {
    if (!username || !passwd) throw PongException.ENTITY_NOT_FOUNT;

    const hashed = await bcrypt.hash(passwd, 10);
    try {
      await userRepo.createUser({ username, passwd: hashed });
    } catch {
      throw PongException.ENTITY_NOT_FOUNT;
    }
  },

  async refreshTokens(refreshToken, jwtUtils) {
    if (!refreshToken) throw PongException.ENTITY_NOT_FOUNT;

    const payload = jwtUtils.verifyToken(refreshToken);
    if (!payload || payload.type !== "refresh") throw new PongException("invalid refresh token", 400);

    const user = await userRepo.getUserById(payload.userId);
    if (!user) throw new PongException.NOT_FOUND();
    if (user.refresh_token !== refreshToken) throw PongException.UNAUTHORIZE;

    const accessToken = jwtUtils.generateAccessToken(user);
    const newRefreshToken = jwtUtils.generateRefreshToken(user);
    await authRepo.updateUserRefreshToken(user.id, newRefreshToken);

    return new TokenDto(accessToken, newRefreshToken);
  },

  async googleOAuth(jwtUtils, token) {
    const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const { email, picture } = userRes.data;

    let user = await userRepo.getUserByUsername(email);
    if (!user) {
      user = await userRepo.createUser({ username: email, passwd: null, profile_image: picture });
    }

    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
    await authRepo.updateUserRefreshToken(user.id, refreshToken);

    return { jwt: new TokenDto(accessToken, refreshToken), user: new UserDto(user) };
  },
};

export default authService;
