class HashedDto {
  constructor(requestBody) {
    this.username = requestBody.username;
    this.passwd = requestBody.passwd;
    this.nickname = requestBody.nickname;
    this.profile_image = requestBody.profileImage || null;
  }
}

export default HashedDto;
