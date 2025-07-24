import websocketManager from "#shared/websocket/websocketManager.js";

import AuthHelpers from "#domains/auth/utils/authHelpers.js";
import FriendsUtils from "#domains/friend/util/friendsUtils.js";
import ProfileDto from "#domains/user/model/profileDto.js";
import SummaryDto from "#domains/user/model/summaryDto.js";
import UserHelpers from "#domains/user/utils/userHelpers.js";
import UserRepo from "#domains/user/repo/userRepo.js";

class UserService {
  constructor(authHelpers = new AuthHelpers(), userHelpers = new UserHelpers(), userRepo = new UserRepo()) {
    this.authHelpers = authHelpers;
    this.userHelpers = userHelpers;
    this.userRepo = userRepo;
  }

  async getProfileById(userId) {
    const user = await this.userRepo.getUserById(userId);
    this.userHelpers.validateExistingUser(user);

    const profileDto = new ProfileDto(user);
    if (profileDto.twoFASecret) {
      profileDto.twoFASecret = true;
    }

    return profileDto;
  }

  async updateUserNickname(userId, nickname) {
    const user = await this.userRepo.getUserById(userId);
    this.userHelpers.validateUpdateNickname(nickname, user.nickname);

    await this.userRepo.putNickname(userId, nickname);
  }

  async updateUserProfileImage(userId, profileImage) {
    const isChanged = this.userHelpers.validateUpdateProfileImage(profileImage);
    if (isChanged) {
      await this.userRepo.putProfileImage(userId, profileImage);
    } else {
      await this.userRepo.putProfileImage(userId, null);
    }
  }

  async broadcastCurrentUserProfile(userId) {
    const user = await this.userRepo.getUserById(userId);
    const updateProfileDto = new ProfileDto(user);

    const friendsData = await this.userRepo.getUserFriendIds(user.id);
    const friendIds = FriendsUtils.parseIds(friendsData?.friends || "[]");
    friendIds.forEach((friendId) => {
      websocketManager.sendToNamespaceUser("friend", friendId, "user_status", {
        type: "profile_update",
        payload: {
          userId: user.id,
          nickname: updateProfileDto.nickname,
          profileImage: updateProfileDto.profileImage,
        },
      });
    });
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
    const friendsData = await this.userRepo.getUserFriendIds(userId);
    const friendIds = FriendsUtils.parseIds(friendsData?.friends || "[]");
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

    const gameRecords = await this.userRepo.getUserGameRecords(userId, pageable);

    if (!gameRecords) {
      return [];
    }

    const allGames = [...(gameRecords.gamesAsWinner || []), ...(gameRecords.gamesAsLoser || [])];

    allGames.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return allGames.slice(pageable.skip, pageable.skip + pageable.take);
  }

  async getUserSummary(userId) {
    const user = await this.userRepo.getUserById(userId);
    this.userHelpers.validateExistingUser(user);

    return new SummaryDto(user);
  }
}

export default UserService;
