import { friendService } from "../../utils/friendService";
import { Friend, FriendRequest, SentRequest } from "../../types/friend.types";
import { UserProfileManager } from "./UserProfileManager";

export class FriendDataManager {
  private friends: Friend[] = [];
  private friendRequests: FriendRequest[] = [];
  private sentRequests: SentRequest[] = [];
  private userProfileManager: UserProfileManager;

  constructor(userProfileManager: UserProfileManager) {
    this.userProfileManager = userProfileManager;
  }

  public async loadAllData(): Promise<void> {
    try {
      await Promise.all([this.loadFriends(), this.loadFriendRequests(), this.loadSentRequests()]);
    } catch (error) {
      console.error("친구 데이터 로드 실패:", error);
      this.friends = [];
      this.friendRequests = [];
      this.sentRequests = [];
    }
  }

  public async loadFriends(): Promise<void> {
    const response = await friendService.getFriendsList();

    if (!response.success || !response.data) {
      this.friends = [];
      return;
    }

    // 응답 구조 처리
    let friendsData: any[] = [];
    if (response.data.friends && Array.isArray(response.data.friends)) {
      friendsData = response.data.friends;
    } else if ((response.data as any).data?.friends && Array.isArray((response.data as any).data.friends)) {
      friendsData = (response.data as any).data.friends;
    }

    // 각 친구의 상세 프로필 정보를 API로 가져오기
    const friendsWithProfiles = await Promise.all(
      friendsData.map(async (friend: any) => {
        try {
          const friendProfile = await this.userProfileManager.fetchUserProfile(friend.id.toString());

          if (friendProfile) {
            return {
              id: friend.id.toString(),
              name: friendProfile.nickname || friendProfile.username || friend.username,
              username: friendProfile.username || friend.username,
              status: this.userProfileManager.convertStatus(friendProfile.status || "OFFLINE"),
              avatar: friendProfile.profileImage,
              relationId: friend.relationId?.toString() || friend.id.toString(),
            };
          } else {
            return {
              id: friend.id.toString(),
              name: friend.nickname || friend.username,
              username: friend.username,
              status: this.userProfileManager.convertStatus(friend.status || "OFFLINE"),
              avatar: friend.profile_image,
              relationId: friend.relationId?.toString() || friend.id.toString(),
            };
          }
        } catch (error) {
          console.error(`친구 ${friend.id}의 프로필 정보 가져오기 실패:`, error);
          return {
            id: friend.id.toString(),
            name: friend.nickname || friend.username || `사용자${friend.id}`,
            username: friend.username || `user${friend.id}`,
            status: this.userProfileManager.convertStatus(friend.status || "OFFLINE"),
            avatar: friend.profile_image,
            relationId: friend.relationId?.toString() || friend.id.toString(),
          };
        }
      })
    );

    this.friends = friendsWithProfiles;
  }

  public async loadFriendRequests(): Promise<void> {
    const response = await friendService.getReceivedRequests();

    if (!response.success || !response.data) {
      this.friendRequests = [];
      return;
    }

    // 응답 구조 처리
    let requestsArray: any[] = [];
    if (Array.isArray(response.data)) {
      requestsArray = response.data;
    } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
      requestsArray = (response.data as any).data;
    } else if ((response.data as any).content && Array.isArray((response.data as any).content)) {
      requestsArray = (response.data as any).content;
    }

    const requestsWithProfiles = await Promise.all(
      requestsArray.map(async (request: any) => {
        try {
          const senderId = request.sender_id || request.sender?.id;
          if (senderId) {
            const senderProfile = await this.userProfileManager.fetchUserProfile(senderId.toString());

            if (senderProfile) {
              return {
                id: request.id?.toString() || "unknown",
                name: senderProfile.nickname || senderProfile.username || `사용자 ${senderId}`,
                username: senderProfile.username || `user${senderId}`,
                avatar: senderProfile.profileImage,
                relationId: request.id?.toString() || "unknown",
              };
            }
          }

          return {
            id: request.id?.toString() || "unknown",
            name: request.sender?.nickname || request.sender?.username || `사용자 ${request.sender_id}`,
            username: request.sender?.username || `사용자 ${request.sender_id}`,
            avatar: request.sender?.profile_image || null,
            relationId: request.id?.toString() || "unknown",
          };
        } catch (error) {
          console.error(`친구 요청 ${request.id}의 보낸이 프로필 정보 가져오기 실패:`, error);
          return {
            id: request.id?.toString() || "unknown",
            name: request.sender?.nickname || request.sender?.username || `사용자 ${request.sender_id || "unknown"}`,
            username: request.sender?.username || `user${request.sender_id || "unknown"}`,
            avatar: request.sender?.profile_image || null,
            relationId: request.id?.toString() || "unknown",
          };
        }
      })
    );

