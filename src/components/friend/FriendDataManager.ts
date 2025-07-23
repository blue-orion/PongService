import { friendService } from "../../utils/friendService";
import { Friend, FriendRequest, SentRequest } from "../../types/friend.types";
import { UserProfileManager } from "./UserProfileManager";
import { UserManager } from "../../utils/user";

export class FriendDataManager {
  private friends: Friend[] = [];
  private friendRequests: FriendRequest[] = [];
  private sentRequests: SentRequest[] = [];
  private userProfileManager: UserProfileManager;

  constructor(userProfileManager: UserProfileManager) {
    try {
      if (!userProfileManager) {
        throw new Error("UserProfileManager가 제공되지 않았습니다.");
      }
      this.userProfileManager = userProfileManager;
    } catch (error) {
      this.showErrorModal("FriendDataManager 초기화 실패", error instanceof Error ? error.message : "알 수 없는 오류");
      throw error;
    }
  }

  private showErrorModal(title: string, message: string): void {
    // 기존 에러 모달이 있다면 제거
    const existingModal = document.querySelector(".friend-error-modal-overlay");
    if (existingModal) {
      existingModal.remove();
    }

    // 에러 모달 HTML 생성
    const modalHTML = `
      <div class="friend-error-modal-overlay show">
        <div class="friend-error-modal">
          <div class="friend-error-modal-header">
            <div class="friend-error-modal-title">
              <span>⚠️</span>
              <span>${title}</span>
            </div>
          </div>
          <div class="friend-error-modal-content">
            <div class="friend-error-modal-message">${message}</div>
          </div>
          <div class="friend-error-modal-footer">
            <button class="friend-error-modal-button" onclick="this.closest('.friend-error-modal-overlay').remove()">
              확인
            </button>
          </div>
        </div>
      </div>
    `;

    // body에 모달 추가
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // 3초 후 자동으로 모달 제거 (옵션)
    setTimeout(() => {
      const modal = document.querySelector(".friend-error-modal-overlay");
      if (modal) {
        modal.remove();
      }
    }, 5000);
  }

  public async loadAllData(): Promise<void> {
    try {
      await Promise.all([this.loadFriends(), this.loadFriendRequests(), this.loadSentRequests()]);
    } catch (error) {
      console.error("친구 데이터 로드 실패:", error);
      // 500번대 에러는 이미 friendService에서 "서버 오류가 발생했습니다" 메시지로 변환됨
      const errorMessage =
        error instanceof Error && error.message.includes("서버 오류")
          ? error.message
          : "친구 목록을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      this.showErrorModal("친구 데이터 로드 실패", errorMessage);

      // 개별 로드 시도
      try {
        await this.loadFriends();
      } catch (friendsError) {
        console.error("친구 목록 로드 실패:", friendsError);
        this.friends = [];
      }

      try {
        await this.loadFriendRequests();
      } catch (requestsError) {
        console.error("친구 요청 로드 실패:", requestsError);
        this.friendRequests = [];
      }

      try {
        await this.loadSentRequests();
      } catch (sentError) {
        console.error("보낸 요청 로드 실패:", sentError);
        this.sentRequests = [];
      }
    }
  }

