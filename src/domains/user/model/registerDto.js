class RegisterDto {
  constructor(requestBody) {
    this.username = requestBody.username;
    this.passwd = requestBody.passwd;
    this.nickname = requestBody.nickname;
    this.profileImage = requestBody.profileImage || null;
  }
}

export default RegisterDto;
