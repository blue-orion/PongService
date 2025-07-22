import { Friend, FriendRequest, SentRequest } from "../../types/friend.types";
import { FriendDataManager } from "./FriendDataManager";
import { UserProfileManager } from "./UserProfileManager";

export class FriendEventHandler {
  private dataManager: FriendDataManager;
  private userProfileManager: UserProfileManager;
  private onDataUpdate: () => void;
  private onShowNotification: (message: string) => void;

  constructor(
    dataManager: FriendDataManager,
    userProfileManager: UserProfileManager,
    onDataUpdate: () => void,
    onShowNotification: (message: string) => void
  ) {
    this.dataManager = dataManager;
    this.userProfileManager = userProfileManager;
    this.onDataUpdate = onDataUpdate;
    this.onShowNotification = onShowNotification;
  }

  public handleFriendNotification(notification: any): void {
    const { type, payload } = notification;

    switch (type) {
      case "request":
        this.handleFriendRequestReceived(payload);
        break;
      case "accepted":
        this.handleFriendRequestAccepted(payload);
        break;
      case "rejected":
        this.handleFriendRequestRejected(payload);
        break;
      case "cancelled":
        this.handleFriendRequestCancelled(payload);
        break;
      case "deleted":
        this.handleFriendDeleted(payload);
        break;
      case "status_changed":
        this.handleFriendStatusChanged(payload);
        break;
      case "user_status":
      case "status_update":
        this.handleUserStatusUpdate(payload);
        break;
      default:
        console.warn("알 수 없는 친구 알림 타입:", type);
    }
  }

  private handleFriendRequestReceived(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = this.userProfileManager.getCurrentUserId();

    // 전체 데이터 새로고침으로 통합
    this.dataManager
      .loadAllData()
      .then(() => {
        this.onDataUpdate();

        // 자신이 보낸 요청인지 확인
        if (requestData.senderId?.toString() === currentUserId?.toString()) {
          const receiverName =
            requestData.receiverUsername ||
            requestData.receiverName ||
            requestData.receiver?.username ||
            requestData.receiver?.nickname ||
            `사용자${requestData.receiverId}`;
          this.onShowNotification(`${receiverName}님에게 친구 요청을 보냈습니다.`);
        } else {
          const senderName =
            requestData.senderUsername ||
            requestData.senderName ||
            requestData.sender?.nickname ||
            requestData.sender?.username ||
            requestData.name ||
            `사용자${requestData.senderId}`;
          this.onShowNotification(`새로운 친구 요청: ${senderName}`);
        }
      })
      .catch((error) => {
        console.error("데이터 새로고침 실패:", error);
        this.onDataUpdate();
      });
  }

  private handleFriendRequestAccepted(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = this.userProfileManager.getCurrentUserId();

    // 수락된 요청을 보관함에서 제거
    this.dataManager.removeFriendRequest(requestData.relationId);
    this.dataManager.removeSentRequest(requestData.relationId);

    // 상대방 ID 결정
    const friendId = requestData.senderId === currentUserId ? requestData.receiverId : requestData.senderId;

    // 모든 데이터 다시 로드 (친구 목록, 받은 요청, 보낸 요청)
    this.dataManager
      .loadAllData()
      .then(() => {
        this.onDataUpdate();
        this.onShowNotification("친구 요청이 수락되었습니다.");
      })
      .catch((error) => {
        console.error("데이터 재로드 실패:", error);
        // 실패시 임시로 추가
        const tempFriend: Friend = {
          id: friendId?.toString() || Date.now().toString(),
          name: `사용자${friendId}`,
          username: "unknown",
          status: "offline",
          relationId: requestData.relationId || Date.now().toString(),
        };
        this.dataManager.addFriend(tempFriend);
        this.onDataUpdate();
      });
  }

  private handleFriendRequestRejected(payload: any): void {
    const requestData = payload.requestData || payload;

    const sentRequests = this.dataManager.getSentRequests();
    const removedRequest = sentRequests.find((request) => request.relationId === requestData.relationId);
    this.dataManager.removeSentRequest(requestData.relationId);

    // 모든 데이터 새로고침
    this.dataManager
      .loadAllData()
      .then(() => {
        this.onDataUpdate();

        const userName = removedRequest?.name || requestData.receiverName || requestData.receiverUsername || "상대방";
        this.onShowNotification(`${userName}님이 친구 요청을 거절했습니다.`);
      })
      .catch((error) => {
        console.error("데이터 새로고침 실패:", error);
        this.onDataUpdate();

        const userName = removedRequest?.name || requestData.receiverName || requestData.receiverUsername || "상대방";
        this.onShowNotification(`${userName}님이 친구 요청을 거절했습니다.`);
      });
  }

