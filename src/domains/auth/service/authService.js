import axios from "axios";

import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import AuthRepo from "#domains/auth/repo/authRepo.js";
import HashedDto from "#domains/auth/model/hashedDto.js";
import RegisterOAuthDto from "#domains/auth/model/registerOAuthDto.js";
import TokenDto from "#domains/auth/model/tokenDto.js";
import TwoFAService from "#domains/auth/service/2faService.js";
import UserRepo from "#domains/user/repo/userRepo.js";
import UserService from "#domains/user/service/userService.js";

class AuthService {
  constructor(
    authHelpers = new AuthHelpers(),
    authRepo = new AuthRepo(),
    userRepo = new UserRepo(),
    twoFAService = new TwoFAService(),
    userService = new UserService()
  ) {
    this.authHelpers = authHelpers;
    this.authRepo = authRepo;
    this.userRepo = userRepo;
    this.twoFAService = twoFAService;
    this.userService = userService;
  }

  async authenticateUser(loginDto, jwtUtils, encryptUtils) {
    const user = await this.userRepo.getUserByUsername(loginDto.username);

    await this.authHelpers.validateHashedPasswd(loginDto.passwd, user.passwd, encryptUtils);
    this.authHelpers.validateUserEnable(user);

    this.twoFAService.verify2FACode(user.twoFASecret, loginDto.token);

    await this.userService.updateUserStatus(user.id, "ONLINE");

    return await this.generateTokens(jwtUtils, user);
  }

  async checkUser2FAEnabled(loginDto) {
    const user = await this.userRepo.getUserByUsername(loginDto.username);
    this.authHelpers.validateUserEnable(user);

    const twoFASecret = await this.userRepo.getUser2FASecret(loginDto.username);
    if (!twoFASecret) {
      return false;
    }
    return true;
  }

  async signOutUser(userId) {
    await this.userService.updateUserStatus(Number(userId), "OFFLINE");

    await this.authRepo.removeUserRefreshToken(userId);
  }

  async registerUser(registerDto, encryptUtils) {
    const hashed = await encryptUtils.hashPasswd(registerDto.passwd);
    registerDto.passwd = hashed;
    const hashedDto = new HashedDto(registerDto);
    console.log("Registering user:", hashedDto);
    await this.userRepo.createUser(hashedDto);
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
    this.authHelpers.validateUserEnable(user);
    await this.userService.updateUserStatus(user.id, "ONLINE");

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
    this.authHelpers.validateUserEnable(user);
    await this.userService.updateUserStatus(user.id, "ONLINE");

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
