import userRepo from "#domains/user/repo/userRepo.js";

const userService = {
  async getMe(user) {
    return new UserDto(user);
  },
};

export default userService;
