class TwoFADto {
  constructor(requestBody) {
    this.username = requestBody.username;
    this.token = requestBody.token || null;
  }
}

export default TwoFADto;
