import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import UserHelpers from "#domains/user/utils/userHelpers";
import UserRepo from "#domains/user/repo/userRepo.js";
import ProfileDto from "#domains/user/model/profileDto.js";

class UserService {
  constructor(authHelpers = new AuthHelpers(), userHelpers = new UserHelpers(), userRepo = new UserRepo()) {
    this.authHelpers = authHelpers;
    this.userHelpers = userHelpers;
    this.userRepo = userRepo;
  }

  async getProfileById(userId) {
    const user = await this.userRepo.getUserById(userId);
    return new ProfileDto(user);
  }

  async updateUserNickname(user, nickname) {
    await this.userRepo.putNickname(user.id, nickname);
  }

  async updateUserProfileImage(user, profileImage) {
    await this.userRepo.putProfileImage(user.id, profileImage);
  }

  async updateUserPassword(user, passwordDto, encryptUtils) {
    const targetUser = await this.userRepo.getUserById(user.id);
    this.authHelpers.validateHashedPasswd(passwordDto.currentPassword, targetUser.passwd, encryptUtils);

    const hashedPassword = await encryptUtils.hashPasswd(passwordDto.newPassword);
    await this.userRepo.putPassword(user.id, hashedPassword);
  }

  async disableUser(userId) {
    await this.userRepo.disableUser(userId);
  }
}
export default UserService;
