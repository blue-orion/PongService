import { Component } from "../../Component";
import { AuthManager } from "../../../utils/auth";
import { LobbyDetailService } from "./LobbyDetailService";
import { LobbyDetailUI } from "./LobbyDetailUI";
import { SocketEventProcessor } from "../managers/SocketEventProcessor";
import { LobbyData, SocketEventHandlers, UIEventHandlers } from "../../../types/lobby";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class LobbyDetailComponent extends Component {
  private lobbyId: string;
  private lobbyData: LobbyData | null = null;
  private isLoading: boolean = false;
  private service: LobbyDetailService;
  private ui: LobbyDetailUI;
  private socketProcessor: SocketEventProcessor;

  constructor(container: HTMLElement, lobbyId: string) {
    super(container);
    this.lobbyId = lobbyId;
    this.service = new LobbyDetailService(lobbyId);
    this.ui = new LobbyDetailUI(container);

    this.socketProcessor = new SocketEventProcessor(
      (lobbyData) => this.handleUIUpdate(lobbyData),
      () => this.loadLobbyData()
    );

    this.setupEventHandlers();
  }

  async render(): Promise<void> {
    this.ui.clearContainer();

    console.log("로비 상세 컴포넌트 렌더링 시작..., 로비 ID:", this.lobbyId);

    // WebSocket 연결
    await this.initWebSocket();

    // 로비 데이터 로드
    await this.loadLobbyData();
    console.log("로비 상세 컴포넌트 렌더링 완료");
  }

  private setupEventHandlers(): void {
    const uiHandlers: UIEventHandlers = {
      onBackToList: () => this.navigateToLobbyList(),
      onToggleReady: () => this.toggleReady(),
      onStartGame: () => this.startGame(),
      onSpectateGame: () => this.spectateGame(),
      onRefresh: () => this.loadLobbyData(),
      onLeaveLobby: () => this.leaveLobby(),
      onTransferLeadership: (targetUserId, targetUsername) => this.transferLeadership(targetUserId, targetUsername),
      onCreateMatch: () => this.createMatch(),
      onViewMatchInfo: () => this.viewMatchInfo(),
      onDebugSocket: () => this.debugSocketConnection(),
      onPlayGame: () => this.playGame(),
    };

    this.ui.setEventHandlers(uiHandlers);
  }

  private async initWebSocket(): Promise<void> {
    const socketHandlers: SocketEventHandlers = {
      onReadyStateChange: (data) => this.socketProcessor.handleReadyStateChange(data),
      onPlayerChange: (data) => this.socketProcessor.handlePlayerChange(data),
      onLobbyUpdate: (data) => this.socketProcessor.handleLobbyUpdate(data),
      onLeadershipChange: (data) => this.socketProcessor.handleLeadershipChange(data),
      onPlayerLeft: (data) => this.socketProcessor.handlePlayerLeft(data),
      onPlayerJoined: (data) => this.socketProcessor.handlePlayerJoined(data),
      onMatchCreated: (data) => this.socketProcessor.handleMatchCreated(data),
      onConnectionStatusChange: (isConnected, transport) => this.handleConnectionStatusChange(isConnected, transport),
    };

    await this.service.initWebSocket(socketHandlers);
  }

  private async loadLobbyData(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.ui.showLoadingState();

    try {
      this.lobbyData = await this.service.loadLobbyData();
      this.socketProcessor.setLobbyData(this.lobbyData);

      // 매칭 정보도 함께 조회
      const matchData = await this.service.getMatchInfo();
      if (matchData) {
        this.lobbyData.matchData = matchData;
        console.log("📊 기존 매칭 정보 로드됨:", matchData);
      }

      this.ui.renderLobbyDetail(this.lobbyData, this.service.isConnected());
    } catch (error) {
      console.error("로비 데이터 로드 실패:", error);
      this.ui.showErrorState(error instanceof Error ? error.message : "로비 정보를 불러오는데 실패했습니다.");
    } finally {
      this.isLoading = false;
    }
  }

  private handleUIUpdate(lobbyData: LobbyData): void {
    this.lobbyData = lobbyData;
    console.log("🎨 UI 업데이트 시작...");
    this.ui.updatePlayersUI(lobbyData);
    this.ui.updateActionButtonsUI(lobbyData);

    // 매칭 정보가 변경된 경우 렌더링
    this.ui.renderMatchInfoInLobby(lobbyData);

    console.log("✅ UI 업데이트 완료");
  }

  private handleConnectionStatusChange(isConnected: boolean, transport?: string): void {
    console.log("🔌 연결 상태 변경:", { connected: isConnected, transport });
    this.ui.updateConnectionStatus(isConnected, transport);
  }

  // UI 이벤트 핸들러들
  private navigateToLobbyList(): void {
    if (window.router) {
      window.router.navigate("/");
    }
  }

  private async toggleReady(): Promise<void> {
    console.log("🔄 준비 상태 토글 시작");
    try {
      if (!this.lobbyData) return;

      // 낙관적 업데이트
      const currentUserId = AuthManager.getCurrentUserId();
      if (currentUserId) {
        const currentPlayerIndex = this.lobbyData.players.findIndex((p: any) => p.user_id === currentUserId);
        if (currentPlayerIndex !== -1) {
          const originalReadyState = this.lobbyData.isPlayerReady;
          const newReadyState = !this.lobbyData.isPlayerReady;

          console.log(`🎯 낙관적 UI 업데이트: ${originalReadyState} → ${newReadyState}`);

          this.lobbyData.players[currentPlayerIndex].is_ready = newReadyState;
          this.lobbyData.isPlayerReady = newReadyState;
          this.lobbyData.allPlayersReady =
            this.lobbyData.players.length > 0 && this.lobbyData.players.every((p: any) => p.is_ready);

          this.ui.updatePlayersUI(this.lobbyData);
          this.ui.updateActionButtonsUI(this.lobbyData);

          try {
            await this.service.toggleReady();
            console.log("✅ 준비 상태 API 성공");
          } catch (error) {
            // API 실패 시 원래 상태로 되돌리기
            console.error("❌ 준비 상태 API 실패 - 원래 상태로 롤백");
            this.lobbyData.players[currentPlayerIndex].is_ready = originalReadyState;
            this.lobbyData.isPlayerReady = originalReadyState;
            this.lobbyData.allPlayersReady =
              this.lobbyData.players.length > 0 && this.lobbyData.players.every((p: any) => p.is_ready);

            this.ui.updatePlayersUI(this.lobbyData);
            this.ui.updateActionButtonsUI(this.lobbyData);
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("💥 준비 상태 변경 처리 실패:", error);
      const errorMessage = error instanceof Error ? error.message : "준비 상태 변경에 실패했습니다.";
      alert(`❌ ${errorMessage}`);
    }
  }

  private async startGame(): Promise<void> {
    console.log("게임 시작");
    try {
      if (window.router) {
        // 일괄적으로 백엔드 POST /lobbies/:lobbyId/game_start
        // body: {user_id, game_id}
        //
        // 각자 소켓 이벤트("game:started")를 받아서 router.navigate();
        window.router.navigate(`/game/${this.lobbyId}`);
      }
    } catch (error) {
      console.error("게임 시작 실패:", error);
    }
  }

  private spectateGame(): void {
    console.log("게임 관전");
    if (window.router) {
      window.router.navigate(`/game/${this.lobbyId}?mode=spectate`);
    }
  }

  private playGame(): void {
    console.log("게임 참여");
    if (window.router) {
      window.router.navigate(`/game/${this.lobbyId}?mode=play`);
    }
  }

  private async leaveLobby(): Promise<void> {
    if (confirm("정말로 로비를 나가시겠습니까?")) {
      console.log("로비 나가기");
      try {
        await this.service.leaveLobby();
        console.log("로비 나가기 성공");
        if (window.router) {
          window.router.navigate("/");
        }
      } catch (error) {
        console.error("로비 나가기 실패:", error);
        const errorMessage = error instanceof Error ? error.message : "로비 나가기에 실패했습니다.";
        alert(errorMessage);
      }
    }
  }

  private async transferLeadership(targetUserId: number, targetUsername: string): Promise<void> {
    if (confirm(`정말로 ${targetUsername}님에게 방장을 위임하시겠습니까?`)) {
      console.log("🔄 방장 위임 시작:", { targetUserId, targetUsername });
      try {
        await this.service.transferLeadership(targetUserId);
        console.log("✅ 방장 위임 API 성공");
        console.log("⏳ WebSocket 이벤트를 통한 실시간 업데이트 대기 중...");
      } catch (error) {
        console.error("❌ 방장 위임 처리 실패:", error);
        const errorMessage = error instanceof Error ? error.message : "방장 위임에 실패했습니다.";
        alert(`❌ ${errorMessage}`);
      }
    }
  }

  private debugSocketConnection(): void {
    console.log("🔍 === WebSocket 상태 디버깅 ===");

    const socketInfo = this.service.getSocketInfo();
    if (!socketInfo) {
      console.log("❌ 소켓이 초기화되지 않았습니다.");
      alert("❌ 소켓이 초기화되지 않았습니다.");
      return;
    }

    console.table(socketInfo);

    console.log("📋 현재 로비 상태 정보:", {
      lobbyId: this.lobbyId,
      currentUserId: AuthManager.getCurrentUserId(),
      playersCount: this.lobbyData?.players?.length || 0,
      currentUserReady: this.lobbyData?.isPlayerReady,
      allPlayersReady: this.lobbyData?.allPlayersReady,
    });

    alert(`🔍 소켓 상태: ${this.service.isConnected() ? "연결됨" : "연결 안됨"}\n자세한 정보는 콘솔을 확인하세요.`);
  }

  private async createMatch(): Promise<void> {
    if (confirm("매칭을 생성하시겠습니까? 모든 플레이어가 준비되어야 합니다.")) {
      console.log("🔄 매칭 생성 시작");
      try {
        const matchResult = await this.service.createMatch();
        console.log("✅ 매칭 생성 성공:", matchResult);

        // 매칭 결과를 로비 데이터에 저장
        if (this.lobbyData) {
          this.lobbyData.matchData = matchResult;
          console.log("📊 로비 데이터에 매칭 정보 저장 완료");

          // 로비 내 매칭 정보 섹션 즉시 업데이트
          this.ui.renderMatchInfoInLobby(this.lobbyData);
        }

        // 매칭 결과 UI 표시
        this.ui.showMatchResult(matchResult);

        // 로비 데이터 새로고침 (상태가 변경될 수 있음)
        await this.loadLobbyData();
      } catch (error) {
        console.error("❌ 매칭 생성 실패:", error);
        const errorMessage = error instanceof Error ? error.message : "매칭 생성에 실패했습니다.";
        alert(`❌ ${errorMessage}`);
      }
    }
  }

  private viewMatchInfo(): void {
    if (!this.lobbyData || !this.lobbyData.matchData) {
      alert("매칭 정보가 없습니다.");
      return;
    }

    console.log("🎮 매칭 정보 확인 모달 표시");
    this.ui.showMatchResult(this.lobbyData.matchData);
  }

  destroy(): void {
    this.ui.clearEventHandlers(); // 핸들러 제거
    this.service.disconnect();
  }
}
