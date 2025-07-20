class FriendsUtils {
  // JSON 문자열을 정수 배열로 파싱
  static parseIds(jsonString) {
    try {
      if (!jsonString || jsonString.trim() === "") return [];
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) return [];

      // 정수로 변환하고 유효한 값만 필터링
      return parsed.map((id) => parseInt(id)).filter((id) => Number.isInteger(id) && id > 0);
    } catch (error) {
      console.error("Error parsing friends JSON:", error);
      return [];
    }
  }

  // 정수 배열을 JSON 문자열로 변환
  static stringifyIds(idsArray) {
    try {
      if (!Array.isArray(idsArray)) return "[]";

      // 유효한 정수만 필터링
      const validIds = idsArray.map((id) => parseInt(id)).filter((id) => Number.isInteger(id) && id > 0);

      return JSON.stringify(validIds);
    } catch (error) {
      console.error("Error stringifying friends array:", error);
      return "[]";
    }
  }

  // 친구 추가
  static addFriend(friendsJson, newFriendId) {
    const currentFriends = this.parseIds(friendsJson);
    const friendId = parseInt(newFriendId);

    if (!Number.isInteger(friendId) || friendId <= 0) {
      throw new Error("Invalid friend ID");
    }

    if (!currentFriends.includes(friendId)) {
      currentFriends.push(friendId);
    }

    return this.stringifyIds(currentFriends);
  }

  // 친구 제거
  static removeFriend(friendsJson, friendIdToRemove) {
    const currentFriends = this.parseIds(friendsJson);
    const friendId = parseInt(friendIdToRemove);

    const updatedFriends = currentFriends.filter((id) => id !== friendId);
    return this.stringifyIds(updatedFriends);
  }
}

export default FriendsUtils;
