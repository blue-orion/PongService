import { AuthManager } from "./auth";

interface FriendRequestData {
  receiverId: string;
}

interface Friend {
  id: number;
  username: string;
  nickname: string;
  profile_image?: string;
  status: "ONLINE" | "OFFLINE" | "IN_GAME";
}

interface FriendListResponse {
  friends: Friend[];
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
    this.baseUrl = "/friends"; // API 기본 URL
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const tokens = AuthManager.getTokens();

      if (!tokens || !tokens.accessToken) {
        console.warn("액세스 토큰이 없습니다. 로그인이 필요합니다.");
        return {
          success: false,
          message: "인증이 필요합니다. 다시 로그인해주세요.",
        };
      }

      // 토큰 만료 확인
      if (!AuthManager.isTokenValid()) {
        console.warn("토큰이 만료되었습니다.");
        return {
          success: false,
          message: "토큰이 만료되었습니다. 다시 로그인해주세요.",
        };
      }

      console.log("Friend API 요청:", `${FriendService.API_BASE_URL}${this.baseUrl}${endpoint}`);
      console.log("Authorization Header:", `Bearer ${tokens.accessToken.substring(0, 20)}...`);

      const response = await fetch(`${FriendService.API_BASE_URL}${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: tokens ? `Bearer ${tokens.accessToken}` : "",
          ...options.headers,
        },
      });

      console.log("Friend API 응답 상태:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          // 인증 실패 시 토큰 정리하고 로그인 페이지로 이동
          AuthManager.clearTokens();
          (window as any).app?.logout();
          throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Friend API 응답 데이터:", data);
      return { success: true, data };
    } catch (error) {
      console.error("Friend API error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // 친구 요청 보내기
  async requestFriend(receiverId: string): Promise<ApiResponse<any>> {
    return this.makeRequest("/request", {
      method: "POST",
      body: JSON.stringify({ receiverId }),
    });
  }

  // 친구 삭제
  async deleteFriend(relationId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/delete/${relationId}`, {
      method: "DELETE",
    });
  }

  // 친구 목록 조회
  async getFriendsList(page: number = 1, limit: number = 20): Promise<ApiResponse<FriendListResponse>> {
    return this.makeRequest(`/list?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  }

  // 받은 친구 요청 조회
  async getReceivedRequests(page: number = 1, limit: number = 20): Promise<ApiResponse<FriendRequest[]>> {
    return this.makeRequest(`/received-requests?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  }

  // 보낸 친구 요청 조회
  async getSentRequests(page: number = 1, limit: number = 20): Promise<ApiResponse<FriendRequest[]>> {
    return this.makeRequest(`/sent-requests?page=${page}&limit=${limit}`, {
      method: "GET",
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

  // 친구 요청 취소
  async cancelFriendRequest(receiverId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/cancel-request/${receiverId}`, {
      method: "DELETE",
    });
  }
}

// 싱글톤 인스턴스
export const friendService = new FriendService();
