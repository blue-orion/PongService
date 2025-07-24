class FriendCancelDto {
  constructor(requestBody, requestUser) {
    this.receiverId = Number(requestBody.receiverId);
    this.senderId = Number(requestUser.id);
  }
}

export default FriendCancelDto;
