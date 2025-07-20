import axios from "axios";

import TokenDto from "#domains/auth/model/tokenDto.js";
import RegisterOAuthDto from "#domains/user/model/registerOAuthDto.js";
import AuthRepo from "#domains/auth/repo/authRepo.js";
import UserRepo from "#domains/user/repo/userRepo.js";
import TwoFAService from "#domains/auth/service/2faService.js";
import PongException from "#shared/exception/pongException.js";

class AuthService {
  constructor(authRepo = new AuthRepo(), userRepo = new UserRepo(), twoFAService = new TwoFAService()) {
    this.authRepo = authRepo;
    this.userRepo = userRepo;
    this.twoFAService = twoFAService;
  }

  async authenticateUser(username, passwd, token, jwtUtils, encryptUtils) {
    const user = await this.userRepo.getUserByUsername(username);

    if (!(await encryptUtils.comparePasswd(passwd, user.passwd))) throw new PongException("invalid password", 400);
    if (!user.enabled) throw PongException.UNAUTHORIZED;

    this.twoFAService.verify2FACode(user.twoFASecret, token);

    return await this.generateTokens(jwtUtils, user);
  }

  async signOutUser(userId) {
    await this.authRepo.removeUserRefreshToken(userId);
  }

  async registerUser(registerDto, encryptUtils) {
    const hashed = await encryptUtils.hashPasswd(registerDto.passwd);
    registerDto.passwd = hashed;
    console.log("Registering user:", registerDto);
    await this.userRepo.createUser(registerDto);
  }

  async refreshTokens(jwtUtils, refreshToken) {
    const user = await this.userRepo.getUserByRefreshToken(refreshToken);
    if (user.refreshToken !== refreshToken) throw PongException.UNAUTHORIZED;
    return await this.generateTokens(jwtUtils, user);
  }

  async googleOAuth(jwtUtils, token) {
    const userRes = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.token?.access_token}` },
    });
    const { email, picture } = userRes.data;

    let user;
    try {
      user = await this.userRepo.getUserByUsername(email);
    } catch {
      user = await this.userRepo.createUser(new RegisterOAuthDto(email, null, email, picture));
    }

    return await this.generateTokens(jwtUtils, user);
  }

  async fortyTwoOAuth(jwtUtils, token) {
    const userRes = await axios.get("https://api.intra.42.fr/v2/me", {
      headers: { Authorization: `Bearer ${token.token?.access_token}` },
    });
    const { login, image_url } = userRes.data;

    let user;
    try {
      user = await this.userRepo.getUserByUsername(login);
    } catch {
      user = await this.userRepo.createUser(new RegisterOAuthDto(login, null, login, image_url));
    }

    return await this.generateTokens(jwtUtils, user);
  }

  async generateTokens(jwtUtils, user) {
    const accessToken = jwtUtils.generateAccessToken(user);
    const refreshToken = jwtUtils.generateRefreshToken(user);
    await this.authRepo.updateUserRefreshToken(user.id, refreshToken);

    return new TokenDto(accessToken, refreshToken);
  }
}

export default AuthService;
