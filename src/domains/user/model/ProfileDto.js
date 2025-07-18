class ProfileDto {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.nickname = user.nickname;
    this.profileImage = user.profile_image;
    this.status = user.status;
    this.gameRating = user.game_rating;
  }
}

export default ProfileDto;
