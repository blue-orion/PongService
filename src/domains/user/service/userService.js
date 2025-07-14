import userRepo from "#domains/user/repo/userRepo.js";
import OtherUserDto from "#domains/user/model/otherUserDto.js";
import MeUserDto from "#domains/user/model/meUserDto.js";

const userService = {
  async getProfileByUsername(userId, username) {
    const targetUser = await userRepo.getUserByUsername(username);
    if (userId === targetUser.id) {
      return new MeUserDto(targetUser);
    } else {
      return new OtherUserDto(targetUser);
    }
  },

  async getProfileById(userId, id) {
    const targetUser = await userRepo.getUserById(id);
    if (userId === targetUser.id) {
      return new MeUserDto(targetUser);
    } else {
      return new OtherUserDto(targetUser);
    }
  },

  async getProfileByNickname(userId, nickname) {
    const targetUser = await userRepo.getUserByNickname(nickname);
    if (userId === targetUser.id) {
      return new MeUserDto(targetUser);
    } else {
      return new OtherUserDto(targetUser);
    }
  },

  async updateUserNickname(user, nickname) {
    await userRepo.putNickname(user.id, nickname);
  },

  async updateUserPassword(user, passwordDto, encryptUtils) {
    const { currentPassword, newPassword, confirmNewPassword } = passwordDto;
    const targetUser = await userRepo.getUserById(user.id);
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      throw new Error("Current password and new password are required");
    }
    if (!(await encryptUtils.comparePasswd(currentPassword, targetUser.passwd))) {
      throw new Error("Current password is incorrect");
    }
    if (newPassword !== confirmNewPassword) {
      throw new Error("New password and confirmation do not match");
    }
    const hashedPassword = await encryptUtils.hashPasswd(newPassword);
    await userRepo.putPassword(user.id, hashedPassword);
  },
};
export default userService;