    this.friendRequests = requestsWithProfiles;
  }

  public async loadSentRequests(): Promise<void> {
    const response = await friendService.getSentRequests();

    if (!response.success || !response.data) {
      this.sentRequests = [];
      return;
    }

    let requestsArray: any[] = [];
    if (Array.isArray(response.data)) {
      requestsArray = response.data;
    } else if ((response.data as any).data?.content && Array.isArray((response.data as any).data.content)) {
      requestsArray = (response.data as any).data.content;
    } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
      requestsArray = (response.data as any).data;
    } else if ((response.data as any).content && Array.isArray((response.data as any).content)) {
      requestsArray = (response.data as any).content;
    }

    const requestsWithProfiles = await Promise.all(
      requestsArray.map(async (request: any) => {
        try {
          const receiverId = request.receiver_id || request.receiver?.id;
          if (receiverId) {
            const receiverProfile = await this.userProfileManager.fetchUserProfile(receiverId.toString());

            if (receiverProfile) {
              return {
                id: receiverId.toString(),
                name: receiverProfile.nickname || receiverProfile.username || `사용자 ${receiverId}`,
                username: receiverProfile.username || `user${receiverId}`,
                avatar: receiverProfile.profileImage,
                relationId: request.id?.toString() || "unknown",
              };
            }
          }

          return {
            id: request.receiver_id?.toString() || request.receiver?.id?.toString() || "unknown",
            name:
              request.receiver?.nickname || request.receiver?.username || `사용자 ${request.receiver_id || "unknown"}`,
            username: request.receiver?.username || `사용자 ${request.receiver_id || "unknown"}`,
            avatar: request.receiver?.profile_image || undefined,
            relationId: request.id?.toString() || "unknown",
          };
        } catch (error) {
          console.error(`보낸 요청 ${request.id}의 받는이 프로필 정보 가져오기 실패:`, error);
          return {
            id: request.receiver_id?.toString() || request.receiver?.id?.toString() || "unknown",
            name:
              request.receiver?.nickname || request.receiver?.username || `사용자 ${request.receiver_id || "unknown"}`,
            username: request.receiver?.username || `user${request.receiver_id || "unknown"}`,
            avatar: request.receiver?.profile_image || undefined,
            relationId: request.id?.toString() || "unknown",
          };
        }
      })
    );

    this.sentRequests = requestsWithProfiles;
  }

  // Getters
  public getFriends(): Friend[] {
    return this.friends;
  }

  public getFriendRequests(): FriendRequest[] {
    return this.friendRequests;
  }

  public getSentRequests(): SentRequest[] {
    return this.sentRequests;
  }

  // Setters
  public setFriends(friends: Friend[]): void {
    this.friends = friends;
  }

  public setFriendRequests(requests: FriendRequest[]): void {
    this.friendRequests = requests;
  }

  public setSentRequests(requests: SentRequest[]): void {
    this.sentRequests = requests;
  }

  // Helper methods
  public addFriend(friend: Friend): void {
    const isDuplicate = this.friends.some((f) => f.id === friend.id);
    if (!isDuplicate) {
      this.friends.push(friend);
    }
  }

  public removeFriend(friendId: string): void {
    this.friends = this.friends.filter((friend) => friend.id !== friendId);
  }

  public updateFriendStatus(friendId: string, status: Friend["status"]): boolean {
    const friendIndex = this.friends.findIndex((friend) => friend.id === friendId);
    if (friendIndex !== -1) {
      this.friends[friendIndex].status = status;
      return true;
    }
    return false;
  }

  public removeFriendRequest(relationId: string): void {
    this.friendRequests = this.friendRequests.filter((request) => request.relationId !== relationId);
  }

  public removeSentRequest(relationId: string): void {
    this.sentRequests = this.sentRequests.filter((request) => request.relationId !== relationId);
  }

  public getFriend(friendId: string): Friend | undefined {
    return this.friends.find((friend) => friend.id === friendId);
  }
}
