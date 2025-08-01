class RegisterDto {
  constructor(requestBody) {
    this.username = requestBody.username;
    this.passwd = requestBody.passwd;
    this.confirmPasswd = requestBody.confirmPasswd;
    this.nickname = requestBody.nickname;
    this.profile_image = requestBody.profileImage || null;
  }
}

export default RegisterDto;
