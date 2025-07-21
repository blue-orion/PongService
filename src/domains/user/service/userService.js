import websocketManager from "#shared/websocket/websocketManager.js";

import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import FriendsUtils from "#domains/friend/util/friendsUtils.js";
import ProfileDto from "#domains/user/model/profileDto.js";
import SummaryDto from "#domains/user/model/summaryDto.js";
import UserHelpers from "#domains/user/utils/userHelpers.js";
import UserRepo from "#domains/user/repo/userRepo.js";

class UserService {
  constructor(
    authHelpers = new AuthHelpers(),
    friendsUtils = new FriendsUtils(),
    userHelpers = new UserHelpers(),
    userRepo = new UserRepo()
  ) {
    this.authHelpers = authHelpers;
    this.friendsUtils = friendsUtils;
    this.userHelpers = userHelpers;
    this.userRepo = userRepo;
  }

  async getProfileById(userId) {
    const user = await this.userRepo.getUserById(userId);
    this.userHelpers.validateExistingUser(user);

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
    this.userHelpers.validateExistingUser(user);

    return user.status;
  }

  async updateUserStatus(userId, status) {
    const user = await this.userRepo.getUserById(userId);
    this.userHelpers.validateExistingUser(user);

    await this.userRepo.updateUserStatus(userId, status);
    const friends = await this.userRepo.getUserFriendIds(userId);
    const friendIds = this.friendsUtils.parseIds(friends);
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

  async getUserGameRecords(userId, pageable) {
    const user = await this.userRepo.getUserById(userId);
    this.userHelpers.validateExistingUser(user);

    return this.userRepo.getUserGameRecords(userId, pageable);
  }

  async getUserSummary(userId) {
    const user = await this.userRepo.getUserById(userId);
    this.userHelpers.validateExistingUser(user);

    return new SummaryDto(user);
  }
}

export default UserService;
