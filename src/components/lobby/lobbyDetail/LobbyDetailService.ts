import { AuthManager } from "../../../utils/auth";
import { UserManager } from "../../../utils/user";
import { MatchData, LobbyData, SocketEventHandlers } from "../../../types/lobby";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_BASE_URL;

export class LobbyDetailService {
  private lobbyId: string;
  private socket: any = null;
  private handlers: SocketEventHandlers | null = null;

  constructor(lobbyId: string) {
    this.lobbyId = lobbyId;
  }

  // WebSocket 관련 메서드들
  async initWebSocket(handlers: SocketEventHandlers): Promise<void> {
    this.handlers = handlers;

    try {
      const userId = Number(UserManager.getUserId());
      if (!userId) {
        console.warn("WebSocket 연결 실패: 사용자 ID가 없습니다.");
        return;
      }

      // Socket.IO가 로드되었는지 확인
      if (typeof (window as any).io === "undefined") {
        console.error("Socket.IO 라이브러리가 로드되지 않았습니다.");
        await this.loadSocketIO();
      }

      this.connectWebSocket(userId);
    } catch (error) {
      console.error("WebSocket 초기화 실패:", error);
    }
  }

  private loadSocketIO(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof (window as any).io !== "undefined") {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `${SOCKET_BASE_URL}/socket.io/socket.io.js`;
      script.onload = () => {
        console.log("Socket.IO 라이브러리 로드 완료");
        resolve();
      };
      script.onerror = () => {
        console.error("Socket.IO 라이브러리 로드 실패");
        reject(new Error("Socket.IO 라이브러리 로드 실패"));
      };
      document.head.appendChild(script);
    });
  }

  private connectWebSocket(userId: number): void {
    try {
      console.log("🔌 WebSocket 연결 시도:", { userId, lobbyId: this.lobbyId });

      const socket = (window as any).io(`${SOCKET_BASE_URL}/ws/lobby`, {
        query: {
          "user-id": userId,
          "lobby-id": this.lobbyId,
        },
        transports: ["websocket", "polling"],
      });

      if (socket) {
        this.socket = socket;
        this.setupSocketEventListeners();
      }
    } catch (error) {
      console.error("💥 WebSocket 연결 실패:", error);
    }
  }

  private setupSocketEventListeners(): void {
    if (!this.socket || !this.handlers) return;

    // 로비 준비 상태 변경 이벤트
    this.socket.on("lobby:ready", (data: any) => {
      console.log("🎯 WebSocket에서 준비 상태 변경 이벤트 수신:", data);

      if (!data.user_id || data.is_ready === undefined) {
        console.error("❌ 준비 상태 이벤트 데이터가 불완전합니다:", data);
        return;
      }

      this.handlers!.onReadyStateChange(data);
    });

    // 로비 플레이어 변경 이벤트
    this.socket.on("lobby:player_change", (data: any) => {
      console.log("🎯 WebSocket에서 플레이어 변경 수신:", data);
      this.handlers!.onPlayerChange(data);
    });

    // 로비 업데이트 이벤트
    this.socket.on("lobby:update", (data: any) => {
      console.log("🎯 WebSocket에서 로비 업데이트 수신:", data);
      this.handlers!.onLobbyUpdate(data);
    });

    // 방장 위임 이벤트
    this.socket.on("lobby:authorize", (data: any) => {
      console.log("🎯 WebSocket에서 방장 위임 이벤트 수신:", data);
      this.handlers!.onLeadershipChange(data);
    });

    // 로비 퇴장 이벤트
    this.socket.on("lobby:left", (data: any) => {
      console.log("🎯 WebSocket에서 로비 퇴장 이벤트 수신:", data);
      console.log("📊 퇴장 이벤트 상세:", {
        user_id: data.user_id,
        lobby_id: data.lobby_id,
        type: data.type,
        timestamp: new Date().toISOString(),
      });
      this.handlers!.onPlayerLeft(data);
    });

    // 로비 입장 이벤트
    this.socket.on("lobby:join", (data: any) => {
      console.log("🎯 WebSocket에서 로비 입장 이벤트 수신:", data);
      console.log("📊 입장 이벤트 상세:", {
        user_id: data.user_id,
        lobby_id: data.lobby_id,
        type: data.type,
        timestamp: new Date().toISOString(),
      });
      this.handlers!.onPlayerJoined(data);
    });

    // 매칭 생성 이벤트
    this.socket.on("match:created", (data: any) => {
      console.log("🎯 WebSocket에서 매칭 생성 이벤트 수신:", data);
      console.log("📊 매칭 생성 이벤트 상세:", {
        tournament_id: data.tournament_id,
        lobby_id: data.lobby_id,
        round: data.round,
        total_matches: data.total_matches,
        games: data.games,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
      this.handlers!.onMatchCreated(data);
    });

    // 연결 상태 관리
    this.socket.on("connect", () => {
      console.log("✅ 로비 WebSocket 연결 성공");
      this.handlers!.onConnectionStatusChange(true, this.socket.io.engine.transport.name);

      this.socket.emit("join_lobby", {
        user_id: Number(UserManager.getUserId()),
        lobby_id: this.lobbyId,
      });
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("❌ 로비 WebSocket 연결 해제:", reason);
      this.handlers!.onConnectionStatusChange(false);
    });

    this.socket.on("connect_error", (error: any) => {
      console.error("💥 WebSocket 연결 오류:", error);
      setTimeout(() => {
        console.log("🔄 WebSocket 재연결 시도...");
        this.socket.connect();
      }, 3000);
    });

    // 방 입장 관련 이벤트
    this.socket.on("join_room_success", (data: any) => {
      console.log("🎉 로비 방 입장 성공:", data);
    });

    this.socket.on("join_room_error", (error: any) => {
      console.error("💥 로비 방 입장 실패:", error);
    });

    // 디버깅용 모든 이벤트 로깅
    this.socket.onAny((eventName: string, ...args: any[]) => {
      console.log(`🔊 WebSocket 이벤트 수신: ${eventName}`, args);
    });

    // 게임 시작 이벤트
    this.socket.on("game:started", (data: any) => {
      console.log("🎯 WebSocket에서 게임 이벤트 수신:", data);

      this.handlers?.onGameStarted(data);
    });

    console.log("🎯 WebSocket 초기화 완료 - 이벤트 리스너 등록됨");
  }

  getSocketInfo(): any {
    if (!this.socket) return null;

    return {
      "연결 상태": this.socket.connected,
      "소켓 ID": this.socket.id,
      네임스페이스: this.socket.nsp.name,
      "전송 방식": this.socket.io.engine?.transport?.name,
      "등록된 이벤트": Object.keys(this.socket._callbacks || {}),
      "쿼리 파라미터": this.socket.io.opts.query,
    };
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("WebSocket 연결 해제됨");
    }
  }

  // API 관련 메서드들
  async loadLobbyData(): Promise<LobbyData> {
    try {
      const response = await fetch(`${API_BASE_URL}/lobbies/${this.lobbyId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("로비를 찾을 수 없습니다.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json().then((data: any) => data.data);
      console.log("받은 로비 상세 데이터:", data);

      return this.transformApiDataToLobbyData(data);
    } catch (error) {
      console.error("로비 데이터 로드 실패:", error);
      throw error;
    }
  }

  private transformApiDataToLobbyData(data: any): LobbyData {
    const currentUserId = Number(UserManager.getUserId());
    const activePlayers = data.players?.filter((player: any) => player.enabled === true) || [];
    const currentPlayer = activePlayers.find((p: any) => p.user_id === currentUserId);

    return {
      id: data.id,
      name: `로비 ${data.id}`,
      tournamentId: data.tournament_id,
      maxPlayers: data.max_player || 2,
      status: data.lobby_status === "PENDING" ? "waiting" : "playing",
      statusText: data.lobby_status === "PENDING" ? "대기 중" : "게임 중",
      creatorId: data.creator_id,
      createdAt: new Date(data.created_at).toLocaleTimeString("ko-KR"),
      updatedAt: new Date(data.updated_at).toLocaleTimeString("ko-KR"),
      tournament: data.tournament,
      players: activePlayers,
      currentPlayers: activePlayers.length,
      host:
        data.creator_nickname ||
        activePlayers.find((p: any) => p.user_id === data.creator_id)?.user?.nickname ||
        "알 수 없음",
      isHost: currentUserId === data.creator_id,
      isPlayerReady: currentPlayer?.is_ready || false,
      allPlayersReady: activePlayers.length > 0 && activePlayers.every((p: any) => p.is_ready),
    };
  }

  async toggleReady(): Promise<void> {
    console.log("🔄 준비 상태 토글 API 호출 시작");

    const userId = Number(UserManager.getUserId());
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    console.log("📤 준비 상태 API 요청 데이터:", {
      user_id: userId,
      lobbyId: this.lobbyId,
    });

    const response = await fetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/ready_state`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
      }),
    });

    console.log("📥 준비 상태 API 응답:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ 준비 상태 API 에러 상세:", errorData);
      throw new Error(errorData.message || "준비 상태 변경에 실패했습니다.");
    }

    const result = await response.json();
    console.log("✅ 준비 상태 API 성공:", result);
  }

  async leaveLobby(): Promise<void> {
    console.log("로비 나가기 API 호출");

    const userId = Number(UserManager.getUserId());
    if (!userId) {
      throw new Error("로그인이 필요합니다.");
    }

    const response = await fetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/left`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lobby_id: parseInt(this.lobbyId),
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "로비 나가기에 실패했습니다.");
    }

    console.log("로비 나가기 성공");
  }

  async removeDefeatedPlayer(defeatedUserId: number): Promise<void> {
    console.log("💀 패배자 로비 제거 API 호출:", defeatedUserId);

    const response = await fetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/left`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lobby_id: parseInt(this.lobbyId),
        user_id: defeatedUserId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "패배자 제거에 실패했습니다.");
    }

    console.log("✅ 패배자 로비 제거 성공");
  }

  async transferLeadership(targetUserId: number): Promise<void> {
    console.log("🔄 방장 위임 API 호출 시작:", { targetUserId });

    const currentUserId = Number(UserManager.getUserId());
    if (!currentUserId) {
      throw new Error("로그인이 필요합니다.");
    }

    console.log("📤 방장 위임 요청 데이터:", {
      current_leader_id: currentUserId,
      target_user_id: targetUserId,
      lobbyId: this.lobbyId,
    });

    const response = await fetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_leader_id: currentUserId,
        target_user_id: targetUserId,
      }),
    });

    console.log("📥 방장 위임 응답:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ 방장 위임 API 실패:", errorData);
      throw new Error(errorData.message || "방장 위임에 실패했습니다.");
    }

    const result = await response.json();
    console.log("✅ 방장 위임 API 성공:", result);
  }

  async createMatch(): Promise<any> {
    console.log("🔄 매칭 생성 API 호출 시작");

    const currentUserId = Number(UserManager.getUserId());
    if (!currentUserId) {
      throw new Error("로그인이 필요합니다.");
    }

    console.log("📤 매칭 생성 요청 데이터:", {
      lobby_id: parseInt(this.lobbyId),
      user_id: currentUserId,
    });

    const response = await fetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/create_match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lobby_id: parseInt(this.lobbyId),
        user_id: currentUserId,
      }),
    });

    console.log("📥 매칭 생성 응답:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ 매칭 생성 API 실패:", errorData);
      throw new Error(errorData.message || "매칭 생성에 실패했습니다.");
    }

    const result = await response.json();
    console.log("✅ 매칭 생성 API 성공:", result);

    // 백엔드 응답 구조에 맞춰 데이터 반환
    const matchData = result.data || result;
    return {
      tournament_id: matchData.tournament_id,
      lobby_id: matchData.lobby_id,
      round: matchData.round,
      total_matches: matchData.total_matches,
      matches: matchData.matches,
      games: matchData.games, // 새로운 games 필드 추가
      message: matchData.message,
      winner: matchData.winner,
    };
  }

  async getMatchInfo(): Promise<any> {
    console.log("🔄 매칭 정보 조회 API 호출");

    try {
      const response = await fetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/matches`);

      if (!response.ok) {
        if (response.status === 404) {
          // 매칭이 아직 생성되지 않은 경우
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ 매칭 정보 조회 성공:", result);

      // 새로운 API 응답 구조에 맞춰 데이터 반환
      const tournamentData = result.data;
      return {
        lobby_id: tournamentData.lobby_id,
        tournament_id: tournamentData.tournament_id,
        tournament_status: tournamentData.tournament_status,
        current_round: tournamentData.current_round,
        total_rounds: tournamentData.total_rounds,
        matches: tournamentData.matches,
      };
    } catch (error) {
      console.warn("⚠️ 매칭 정보 조회 실패 (아직 매칭이 생성되지 않을 수 있음):", error);
      return null;
    }
  }

  async checkTournamentFinish(): Promise<any> {
    console.log("🏆 토너먼트 완료 상태 확인 API 호출");

    try {
      const response = await fetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/finish`);

      if (!response.ok) {
        if (response.status === 404) {
          // 토너먼트가 아직 완료되지 않은 경우
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json().then((data: any) => data.data);
      console.log("✅ 토너먼트 완료 상태 확인 성공:", result);

      return result;
    } catch (error) {
      console.warn("⚠️ 토너먼트 완료 상태 확인 실패:", error);
      return null;
    }
  }

  async startGames(lobbyData: LobbyData | null): Promise<any> {
    try {
      const userId = Number(UserManager.getUserId());
      const matches = lobbyData?.matchData?.matches ?? [];
      if (!lobbyData || !matches) {
        console.warn("존재하는 매치가 없습니다, 매치 생성 먼저하세요");
      }

      for (let match of matches) {
        const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/start_game`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            game_id: match.game_id,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
    } catch (error) {
      console.warn("⚠️ 게임 시작 실패:", error);
      return null;
    }
  }
}
