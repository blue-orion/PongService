class UpdateProfileDto {
  constructor(requestBody) {
    this.nickname = requestBody.nickname;
    this.profileImage = requestBody.profileImage;
  }
}

export default UpdateProfileDto;
