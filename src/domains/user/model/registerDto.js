import PongException from "#shared/exception/pongException.js";

class RegisterDto {
  constructor(requestBody) {
    if (!requestBody.username || !requestBody.passwd || !requestBody.nickname) throw PongException.BAD_REQUEST;

    this.username = requestBody.username;
    this.passwd = requestBody.passwd;
    this.nickname = requestBody.nickname;
    this.profile_image = requestBody.profileImage || null;
  }
}

export default RegisterDto;
