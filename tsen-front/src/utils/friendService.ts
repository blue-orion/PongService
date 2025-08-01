import { AuthManager } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Friend {
  id: number;
  username: string;
  nickname: string;
  profile?: string;
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
  private baseUrl: string;

  constructor() {
    this.baseUrl = "/friends";
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          AuthManager.clearTokens();
          (window as any).app?.logout();
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        }
        if (response.status === 404) {
          throw new Error("사용자를 찾을 수 없습니다.");
        }
        if (response.status >= 500) {
          throw new Error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
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

  // 친구 삭제 (새로운 API 형식 - body만 사용)
  async deleteFriend(deleteFriendId: number): Promise<ApiResponse<any>> {
    return this.makeRequest(`/delete`, {
      method: "DELETE",
      body: JSON.stringify({
        deleteFriendId: deleteFriendId,
      }),
    });
  }

  // 친구 요청 취소
  async cancelFriendRequest(receiverId: number, receiverName?: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/cancel-request`, {
      method: "DELETE",
      body: JSON.stringify({
        receiverId: receiverId,
        receiverName: receiverName,
      }),
    });
  }
}

// 싱글톤 인스턴스
export const friendService = new FriendService();
