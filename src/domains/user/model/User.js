class User {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.nickname = user.nickname;
    this.profileImage = user.profile_image;
    this.passwd = user.passwd;
    this.profileImage = user.profile_image;
    this.refreshToken = user.refresh_token;
    this.createdAt = user.created_at;
    this.updatedAt = user.updated_at;
    this.status = user.status;
    this.enabled = user.enabled;
    this.gameRating = user.game_rating;
  }
}

export default User;