  public async loadFriends(): Promise<void> {
    try {
      const response = await friendService.getFriendsList();

      if (!response || !response.success || !response.data) {
        console.warn("친구 목록 조회 실패 또는 빈 응답:", response);
        this.friends = [];
        return;
      }

      // 응답 구조 처리
      let friendsData: any[] = [];
      try {
        if (response.data.friends && Array.isArray(response.data.friends)) {
          friendsData = response.data.friends;
        } else if ((response.data as any).data?.friends && Array.isArray((response.data as any).data.friends)) {
          friendsData = (response.data as any).data.friends;
        } else {
          console.warn("예상되지 않은 친구 목록 응답 구조:", response.data);
          this.friends = [];
          return;
        }
      } catch (parseError) {
        console.error("친구 목록 데이터 파싱 실패:", parseError);
        this.friends = [];
        return;
      }

      // 각 친구의 상세 프로필 정보를 API로 가져오기
      const friendsWithProfiles = await Promise.allSettled(
        friendsData.map(async (friend: any) => {
          try {
            if (!friend || !friend.id) {
              throw new Error("유효하지 않은 친구 데이터");
            }

            const friendProfile = await this.userProfileManager.fetchUserProfile(friend.id.toString());

            if (friendProfile) {
              const profileImageUrl = friendProfile.profileImage || friend.profile_image || friend.profileImage;

              return {
                id: Number(friend.id),
                name: friendProfile.nickname || friendProfile.username || friend.username || `사용자${friend.id}`,
                username: friendProfile.username || friend.username || `user${friend.id}`,
                status: this.userProfileManager.convertStatus(friendProfile.status || "OFFLINE"),
                avatar: profileImageUrl && profileImageUrl.trim() !== "" ? profileImageUrl : undefined,
                relationId: Number(friend.relationId) || Number(friend.id),
              };
            } else {
              const profileImageUrl = friend.profile_image || friend.profileImage;

              return {
                id: Number(friend.id),
                name: friend.nickname || friend.username || `사용자${friend.id}`,
                username: friend.username || `user${friend.id}`,
                status: this.userProfileManager.convertStatus(friend.status || "OFFLINE"),
                avatar: profileImageUrl && profileImageUrl.trim() !== "" ? profileImageUrl : undefined,
                relationId: Number(friend.relationId) || Number(friend.id),
              };
            }
          } catch (error) {
            console.error(`친구 ${friend?.id || "unknown"}의 프로필 정보 가져오기 실패:`, error);
            const profileImageUrl = friend?.profile_image || friend?.profileImage;

            return {
              id: Number(friend?.id) || Math.floor(Math.random() * 1000000),
              name: friend?.nickname || friend?.username || `사용자${friend?.id || "unknown"}`,
              username: friend?.username || `user${friend?.id || "unknown"}`,
              status: this.userProfileManager.convertStatus(friend?.status || "OFFLINE"),
              avatar: profileImageUrl && profileImageUrl.trim() !== "" ? profileImageUrl : undefined,
              relationId: Number(friend?.relationId) || Number(friend?.id) || Math.floor(Math.random() * 1000000),
            };
          }
        })
      );

      // 성공한 결과만 필터링
      this.friends = friendsWithProfiles
        .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
        .map((result) => result.value)
        .filter((friend) => friend && friend.id); // 유효한 친구만 포함
    } catch (error) {
      console.error("친구 목록 로드 중 예상치 못한 오류:", error);
      this.friends = [];
      // 500번대 에러는 이미 friendService에서 "서버 오류가 발생했습니다" 메시지로 변환됨
      const errorMessage =
        error instanceof Error && error.message.includes("서버 오류")
          ? error.message
          : "친구 목록을 불러오는 중 문제가 발생했습니다.";
      this.showErrorModal("친구 목록 로드 오류", errorMessage);
      throw error; // 상위에서 처리할 수 있도록 re-throw
    }
  }

