class RegisterOAuthDto {
  constructor(username, passwd, nickname, profileImage) {
    this.username = username;
    this.passwd = passwd;
    this.nickname = nickname;
    this.profile_image = profileImage || null;
  }
}

export default RegisterOAuthDto;
