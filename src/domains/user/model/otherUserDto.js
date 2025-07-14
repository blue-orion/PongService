class OtherUserDto {
  constructor(user) {
    this.user = {
      nickname: user.nickname,
      profile_image: user.profile_image,
      status: user.status,
      game_rating: user.game_rating,
    };
  }
}

export default OtherUserDto;
