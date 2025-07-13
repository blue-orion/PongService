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

    if (!(await bcrypt.compare(passwd, user.passwd))) throw new PongException("invalid password", 400);

    twoFAService.verify2FACode(user.twoFASecret, token);

    return await generateTokens(jwtUtils, user);
  },

  async signOutUser(userId) {
    if (!userId) throw PongException.BAD_REQUEST;

    await authRepo.removeUserRefreshToken(userId);
  },

  async registerUser(username, passwd) {
    if (!username || !passwd) throw PongException.BAD_REQUEST;

    const hashed = await bcrypt.hash(passwd, 10);
    try {
      await userRepo.createUser({ username, passwd: hashed });
    } catch {
      throw PongException.ENTITY_NOT_FOUND;
    }
  },

  async refreshTokens(userId, refreshToken, jwtUtils) {
    const user = await userRepo.getUserByRefreshToken(refreshToken);
    if (user.id !== userId) throw PongException.UNAUTHORIZE;

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
      user = await userRepo.createUser({ username: email, passwd: null, profile_image: picture });
    }

    const jwt = await generateTokens(jwtUtils, user);
    return { jwt, user: new UserDto(user) };
  },
};

async function generateTokens(jwtUtils, user) {
  const accessToken = jwtUtils.generateAccessToken(user);
  const refreshToken = jwtUtils.generateRefreshToken(user);
  await authRepo.updateUserRefreshToken(user.id, refreshToken);

  return new TokenDto(accessToken, refreshToken);
}

export default authService;
