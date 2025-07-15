import userRepo from "#domains/user/repo/userRepo.js";
import MeUserDto from "#domains/user/model/meUserDto.js";

const userService = {
  async getProfileById(userId) {
    const user = await userRepo.getUserById(userId);
    return new MeUserDto(user);
  },

  async updateUserNickname(user, nickname) {
    await userRepo.putNickname(user.id, nickname);
  },

  async updateUserProfileImage(user, profileImage) {
    await userRepo.putProfileImage(user.id, profileImage);
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

  async disableUser(userId) {
    await userRepo.disableUser(userId);
  },
};
export default userService;
