class TwoFASecretDto {
  constructor(secret, otpauthUrl, qrCodeDataURL) {
    this.secret = secret;
    this.otpauthUrl = otpauthUrl;
    this.qrCodeDataURL = qrCodeDataURL;
  }
}

export default TwoFASecretDto;
