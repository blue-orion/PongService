class FriendAcceptionDto {
  constructor(requestBody, requestUser) {
    this.receiverId = requestBody.receiverId;
    this.senderId = Number(requestUser.id);
  }
}

export default FriendAcceptionDto;