  private handleFriendRequestCancelled(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = this.userProfileManager.getCurrentUserId();

    if (requestData.senderId?.toString() === currentUserId?.toString()) {
      const sentRequests = this.dataManager.getSentRequests();
      const removedRequest = sentRequests.find((request) => request.relationId === requestData.relationId);
      this.dataManager.removeSentRequest(requestData.relationId);

      const userName = removedRequest?.name || requestData.receiverName || requestData.receiverUsername || "상대방";
      this.onShowNotification(`${userName}님에게 보낸 친구 요청을 취소했습니다.`);
    } else {
      const friendRequests = this.dataManager.getFriendRequests();
      const removedRequest = friendRequests.find((request) => request.relationId === requestData.relationId);
      this.dataManager.removeFriendRequest(requestData.relationId);

      const userName = removedRequest?.name || requestData.senderName || requestData.senderUsername || "상대방";
      this.onShowNotification(`${userName}님이 친구 요청을 취소했습니다.`);
    }

    // 모든 데이터 새로고침
    this.dataManager
      .loadAllData()
      .then(() => {
        this.onDataUpdate();
      })
      .catch((error) => {
        console.error("데이터 새로고침 실패:", error);
        this.onDataUpdate();
      });
  }

  private handleFriendDeleted(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = this.userProfileManager.getCurrentUserId();

    const deletedFriendId = requestData.senderId === currentUserId ? requestData.receiverId : requestData.senderId;

    if (deletedFriendId) {
      this.dataManager.removeFriend(deletedFriendId.toString());
      this.onDataUpdate();
      this.onShowNotification("친구가 삭제되었습니다.");
    }
  }

  private handleFriendStatusChanged(payload: any): void {
    const friendId = payload.friendId || payload.userId || payload.id;
    const newStatus = this.userProfileManager.convertStatus(payload.status || "OFFLINE");
    const currentUserId = this.userProfileManager.getCurrentUserId();

    // 자신의 상태가 변경된 경우
    if (friendId?.toString() === currentUserId?.toString()) {
      this.userProfileManager.updateStatusIndicator(newStatus);
      return;
    }

    // 친구의 상태가 변경된 경우
    if (friendId) {
      const friends = this.dataManager.getFriends();
      const friend = friends.find((f) => f.id === friendId?.toString());

      if (friend) {
        const oldStatus = friend.status;
        const updated = this.dataManager.updateFriendStatus(friendId?.toString(), newStatus);

        if (updated && oldStatus !== newStatus) {
          this.onDataUpdate();

          if (newStatus === "online" && oldStatus === "offline") {
            this.onShowNotification(`${friend.name}님이 온라인 상태입니다.`);
          }
        }
      }
    }
  }

  private handleUserStatusUpdate(payload: any): void {
    const userId = payload.userId;
    const newStatus = this.userProfileManager.convertStatus(payload.status || "OFFLINE");
    const currentUserId = this.userProfileManager.getCurrentUserId();

    // 자신의 상태가 변경된 경우
    if (userId?.toString() === currentUserId?.toString()) {
      this.userProfileManager.updateStatusIndicator(newStatus);
      return;
    }

    // 친구의 상태가 변경된 경우
    if (userId) {
      const friends = this.dataManager.getFriends();
      const friend = friends.find((f) => f.id === userId?.toString());

      if (friend) {
        const oldStatus = friend.status;
        const updated = this.dataManager.updateFriendStatus(userId?.toString(), newStatus);

        if (updated && oldStatus !== newStatus) {
          this.onDataUpdate();

          if (newStatus === "online" && oldStatus === "offline") {
            this.onShowNotification(`${friend.name}님이 온라인 상태가 되었습니다.`);
          } else if (newStatus === "in-game" && oldStatus !== "in-game") {
            this.onShowNotification(`${friend.name}님이 게임을 시작했습니다.`);
          }
        }
      }
    }
  }
}
