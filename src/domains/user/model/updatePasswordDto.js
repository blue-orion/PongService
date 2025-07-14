class UpdatePasswordDto {
  constructor(requestBody) {
    this.currentPassword = requestBody.currentPassword;
    this.newPassword = requestBody.newPassword;
    this.confirmNewPassword = requestBody.confirmNewPassword;
  }
}

export default UpdatePasswordDto;
