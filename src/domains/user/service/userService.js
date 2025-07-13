import UserDto from "#domains/user/model/userDto.js";

const userService = {
  async getMe(user) {
    return new UserDto(user);
  },
};

export default userService;
