import { AuthManager } from "../../../utils/auth";
import { UserManager } from "../../../utils/user";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface LobbyItem {
  id: number;
  name: string;
  host: string;
  status: "waiting" | "playing";
  statusText: string;
  currentPlayers: number;
  maxPlayers: number;
  createdAt: string;
  tournamentId: number;
  creatorId: number;
  tournament: any;
  isCurrentUserInLobby: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface LoadLobbiesParams {
  page: number;
  size: number;
  status?: string;
  search?: string;
}

export interface LoadLobbiesResult {
  lobbies: LobbyItem[];
  pagination: PaginationInfo;
}

export class LobbyListService {
  // API 호출 메서드들
  async loadLobbies(params: LoadLobbiesParams): Promise<LoadLobbiesResult> {
    try {
      let url = `${API_BASE_URL}/lobbies?page=${params.page}&size=${params.size}`;

      // 필터 파라미터 추가 (향후 백엔드 지원 시)
      if (params.status && params.status !== "all") {
        url += `&status=${params.status}`;
      }
      if (params.search && params.search.trim()) {
        url += `&search=${encodeURIComponent(params.search.trim())}`;
      }

      console.log("📤 로비 목록 API 호출:", url);

      const response = await AuthManager.authenticatedFetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json().then((data) => data.data);
      console.log("📥 로비 목록 API 응답:", data);

      const lobbiesArray = data.lobbies || [];
      const totalItems = data.total || 0;

      const transformedLobbies = this.transformLobbiesData(lobbiesArray);

      return {
        lobbies: transformedLobbies,
        pagination: {
          currentPage: params.page,
          pageSize: params.size,
          totalItems: totalItems,
          totalPages: Math.ceil(totalItems / params.size),
        },
      };
    } catch (error) {
      console.error("로비 목록 로드 실패:", error);
      throw error;
    }
  }

  async joinLobby(lobbyId: number): Promise<any> {
    console.log("🚪 로비 입장 API 호출:", lobbyId);

    const userId = UserManager.getUserId();
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    console.log("📤 로비 입장 요청:", { lobbyId, userId });

    const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${lobbyId}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lobby_id: lobbyId,
        user_id: userId,
      }),
    });

    console.log("📥 로비 입장 응답:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ 로비 입장 실패:", errorData);
      throw new Error(errorData.message || "로비 입장에 실패했습니다.");
    }

    const lobbyData = await response.json();
    console.log("✅ 로비 입장 성공:", lobbyData);

    return lobbyData;
  }

  // 데이터 변환 메서드
  private transformLobbiesData(lobbiesArray: any[]): LobbyItem[] {
    const currentUserId = UserManager.getUserId();

    return lobbiesArray.map((lobby: any) => {
      // players 배열에서 enabled가 true인 플레이어만 카운트
      const activePlayers = lobby.lobby_players?.filter((player: any) => player.enabled === true) || [];

      // 현재 로그인한 사용자가 이 로비에 참여 중인지 확인
      const isCurrentUserInLobby = activePlayers.some((player: any) => player.user_id === currentUserId);

      return {
        id: lobby.id,
        name: lobby.name || `로비 ${lobby.id}`,
        host: lobby.creator_nickname || lobby.creator?.nickname || "알 수 없음",
        status: lobby.lobby_status === "PENDING" ? "waiting" : "playing",
        statusText: lobby.lobby_status === "PENDING" ? "대기 중" : "게임 중",
        currentPlayers: activePlayers.length,
        maxPlayers: lobby.max_player || 2,
        createdAt: new Date(lobby.created_at).toLocaleString("ko-KR"),
        tournamentId: lobby.tournament_id,
        creatorId: lobby.creator_id,
        tournament: lobby.tournament,
        isCurrentUserInLobby: isCurrentUserInLobby,
      };
    });
  }

  // 유틸리티 메서드들
  calculatePaginationRange(currentPage: number, totalPages: number): { start: number; end: number } {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    return { start, end };
  }

  canGoToPreviousPage(currentPage: number): boolean {
    return currentPage > 1;
  }

  canGoToNextPage(currentPage: number, totalPages: number): boolean {
    return currentPage < totalPages;
  }

  calculateItemRange(pagination: PaginationInfo): { start: number; end: number } {
    const start = (pagination.currentPage - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems);
    return { start, end };
  }
}
