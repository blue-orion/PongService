class OtherUserDto {
  constructor(user) {
    this.user = {
      nickname: user.nickname,
      profileImage: user.profile_image,
      status: user.status,
      gameRating: user.game_rating,
    };
  }
}

export default OtherUserDto;