  public async loadFriendRequests(): Promise<void> {
    try {
      const response = await friendService.getReceivedRequests();

      if (!response || !response.success || !response.data) {
        console.warn("친구 요청 목록 조회 실패 또는 빈 응답:", response);
        this.friendRequests = [];
        return;
      }

      // 응답 구조 처리
      let requestsArray: any[] = [];
      try {
        if (Array.isArray(response.data)) {
          requestsArray = response.data;
        } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          requestsArray = (response.data as any).data;
        } else if ((response.data as any).content && Array.isArray((response.data as any).content)) {
          requestsArray = (response.data as any).content;
        } else {
          console.warn("예상되지 않은 친구 요청 응답 구조:", response.data);
          this.friendRequests = [];
          return;
        }
      } catch (parseError) {
        console.error("친구 요청 데이터 파싱 실패:", parseError);
        this.friendRequests = [];
        return;
      }

      const requestsWithProfiles = await Promise.allSettled(
        requestsArray.map(async (request: any) => {
          try {
            if (!request || (!request.sender_id && !request.sender?.id)) {
              throw new Error("유효하지 않은 친구 요청 데이터");
            }

            const senderId = request.sender_id || request.sender?.id;
            if (senderId) {
              const senderProfile = await this.userProfileManager.fetchUserProfile(senderId.toString());

              if (senderProfile) {
                const profileImageUrl =
                  senderProfile.profileImage || request.sender?.profile_image || request.sender?.profileImage;

                return {
                  id: Number(request.id) || Math.floor(Math.random() * 1000000),
                  name: senderProfile.nickname || senderProfile.username || `사용자 ${senderId}`,
                  username: senderProfile.username || `user${senderId}`,
                  avatar: profileImageUrl && profileImageUrl.trim() !== "" ? profileImageUrl : undefined,
                  relationId: Number(request.id) || Math.floor(Math.random() * 1000000),
                };
              }
            }

            const profileImageUrl = request.sender?.profile_image || request.sender?.profileImage;

            return {
              id: Number(request.id) || Math.floor(Math.random() * 1000000),
              name: request.sender?.nickname || request.sender?.username || `사용자 ${request.sender_id || "unknown"}`,
              username: request.sender?.username || `user${request.sender_id || "unknown"}`,
              avatar: profileImageUrl && profileImageUrl.trim() !== "" ? profileImageUrl : undefined,
              relationId: Number(request.id) || Math.floor(Math.random() * 1000000),
            };
          } catch (error) {
            console.error(`친구 요청 ${request?.id || "unknown"}의 보낸이 프로필 정보 가져오기 실패:`, error);
            const profileImageUrl = request?.sender?.profile_image || request?.sender?.profileImage;

            return {
              id: Number(request?.id) || Math.floor(Math.random() * 1000000),
              name:
                request?.sender?.nickname || request?.sender?.username || `사용자 ${request?.sender_id || "unknown"}`,
              username: request?.sender?.username || `user${request?.sender_id || "unknown"}`,
              avatar: profileImageUrl && profileImageUrl.trim() !== "" ? profileImageUrl : undefined,
              relationId: Number(request?.id) || Math.floor(Math.random() * 1000000),
            };
          }
        })
      );

      // 성공한 결과만 필터링
      this.friendRequests = requestsWithProfiles
        .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
        .map((result) => result.value)
        .filter((request) => request && request.id); // 유효한 요청만 포함
    } catch (error) {
      console.error("친구 요청 목록 로드 중 예상치 못한 오류:", error);
      this.friendRequests = [];
      // 500번대 에러는 이미 friendService에서 "서버 오류가 발생했습니다" 메시지로 변환됨
      const errorMessage =
        error instanceof Error && error.message.includes("서버 오류")
          ? error.message
          : "받은 친구 요청 목록을 불러오는 중 문제가 발생했습니다.";
      this.showErrorModal("친구 요청 로드 오류", errorMessage);
      throw error;
    }
  }

  public async loadSentRequests(): Promise<void> {
    try {
      const response = await friendService.getSentRequests();

      if (!response || !response.success || !response.data) {
        console.warn("보낸 요청 목록 조회 실패 또는 빈 응답:", response);
        this.sentRequests = [];
        return;
      }

      let requestsArray: any[] = [];
      try {
        if (Array.isArray(response.data)) {
          requestsArray = response.data;
        } else if ((response.data as any).data?.content && Array.isArray((response.data as any).data.content)) {
          requestsArray = (response.data as any).data.content;
        } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
          requestsArray = (response.data as any).data;
        } else if ((response.data as any).content && Array.isArray((response.data as any).content)) {
          requestsArray = (response.data as any).content;
        } else {
          console.warn("예상되지 않은 보낸 요청 응답 구조:", response.data);
          this.sentRequests = [];
          return;
        }
      } catch (parseError) {
        console.error("보낸 요청 데이터 파싱 실패:", parseError);
        this.sentRequests = [];
        return;
      }

      const requestsWithProfiles = await Promise.allSettled(
        requestsArray.map(async (request: any) => {
          try {
            if (!request || (!request.receiver_id && !request.receiver?.id)) {
              throw new Error("유효하지 않은 보낸 요청 데이터");
            }

            const receiverId = request.receiver_id || request.receiver?.id;
            if (receiverId) {
              const receiverProfile = await this.userProfileManager.fetchUserProfile(receiverId.toString());

              if (receiverProfile) {
                const profileImageUrl =
                  receiverProfile.profileImage || request.receiver?.profile_image || request.receiver?.profileImage;

                return {
                  id: Number(receiverId),
                  name: receiverProfile.nickname || receiverProfile.username || `사용자 ${receiverId}`,
                  username: receiverProfile.username || `user${receiverId}`,
                  avatar: profileImageUrl && profileImageUrl.trim() !== "" ? profileImageUrl : undefined,
                  relationId: Number(request.id) || Math.floor(Math.random() * 1000000),
                };
              }
            }

            const profileImageUrl = request.receiver?.profile_image || request.receiver?.profileImage;

            return {
              id: Number(request.receiver_id) || Number(request.receiver?.id) || Math.floor(Math.random() * 1000000),
              name:
                request.receiver?.nickname ||
                request.receiver?.username ||
                `사용자 ${request.receiver_id || "unknown"}`,
              username: request.receiver?.username || `user${request.receiver_id || "unknown"}`,
              avatar: profileImageUrl && profileImageUrl.trim() !== "" ? profileImageUrl : undefined,
              relationId: Number(request.id) || Math.floor(Math.random() * 1000000),
            };
          } catch (error) {
            console.error(`보낸 요청 ${request?.id || "unknown"}의 받는이 프로필 정보 가져오기 실패:`, error);
            const profileImageUrl = request?.receiver?.profile_image || request?.receiver?.profileImage;

            return {
              id: Number(request?.receiver_id) || Number(request?.receiver?.id) || Math.floor(Math.random() * 1000000),
              name:
                request?.receiver?.nickname ||
                request?.receiver?.username ||
                `사용자 ${request?.receiver_id || "unknown"}`,
              username: request?.receiver?.username || `user${request?.receiver_id || "unknown"}`,
              avatar: profileImageUrl && profileImageUrl.trim() !== "" ? profileImageUrl : undefined,
              relationId: Number(request?.id) || Math.floor(Math.random() * 1000000),
            };
          }
        })
      );

      // 성공한 결과만 필터링
      this.sentRequests = requestsWithProfiles
        .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
        .map((result) => result.value)
        .filter((request) => request && request.id); // 유효한 요청만 포함
    } catch (error) {
      console.error("보낸 요청 목록 로드 중 예상치 못한 오류:", error);
      this.sentRequests = [];
      // 500번대 에러는 이미 friendService에서 "서버 오류가 발생했습니다" 메시지로 변환됨
      const errorMessage =
        error instanceof Error && error.message.includes("서버 오류")
          ? error.message
          : "보낸 친구 요청 목록을 불러오는 중 문제가 발생했습니다.";
      this.showErrorModal("보낸 요청 로드 오류", errorMessage);
      throw error;
    }
  }

  // Getters
  public getFriends(): Friend[] {
    try {
      return Array.isArray(this.friends) ? [...this.friends] : [];
    } catch (error) {
      console.error("친구 목록 조회 중 오류:", error);
      return [];
    }
  }

  public getFriendRequests(): FriendRequest[] {
    try {
      return Array.isArray(this.friendRequests) ? [...this.friendRequests] : [];
    } catch (error) {
      console.error("친구 요청 목록 조회 중 오류:", error);
      return [];
    }
  }

  public getSentRequests(): SentRequest[] {
    try {
      return Array.isArray(this.sentRequests) ? [...this.sentRequests] : [];
    } catch (error) {
      console.error("보낸 요청 목록 조회 중 오류:", error);
      return [];
    }
  }

  // Setters
  public setFriends(friends: Friend[]): void {
    try {
      if (!Array.isArray(friends)) {
        console.error("유효하지 않은 친구 목록 데이터:", friends);
        this.friends = [];
        return;
      }

      this.friends = friends.filter((friend) => friend && friend.id); // 유효한 친구만 설정
    } catch (error) {
      console.error("친구 목록 설정 중 오류:", error);
      this.friends = [];
    }
  }

  public setFriendRequests(requests: FriendRequest[]): void {
    try {
      if (!Array.isArray(requests)) {
        console.error("유효하지 않은 친구 요청 목록 데이터:", requests);
        this.friendRequests = [];
        return;
      }

      this.friendRequests = requests.filter((request) => request && request.id); // 유효한 요청만 설정
    } catch (error) {
      console.error("친구 요청 목록 설정 중 오류:", error);
      this.friendRequests = [];
    }
  }

  public setSentRequests(requests: SentRequest[]): void {
    try {
      if (!Array.isArray(requests)) {
        console.error("유효하지 않은 보낸 요청 목록 데이터:", requests);
        this.sentRequests = [];
        return;
      }

      this.sentRequests = requests.filter((request) => request && request.id); // 유효한 요청만 설정
    } catch (error) {
      console.error("보낸 요청 목록 설정 중 오류:", error);
      this.sentRequests = [];
    }
  }

  // Helper methods
  public addFriend(friend: Friend): void {
    try {
      if (!friend || !friend.id) {
        console.error("유효하지 않은 친구 데이터:", friend);
        return;
      }

      // 자기 자신을 친구로 추가하려는 경우 방지
      const currentUserId = UserManager.getUserId();
      if (currentUserId && friend.id === currentUserId) {
        console.warn("자기 자신을 친구로 추가할 수 없습니다.");
        return;
      }

      const isDuplicate = this.friends.some((f) => f.id === friend.id);
      if (!isDuplicate) {
        this.friends.push(friend);
      } else {
        console.warn(`친구 ${friend.id}가 이미 목록에 존재합니다.`);
      }
    } catch (error) {
      console.error("친구 추가 중 오류:", error);
    }
  }

  public removeFriend(friendId: number): void {
    try {
      if (!friendId || typeof friendId !== "number") {
        console.error("유효하지 않은 친구 ID:", friendId);
        return;
      }

      const initialLength = this.friends.length;
      this.friends = this.friends.filter((friend) => friend.id !== friendId);

      if (this.friends.length === initialLength) {
        console.warn(`친구 ID ${friendId}를 찾을 수 없습니다.`);
      }
    } catch (error) {
      console.error("친구 삭제 중 오류:", error);
    }
  }

  public updateFriendStatus(friendId: number, status: Friend["status"]): boolean {
    try {
      if (!friendId || typeof friendId !== "number") {
        console.error("유효하지 않은 친구 ID:", friendId);
        return false;
      }

      if (!status) {
        console.error("유효하지 않은 상태:", status);
        return false;
      }

      const friendIndex = this.friends.findIndex((friend) => friend.id === friendId);
      if (friendIndex !== -1) {
        this.friends[friendIndex].status = status;
        return true;
      } else {
        console.warn(`친구 ID ${friendId}를 찾을 수 없습니다.`);
        return false;
      }
    } catch (error) {
      console.error("친구 상태 업데이트 중 오류:", error);
      return false;
    }
  }

  public removeFriendRequest(relationId: number): void {
    try {
      if (!relationId || typeof relationId !== "number") {
        console.error("유효하지 않은 관계 ID:", relationId);
        return;
      }

      const initialLength = this.friendRequests.length;
      this.friendRequests = this.friendRequests.filter((request) => request.relationId !== relationId);

      if (this.friendRequests.length === initialLength) {
        console.warn(`친구 요청 관계 ID ${relationId}를 찾을 수 없습니다.`);
      }
    } catch (error) {
      console.error("친구 요청 삭제 중 오류:", error);
    }
  }

  public removeSentRequest(relationId: number): void {
    try {
      if (!relationId || typeof relationId !== "number") {
        console.error("유효하지 않은 관계 ID:", relationId);
        return;
      }

      const initialLength = this.sentRequests.length;
      this.sentRequests = this.sentRequests.filter((request) => request.relationId !== relationId);

      if (this.sentRequests.length === initialLength) {
        console.warn(`보낸 요청 관계 ID ${relationId}를 찾을 수 없습니다.`);
      }
    } catch (error) {
      console.error("보낸 요청 삭제 중 오류:", error);
    }
  }

  public getFriend(friendId: number): Friend | undefined {
    try {
      if (!friendId || typeof friendId !== "number") {
        console.error("유효하지 않은 친구 ID:", friendId);
        return undefined;
      }

      return this.friends.find((friend) => friend.id === friendId);
    } catch (error) {
      console.error("친구 조회 중 오류:", error);
      return undefined;
    }
  }

  // 자기 자신 확인 유틸리티 메서드
  public isSelfUser(userId: number): boolean {
    try {
      const currentUserId = UserManager.getUserId();
      return currentUserId === userId;
    } catch (error) {
      console.error("자기 자신 확인 중 오류:", error);
      return false;
    }
  }

  public isSelfUsername(username: string): boolean {
    try {
      const currentUser = this.userProfileManager.getCurrentUser();
      if (!currentUser || !username) return false;

      const trimmedUsername = username.trim().toLowerCase();
      return (
        currentUser.username?.toLowerCase() === trimmedUsername ||
        currentUser.nickname?.toLowerCase() === trimmedUsername
      );
    } catch (error) {
      console.error("자기 자신 사용자명 확인 중 오류:", error);
      return false;
    }
  }

  public updateFriendNickname(friendId: string, newNickname: string): boolean {
    try {
      const friendIdNum = parseInt(friendId);
      if (isNaN(friendIdNum)) {
        console.error("유효하지 않은 친구 ID:", friendId);
        return false;
      }

      const friendIndex = this.friends.findIndex((friend) => friend.id === friendIdNum);
      if (friendIndex !== -1) {
        this.friends[friendIndex].name = newNickname;
        return true;
      }
      return false;
    } catch (error) {
      console.error("친구 닉네임 업데이트 실패:", error);
      return false;
    }
  }

  public updateFriendProfileImage(friendId: string, newImageUrl: string): boolean {
    try {
      const friendIdNum = parseInt(friendId);
      if (isNaN(friendIdNum)) {
        console.error("유효하지 않은 친구 ID:", friendId);
        return false;
      }

      const friendIndex = this.friends.findIndex((friend) => friend.id === friendIdNum);
      if (friendIndex !== -1) {
        this.friends[friendIndex].avatar = newImageUrl;
        return true;
      }
      return false;
    } catch (error) {
      console.error("친구 프로필 이미지 업데이트 실패:", error);
      return false;
    }
  }
}
