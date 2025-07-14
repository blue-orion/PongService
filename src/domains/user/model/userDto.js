class UserDto {
  constructor(user) {
    this.user = {
      id: user.id,
      passwd: user.password,
      username: user.username,
      nickname: user.nickname,
      // profile_image: user.profile_image,
    };
  }
}

export default UserDto;
