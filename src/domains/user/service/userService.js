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
};

export default userService;
