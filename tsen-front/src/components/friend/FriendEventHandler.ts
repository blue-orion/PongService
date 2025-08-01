import { Friend, FriendRequest, SentRequest } from "../../types/friend.types";
import { UserManager } from "../../utils/user";
import { FriendDataManager } from "./FriendDataManager";
import { UserProfileManager } from "./UserProfileManager";

export class FriendEventHandler {
  private dataManager: FriendDataManager;
  private userProfileManager: UserProfileManager;
  private onDataUpdate: () => void;
  private onShowNotification: (message: string) => void; // 자신의 액션: 팝업
  private onShowAlert: (message: string) => void; // 다른 사람의 알림: 알람

  constructor(
    dataManager: FriendDataManager,
    userProfileManager: UserProfileManager,
    onDataUpdate: () => void,
    onShowNotification: (message: string) => void,
    onShowAlert: (message: string) => void
  ) {
    this.dataManager = dataManager;
    this.userProfileManager = userProfileManager;
    this.onDataUpdate = onDataUpdate;
    this.onShowNotification = onShowNotification;
    this.onShowAlert = onShowAlert;
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
      case "status_update":
        this.handleUserStatusUpdate(payload);
        console.log("User status update received:", payload);
        break;
      case "profile_update":
        this.handleNicknameUpdate(payload);
        this.handleProfileImageUpdate(payload);
        break;
      default:
        console.warn("알 수 없는 친구 알림 타입:", type);
    }
  }

  private handleFriendRequestReceived(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = UserManager.getUserId();

    // 전체 데이터 새로고침으로 통합
    this.dataManager
      .loadAllData()
      .then(() => {
        this.onDataUpdate();

        // 자신이 보낸 요청인 경우 팝업 표시
        if (requestData.senderId?.toString() === currentUserId?.toString()) {
          const receiverName =
            requestData.receiverUsername ||
            requestData.receiverName ||
            requestData.receiver?.username ||
            requestData.receiver?.nickname ||
            `사용자${requestData.receiverId}`;
          this.onShowNotification(`${receiverName}님에게 친구 요청을 보냈습니다.`);
        } else {
          // 다른 사람이 보낸 요청인 경우 알람 표시
          const senderName =
            requestData.senderUsername ||
            requestData.senderName ||
            requestData.sender?.username ||
            requestData.sender?.nickname ||
            `사용자${requestData.senderId}`;
          this.onShowAlert(`${senderName}님이 친구 요청을 보냈습니다.`);
        }
      })
      .catch((error) => {
        console.error("데이터 새로고침 실패:", error);
        this.onDataUpdate();
      });
  }

  private handleFriendRequestAccepted(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = UserManager.getUserId();

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
        // 자신이 요청을 수락한 경우 팝업 표시
        if (requestData.receiverId?.toString() === currentUserId?.toString()) {
          this.onShowNotification("친구 요청을 수락했습니다.");
        }
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
    const currentUserId = UserManager.getUserId();

    const sentRequests = this.dataManager.getSentRequests();
    const removedRequest = sentRequests.find((request) => request.relationId === requestData.relationId);
    this.dataManager.removeSentRequest(requestData.relationId);

    // 모든 데이터 새로고침
    this.dataManager
      .loadAllData()
      .then(() => {
        this.onDataUpdate();

        // 자신이 요청을 거절한 경우 팝업 표시
        if (requestData.receiverId?.toString() === currentUserId?.toString()) {
          const userName = requestData.senderName || requestData.senderUsername || "상대방";
          this.onShowNotification(`${userName}님의 친구 요청을 거절했습니다.`);
        }
      })
      .catch((error) => {
        console.error("데이터 새로고침 실패:", error);
        this.onDataUpdate();
      });
  }

  private handleFriendRequestCancelled(payload: any): void {
    const requestData = payload.requestData || payload;
    const currentUserId = UserManager.getUserId();

    if (requestData.senderId?.toString() === currentUserId?.toString()) {
      // 자신이 취소한 경우 - 팝업 표시
      const sentRequests = this.dataManager.getSentRequests();
      const removedRequest = sentRequests.find((request) => request.relationId === requestData.relationId);
      this.dataManager.removeSentRequest(requestData.relationId);

      const userName = removedRequest?.name || requestData.receiverName || requestData.receiverUsername || "상대방";
      this.onShowNotification(`${userName}님에게 보낸 친구 요청을 취소했습니다.`);
    } else {
      // 상대방이 취소한 경우 - 알람 표시
      const friendRequests = this.dataManager.getFriendRequests();
      this.dataManager.removeFriendRequest(requestData.relationId);
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
    const currentUserId = UserManager.getUserId();

    const deletedFriendId = requestData.senderId === currentUserId ? requestData.receiverId : requestData.senderId;

    if (deletedFriendId) {
      this.dataManager.removeFriend(Number(deletedFriendId));

      // 모든 데이터 새로고침
      this.dataManager
        .loadAllData()
        .then(() => {
          this.onDataUpdate();

          // 자신이 삭제한 경우 팝업 표시
          if (requestData.senderId?.toString() === currentUserId?.toString()) {
            this.onShowNotification("친구를 삭제했습니다.");
          }
        })
        .catch((error) => {
          console.error("데이터 새로고침 실패:", error);
          this.onDataUpdate(); // 실패해도 UI는 업데이트
        });
    }
  }

  private handleFriendStatusChanged(payload: any): void {
    const friendId = payload.friendId || payload.userId || payload.id;
    const newStatus = this.userProfileManager.convertStatus(payload.status || "OFFLINE");
    const currentUserId = UserManager.getUserId();

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
            this.onShowAlert(`${friend.name}님이 온라인 상태입니다.`);
          }
        }
      }
    }
  }

  private handleUserStatusUpdate(payload: any): void {
    const userId = payload.userId;
    const newStatus = this.userProfileManager.convertStatus(payload.status || "OFFLINE");
    const currentUserId = UserManager.getUserId();

    // 자신의 상태가 변경된 경우
    if (userId?.toString() === currentUserId?.toString()) {
      this.userProfileManager.updateStatusIndicator(newStatus);
      return;
    }

    // 친구의 상태가 변경된 경우
    if (userId) {
      const friends = this.dataManager.getFriends();
      const friend = friends.find((f) => f.id === userId);

      if (friend) {
        const oldStatus = friend.status;
        const updated = this.dataManager.updateFriendStatus(userId, newStatus);

        if (updated && oldStatus !== newStatus) {
          this.onDataUpdate();

          if (newStatus === "online" && oldStatus === "offline") {
            this.onShowAlert(`${friend.name}님이 온라인 상태가 되었습니다.`);
          } else if (newStatus === "in-game" && oldStatus !== "in-game") {
            this.onShowAlert(`${friend.name}님이 게임을 시작했습니다.`);
          }
        }
      }
    }
  }

  private handleNicknameUpdate(payload: any): void {
    const userId = payload.userId;
    const newNickname = payload.nickname || payload.name;
    const currentUserId = UserManager.getUserId();
    console.log("닉네임 업데이트:", userId, newNickname);
    // 자신의 닉네임이 변경된 경우
    if (userId?.toString() === currentUserId?.toString()) {
      this.userProfileManager.updateNickname(newNickname);
      return;
    }

    // 친구의 닉네임이 변경된 경우
    if (userId) {
      const friends = this.dataManager.getFriends();
      const friend = friends.find((f) => f.id === userId);

      if (friend) {
        this.dataManager.updateFriendNickname(userId, newNickname);
        this.onDataUpdate();
      }
    }
  }

  private handleProfileImageUpdate(payload: any): void {
    const userId = payload.userId;
    const newProfileImage = payload.profileImage || payload.image;
    const currentUserId = UserManager.getUserId();

    // 자신의 프로필 이미지가 변경된 경우
    if (userId?.toString() === currentUserId?.toString()) {
      this.userProfileManager.updateProfileImage(newProfileImage);
      return;
    }

    // 친구의 프로필 이미지가 변경된 경우
    if (userId) {
      const friends = this.dataManager.getFriends();
      const friend = friends.find((f) => f.id === userId);

      if (friend) {
        this.dataManager.updateFriendProfileImage(userId, newProfileImage);
        this.onDataUpdate();
      }
    }
  }
}
