import { AuthManager } from "./auth";

interface Friend {
  id: number;
  username: string;
  nickname: string;
  profile_image?: string;
  status: "ONLINE" | "OFFLINE" | "IN_GAME";
}

interface FriendRequest {
  id: string;
  name: string;
  avatar?: string;
  relationId: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class FriendService {
  private static readonly API_BASE_URL = "http://localhost:3333/v1";
  private baseUrl: string;

  constructor() {
    this.baseUrl = "/friends";
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const tokens = AuthManager.getTokens();

      if (!tokens?.accessToken || !AuthManager.isTokenValid()) {
        return {
          success: false,
          message: "인증이 필요합니다. 다시 로그인해주세요.",
        };
      }

      const response = await fetch(`${FriendService.API_BASE_URL}${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          AuthManager.clearTokens();
          (window as any).app?.logout();
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("API 원본 응답:", data);
      return { success: true, data };
    } catch (error) {
      console.error("Friend API error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // 친구 목록 조회
  async getFriendsList(page: number = 1, size: number = 10): Promise<ApiResponse<any>> {
    return this.makeRequest(`/list?page=${page}&size=${size}`, {
      method: "GET",
    });
  }

  // 받은 친구 요청 조회
  async getReceivedRequests(page: number = 1, size: number = 10): Promise<ApiResponse<any>> {
    return this.makeRequest(`/received-requests?page=${page}&size=${size}`, {
      method: "GET",
    });
  }

  // 보낸 친구 요청 조회
  async getSentRequests(page: number = 1, size: number = 10): Promise<ApiResponse<any>> {
    return this.makeRequest(`/sent-requests?page=${page}&size=${size}`, {
      method: "GET",
    });
  }

  // 친구 요청 보내기
  async requestFriend(receiverId: string): Promise<ApiResponse<any>> {
    return this.makeRequest("/request", {
      method: "POST",
      body: JSON.stringify({ receiverId }),
    });
  }

  // 친구 요청 수락
  async acceptFriendRequest(relationId: string): Promise<ApiResponse<any>> {
    return this.makeRequest("/accept-request", {
      method: "PUT",
      body: JSON.stringify({ relationId }),
    });
  }

  // 친구 요청 거절
  async rejectFriendRequest(relationId: string): Promise<ApiResponse<any>> {
    return this.makeRequest("/reject-request", {
      method: "DELETE",
      body: JSON.stringify({ relationId }),
    });
  }

  // 친구 삭제
  async deleteFriend(relationId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/delete/${relationId}`, {
      method: "DELETE",
    });
  }

  // 친구 요청 취소
  async cancelFriendRequest(receiverId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/cancel-request/${receiverId}`, {
      method: "DELETE",
    });
  }
}

// 싱글톤 인스턴스
export const friendService = new FriendService();
