import { AuthManager } from "../../../utils/auth";
import { UserManager } from "../../../utils/user";
import {
  MatchData,
  LobbyData,
  SocketEventHandlers,
  ChatMessage,
  TypingUser,
  ChatError,
  UserConnectionEvent,
  ChatSocketEventHandlers,
  LobbyPlayer,
} from "../../../types/lobby";
import { PlayerRenderer } from "../renderers/PlayerRenderer";
import { io } from "socket.io-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_BASE_URL;

export class LobbyDetailService {
  private lobbyId: string;
  private socket: any = null;
  private handlers: SocketEventHandlers | null = null;
  private chatHandlers: ChatSocketEventHandlers | null = null;
  private typingTimeout: number | null = null;

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

      this.connectWebSocket(userId);
    } catch (error) {
      console.error("WebSocket 초기화 실패:", error);
    }
  }

  // 채팅 핸들러 설정 메서드 추가
  setChatHandlers(chatHandlers: ChatSocketEventHandlers): void {
    this.chatHandlers = chatHandlers;
  }

  private connectWebSocket(userId: number): void {
    try {
      console.log("🔌 WebSocket 연결 시도:", { userId, lobbyId: this.lobbyId });

      const socket = io(`${SOCKET_BASE_URL}/ws/lobby`, {
        auth: {
          userId,
          lobbyId: Number(this.lobbyId),
          username: UserManager.getUsername(),
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

      this.handlers!.onMatchCreated(data);
    });

    // 연결 상태 관리
    this.socket.on("connect", () => {
      console.log("✅ 로비 WebSocket 연결 성공");
      this.handlers!.onConnectionStatusChange(true, this.socket.io.engine.transport.name);

      // 채팅 핸들러가 있으면 연결 상태 알림
      if (this.chatHandlers) {
        this.chatHandlers.onConnectionStatusChange(true, this.socket.io.engine.transport.name);
      }

      // 로비에 입장
      this.socket.emit("join_lobby", {
        user_id: Number(UserManager.getUserId()),
        lobby_id: this.lobbyId,
      });

      // 채팅 방에도 입장
      this.socket.emit("join-lobby", {
        lobby_id: this.lobbyId,
      });
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("❌ 로비 WebSocket 연결 해제:", reason);
      this.handlers!.onConnectionStatusChange(false);

      // 채팅 핸들러가 있으면 연결 해제 상태 알림
      if (this.chatHandlers) {
        this.chatHandlers.onConnectionStatusChange(false);
      }
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

    // 게임 시작 이벤트
    this.socket.on("game:started", (data: any) => {
      console.log("🎯 WebSocket에서 게임 시작 이벤트 수신:", data);
      console.log("📊 게임 시작 이벤트 상세:", {
        tournament_id: data.tournament_id,
        game_id: data.game_id,
        lobby_id: data.lobby_id,
        players: data.players,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
      this.handlers?.onGameStarted(data);
    });

    // 게임 완료 이벤트 (새로운 백엔드 이벤트)
    this.socket.on("game:completed", (data: any) => {
      console.log("🎯 WebSocket에서 게임 완료 이벤트 수신:", data);
      console.log("📊 게임 완료 이벤트 상세:", {
        tournament_id: data.tournament_id,
        game_id: data.game_id,
        lobby_id: data.lobby_id,
        current_round: data.current_round,
        tournament_status: data.tournament_status,
        winner_id: data.winner_id,
        loser_id: data.loser_id,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
      this.handlers?.onGameCompleted?.(data);
    });

    // 토너먼트 완료 이벤트 (새로운 백엔드 이벤트)
    this.socket.on("tournament:completed", (data: any) => {
      console.log("🎯 WebSocket에서 토너먼트 완료 이벤트 수신:", data);
      console.log("📊 토너먼트 완료 이벤트 상세:", {
        tournament_id: data.tournament_id,
        lobby_id: data.lobby_id,
        tournament_status: data.tournament_status,
        tournament_type: data.tournament_type,
        final_round: data.final_round,
        winner_id: data.winner_id,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
      this.handlers?.onTournamentCompleted?.(data);
    });

    // 플레이어 제거 이벤트 (새로운 백엔드 이벤트)
    this.socket.on("lobby:playerRemoved", (data: any) => {
      console.log("🎯 WebSocket에서 플레이어 제거 이벤트 수신:", data);
      console.log("📊 플레이어 제거 이벤트 상세:", {
        lobby_id: data.lobby_id,
        removed_user_id: data.removed_user_id,
        reason: data.reason,
        message: data.message,
        timestamp: new Date().toISOString(),
      });
      this.handlers?.onPlayerRemoved?.(data);
    });

    // 채팅 이벤트 리스너들 직접 설정
    this.socket.on("chat:message", (data: ChatMessage) => {
      if (this.chatHandlers) {
        this.chatHandlers.onChatMessage(data);
      }
    });

    this.socket.on("user:connected", (data: UserConnectionEvent) => {
      if (this.chatHandlers) {
        this.chatHandlers.onUserConnected(data);
      }
    });

    this.socket.on("user:disconnected", (data: UserConnectionEvent) => {
      if (this.chatHandlers) {
        this.chatHandlers.onUserDisconnected(data);
      }
    });

    this.socket.on("chat:typing", (data: TypingUser) => {
      if (this.chatHandlers) {
        this.chatHandlers.onTyping(data);
      }
    });

    this.socket.on("chat:stop-typing", (data: TypingUser) => {
      if (this.chatHandlers) {
        this.chatHandlers.onStopTyping(data);
      }
    });

    this.socket.on("chat:error", (data: ChatError) => {
      console.error("💥 채팅 에러:", data);
      if (this.chatHandlers) {
        this.chatHandlers.onError(data.error || "채팅 오류가 발생했습니다.");
      }
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
    // 타이핑 타이머 정리
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }

    // 채팅 로비에서 나가기
    this.leaveLobbyChat();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("WebSocket 연결 해제됨");
    }
  }

  // API 관련 메서드들
  async loadLobbyData(): Promise<LobbyData> {
    try {
      const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${this.lobbyId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("로비를 찾을 수 없습니다.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("📥 로비 데이터 API 응답:", responseData);

      // 백엔드 응답 구조에 맞춰 데이터 추출 - { data:  } 또는 { data: ... } 형태 지원
      const rawData = responseData.data || responseData;
      const lobbyData = this.transformApiDataToLobbyData(rawData);

      console.log("✅ 로비 데이터 로드 성공:", lobbyData);
      return lobbyData;
    } catch (error) {
      console.error("로비 데이터 로드 실패:", error);
      throw error;
    }
  }

  private transformApiDataToLobbyData(data: any): LobbyData {
    const currentUserId = Number(UserManager.getUserId());
    const activePlayers = data.players?.filter((player: any) => player.enabled === true) || [];
    const currentPlayer = activePlayers.find((p: any) => p.user_id === currentUserId);

    // 백엔드 DTO에 맞춘 로비 데이터 변환
    const lobbyData: LobbyData = {
      // 백엔드 필드들 (primary)
      id: data.id,
      tournament_id: data.tournament_id,
      max_player: data.max_player || 2,
      lobby_status: data.lobby_status || "PENDING",
      creator_id: data.creator_id,
      creator_nickname: data.creator_nickname,
      created_at: data.created_at,
      updated_at: data.updated_at,
      tournament: data.tournament,
      lobby_players: activePlayers,

      // 호환성을 위한 필드들 (프론트엔드 기존 로직 호환성)
      name: `로비 ${data.id}`,
      tournamentId: data.tournament_id,
      maxPlayers: data.max_player || 2,
      status: data.lobby_status === "PENDING" ? "waiting" : "playing",
      statusText: data.lobby_status === "PENDING" ? "대기 중" : "게임 중",
      creatorId: data.creator_id,
      createdAt: new Date(data.created_at).toLocaleString("ko-KR"),
      updatedAt: new Date(data.updated_at).toLocaleString("ko-KR"),
      currentPlayers: activePlayers.length,
      players: activePlayers,
      host:
        data.creator_nickname ||
        activePlayers.find((p: any) => p.user_id === data.creator_id)?.user?.nickname ||
        "알 수 없음",
      isHost: currentUserId === data.creator_id,
      isPlayerReady: currentPlayer?.is_ready || false,
      allPlayersReady: activePlayers.length > 0 && activePlayers.every((p: any) => p.is_ready),
    };

    return lobbyData;
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

    const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/ready_state`, {
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

    const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/left`, {
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

    const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/left`, {
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

    const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/authorize`, {
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

    const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/create_match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lobby_id: parseInt(this.lobbyId),
        user_id: currentUserId,
      }),
    });

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
      tournament_status: matchData.tournament_status,
      lobby_id: matchData.lobby_id,
      current_round: matchData.current_round,
      total_rounds: matchData.total_rounds,
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
      const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/matches`);

      if (!response.ok) {
        if (response.status === 404) {
          // 매칭이 아직 생성되지 않은 경우
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("✅ 매칭 정보 조회 성공:", responseData);

      // 백엔드 응답 구조에 맞춰 데이터 추출
      const tournamentData = responseData.data || responseData;
      return {
        lobby_id: tournamentData.lobby_id,
        tournament_id: tournamentData.tournament_id,
        tournament_status: tournamentData.tournament_status,
        current_round: tournamentData.current_round,
        total_rounds: tournamentData.total_rounds,
        matches: tournamentData.games || tournamentData.matches, // games 필드 우선 지원
        games: tournamentData.games, // 새로운 games 필드 추가
      };
    } catch (error) {
      console.warn("⚠️ 매칭 정보 조회 실패 (아직 매칭이 생성되지 않을 수 있음):", error);
      return null;
    }
  }

  async checkTournamentFinish(): Promise<any> {
    console.log("🏆 토너먼트 완료 상태 확인 API 호출");

    try {
      const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/finish`);

      if (!response.ok) {
        if (response.status === 409) {
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
      const games = lobbyData?.matchData?.games ?? [];
      if (!lobbyData || !games) {
        console.warn("존재하는 게임이 없습니다, 게임 생성 먼저하세요");
      }

      for (let game of games) {
        const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${this.lobbyId}/start_game`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            game_id: game.game_id,
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

  // 채팅 관련 메서드들
  sendMessage(message: string): void {
    if (!this.socket || !this.socket.connected) {
      this.chatHandlers?.onError("채팅을 보낼 수 없습니다. 연결을 확인해주세요.");
      return;
    }

    if (!message || message.trim().length === 0) {
      this.chatHandlers?.onError("빈 메시지는 보낼 수 없습니다.");
      return;
    }

    if (message.length > 500) {
      this.chatHandlers?.onError("메시지가 너무 깁니다. (최대 500자)");
      return;
    }

    const username = UserManager.getUsername() || `User${UserManager.getUserId()}`;

    this.socket.emit("chat:message", {
      lobby_id: this.lobbyId,
      message: message.trim(),
      username: username,
    });
  }

  sendTyping(): void {
    if (!this.socket || !this.socket.connected) return;

    const username = UserManager.getUsername() || `User${UserManager.getUserId()}`;

    this.socket.emit("chat:typing", {
      lobby_id: this.lobbyId,
      username: username,
    });

    // 타이핑 상태를 3초 후 자동으로 중지
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.sendStopTyping();
    }, 3000);
  }

  sendStopTyping(): void {
    if (!this.socket || !this.socket.connected) return;

    const username = UserManager.getUsername() || `User${UserManager.getUserId()}`;

    this.socket.emit("chat:stop-typing", {
      lobby_id: this.lobbyId,
      username: username,
    });

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  joinLobbyChat(lobbyId: string): void {
    if (!this.socket || !this.socket.connected) return;

    if (this.lobbyId !== lobbyId) {
      // 기존 로비에서 나가기
      this.leaveLobbyChat();
      this.lobbyId = lobbyId;
    }

    this.socket.emit("join-lobby", { lobby_id: lobbyId });
  }

  leaveLobbyChat(): void {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit("leave-lobby", { lobby_id: this.lobbyId });
  }

  getCurrentLobbyId(): string {
    return this.lobbyId;
  }

  // 자동 방장 선정 기능 추가
  autoAssignNewLeader(lobbyData: LobbyData): void {
    // 활성화된 플레이어 중에서 새로운 방장 선정
    const activePlayers = lobbyData.players?.filter(
      (player: LobbyPlayer) => player.enabled !== false && player.user_id !== UserManager.getUserId()
    );
    console.log("👑 자동 방장 선정 시작:", {
      totalActivePlayers: activePlayers?.length,
      lobbyId: lobbyData.id,
    });
    if (!activePlayers || activePlayers.length === 0) {
      console.warn("❌ 활성화된 플레이어가 없습니다. 방장 선정이 불가능합니다.");
      this.handlers!.onRefresh();
      return;
    }

    // 방장 선정: 가장 먼저 입장한 플레이어 (user_id가 가장 작은 플레이어)
    const newLeader = activePlayers.reduce((prev, current) => {
      return prev.user_id < current.user_id ? prev : current;
    });

    console.log("👑 새로운 방장 자동 선정:", {
      newLeaderId: newLeader.user_id,
      newLeaderName: PlayerRenderer.getPlayerDisplayName(newLeader),
      totalActivePlayers: activePlayers.length,
    });

    // 기존 방장 위임 로직을 활용하여 방장 변경 처리
    this.transferLeadership(newLeader.user_id)
      .then(() => {
        // 방장 위임 완료 후 로비 데이터 갱신
        console.log("✅ 방장 위임 완료, 로비 데이터 갱신 중...");
        this.handlers!.onRefresh();
      })
      .catch((error) => {
        console.error("❌ 자동 방장 위임 실패:", error);
        this.handlers!.onRefresh();
      });
  }
}
