class TwoFAConfirmDto {
  constructor(requestBody) {
    this.username = requestBody.username;
    this.tempSecret = requestBody.tempSecret;
    this.token = requestBody.token;
  }
}

export default TwoFAConfirmDto;
