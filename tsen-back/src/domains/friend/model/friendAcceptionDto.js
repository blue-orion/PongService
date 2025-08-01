class FriendAcceptionDto {
  constructor(requestBody, requestUser) {
    this.receiverName = requestBody.receiverId;
    this.senderId = Number(requestUser.id);
  }
}

export default FriendAcceptionDto;
