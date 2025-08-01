class TwoFATempDto {
  constructor(twoFASecretDto) {
    this.qrCodeDataURL = twoFASecretDto.qrCodeDataURL;
    this.tempSecret = twoFASecretDto.secret;
  }
}

export default TwoFATempDto;
