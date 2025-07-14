class MeUserDto {
  constructor(user) {
    this.user = {
      id: user.id,
      passwd: user.password,
      username: user.username,
      nickname: user.nickname,
      profileImage: user.profile_image,
      status: user.status,
      gameRating: user.game_rating,
    };
  }
}

export default MeUserDto;
