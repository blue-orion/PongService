import axios from "axios";

import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import AuthRepo from "#domains/auth/repo/authRepo.js";
import RegisterOAuthDto from "#domains/auth/model/registerOAuthDto.js";
import TokenDto from "#domains/auth/model/tokenDto.js";
import TwoFAService from "#domains/auth/service/2faService.js";
import UserRepo from "#domains/user/repo/userRepo.js";

class AuthService {
  constructor(
    authHelpers = new AuthHelpers(),
    authRepo = new AuthRepo(),
    userRepo = new UserRepo(),
    twoFAService = new TwoFAService()
  ) {
    this.authHelpers = authHelpers;
    this.authRepo = authRepo;
    this.userRepo = userRepo;
    this.twoFAService = twoFAService;
  }

  async authenticateUser(loginDto, jwtUtils, encryptUtils) {
    const user = await this.userRepo.getUserByUsername(loginDto.username);

    await this.authHelpers.validateHashedPasswd(loginDto.passwd, user.passwd, encryptUtils);
    this.authHelpers.validateUserEnable(user);

    this.twoFAService.verify2FACode(user.twoFASecret, loginDto.token);

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

  async refreshTokens(userId, jwtUtils, refreshToken) {
    const user = await this.userRepo.getUserById(userId);
    this.authHelpers.validateUserRefreshToken(user, refreshToken);
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
