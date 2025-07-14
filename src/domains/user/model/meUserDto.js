class MeUserDto {
  constructor(user) {
    this.user = {
      id: user.id,
      passwd: user.password,
      username: user.username,
      nickname: user.nickname,
      profile_image: user.profile_image,
      status: user.status,
      game_rating: user.game_rating,
    };
  }
}

export default MeUserDto;
