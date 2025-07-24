class LoginDto {
  constructor(requestBody) {
    this.username = requestBody.username;
    this.passwd = requestBody.passwd;
    this.token = requestBody.token || null;
  }
}

export default LoginDto;
