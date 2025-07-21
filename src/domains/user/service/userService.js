import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import ProfileDto from "#domains/user/model/ProfileDto.js";
import UserHelpers from "#domains/user/utils/userHelpers";
import UserRepo from "#domains/user/repo/userRepo.js";
import websocketManager from "#shared/websocket/websocketManager.js";

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

  async getUserStatus(userId) {
    const user = await this.userRepo.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user.status;
  }

  async updateUserStatus(userId, status) {
    const user = await this.userRepo.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }
    await this.userRepo.updateUserStatus(userId, status);
    const friendIds = await this.userRepo.getUserFriendIds(userId);
    friendIds.forEach((friendId) => {
      websocketManager.sendToNamespaceUser("friend", friendId, "user_status", {
        type: "status_update",
        payload: {
          userId,
          status,
        },
      });
    });
  }
}

export default UserService;
