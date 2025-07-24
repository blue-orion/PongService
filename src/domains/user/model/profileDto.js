class ProfileDto {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.nickname = user.nickname;
    this.profileImage = user.profile_image;
    this.status = user.status;
    this.twoFASecret = user.two_fa_secret;
  }
}

export default ProfileDto;
