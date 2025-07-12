class UserDto {
  constructor(user) {
    this.user = {
      id: user.id,
      username: user.username,
      profile_image: user.profile_image,
    };
  }
}

export default UserDto;
