class FriendDeleteDto {
  constructor(requestBody, requestUser) {
    this.friendId = Number(requestBody.deleteFriendId);
    this.userId = Number(requestUser.id);
  }
}

export default FriendDeleteDto;
