import { Component } from "../../Component";
import { MatchInfo } from "../../../types/lobby";
import { UserManager } from "../../../utils/user";
import { LobbyDetailService } from "./LobbyDetailService";
import { LobbyDetailUI } from "./LobbyDetailUI";
import { SocketEventProcessor } from "../managers/SocketEventProcessor";
import { LobbyData, SocketEventHandlers, UIEventHandlers } from "../../../types/lobby";

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
      () => this.loadLobbyData(),
      () => this.playGame(),
      () => this.getParticipatedGameId()
    );

    this.setupEventHandlers();
  }

  async render(): Promise<void> {
    this.ui.clearContainer();

    // WebSocket 연결
    await this.initWebSocket();

    // 로비 데이터 로드
    await this.loadLobbyData();
  }

  private setupEventHandlers(): void {
    const uiHandlers: UIEventHandlers = {
      onBackToList: () => this.navigateToLobbyList(),
      onToggleReady: () => this.toggleReady(),
      onStartGame: () => this.startGame(),
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
      onGameStarted: (data) => this.socketProcessor.handleGameStarted(data),
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
        // 매칭 정보 포함된 최신 로비 데이터를 SocketEventProcessor에 전달
        this.socketProcessor.setLobbyData(this.lobbyData);
      }

      // 토너먼트 완료 상태 확인
      const tournamentFinishData = await this.service.checkTournamentFinish();
      if (tournamentFinishData) {
        this.showTournamentResult(tournamentFinishData);
        return;
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
    this.socketProcessor.setLobbyData(this.lobbyData); // 최신 로비 데이터 동기화
    this.ui.updatePlayersUI(lobbyData);
    this.ui.updateActionButtonsUI(lobbyData);

    // 매칭 정보가 변경된 경우 렌더링
    this.ui.renderMatchInfoInLobby(lobbyData);
  }

  private handleConnectionStatusChange(isConnected: boolean, transport?: string): void {
    this.ui.updateConnectionStatus(isConnected, transport);
  }

  // UI 이벤트 핸들러들
  private navigateToLobbyList(): void {
    if (window.router) {
      // 브라우저 히스토리를 사용하여 이전 페이지로 이동
      if (window.router.canGoBack()) {
        window.router.goBack();
      } else {
        // 히스토리가 없으면 로비 목록으로 이동
        window.router.navigate("/");
      }
    }
  }

  private async toggleReady(): Promise<void> {
    try {
      if (!this.lobbyData) return;

      // 낙관적 업데이트
      const currentUserId = Number(UserManager.getUserId());
      if (currentUserId) {
        const currentPlayerIndex = this.lobbyData.players.findIndex((p: any) => p.user_id === Number(currentUserId));
        if (currentPlayerIndex !== -1) {
          const originalReadyState = this.lobbyData.isPlayerReady;
          const newReadyState = !this.lobbyData.isPlayerReady;

          this.lobbyData.players[currentPlayerIndex].is_ready = newReadyState;
          this.lobbyData.isPlayerReady = newReadyState;
          this.lobbyData.allPlayersReady =
            this.lobbyData.players.length > 0 && this.lobbyData.players.every((p: any) => p.is_ready);

          this.ui.updatePlayersUI(this.lobbyData);
          this.ui.updateActionButtonsUI(this.lobbyData);

          try {
            await this.service.toggleReady();
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
    try {
      if (window.router) {
        this.service.startGames(this.lobbyData);
        // 일괄적으로 백엔드 POST /lobbies/:lobbyId/start_game
        // body: {user_id, game_id}
        //
        // 각자 소켓 이벤트("game:started")를 받아서 router.navigate();
        // window.router.navigate(`/game/${this.lobbyId}`);
      }
    } catch (error) {
      console.error("게임 시작 실패:", error);
    }
  }

  public playGame(): void {
    console.log("게임 참여");
    const match = this.getParticipatedGameId();
    if (!match) {
      console.warn("매칭된 게임이 없습니다.");
      return;
    }
    if (window.router) {
      window.router.navigate(`/game/${match?.game_id}/${this.lobbyData?.tournamentId}`, false);
    }
  }

  public getParticipatedGameId(): MatchInfo | undefined {
    console.log("🔍 getParticipatedGameId 호출 시작");
    console.log("🔍 현재 로비 데이터:", {
      hasLobbyData: !!this.lobbyData,
      hasMatchData: !!this.lobbyData?.matchData,
      lobbyId: this.lobbyData?.id,
      tournamentId: this.lobbyData?.tournamentId,
    });

    if (!this.lobbyData || !this.lobbyData.matchData) {
      console.warn("로비 데이터 혹은 매치가 생성되기 이전입니다.");
      return undefined;
    }

    const matches = this.lobbyData?.matchData?.matches;
    const userId = UserManager.getUserId();

    console.log("🔍 매치 검색 조건:", {
      userId,
      userIdType: typeof userId,
      totalMatches: matches?.length || 0,
      matches: matches?.map((m) => ({
        game_id: m.game_id,
        game_status: m.game_status,
        left_player_id: m.left_player.id,
        left_player_id_type: typeof m.left_player.id,
        right_player_id: m.right_player.id,
        right_player_id_type: typeof m.right_player.id,
      })),
    });

    const participatedMatch = matches?.find(
      (match) =>
        match.game_status !== "COMPLETED" && (match.left_player.id === userId || match.right_player.id === userId)
    );

    console.log("🔍 참여 게임 검색 결과:", {
      userId,
      totalMatches: matches?.length || 0,
      participatedMatch: participatedMatch
        ? {
            game_id: participatedMatch.game_id,
            game_status: participatedMatch.game_status,
            left_player: participatedMatch.left_player,
            right_player: participatedMatch.right_player,
          }
        : "없음",
    });

    return participatedMatch;
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
      currentUserId: Number(UserManager.getUserId()),
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

          // SocketEventProcessor에 최신 로비 데이터 동기화
          this.socketProcessor.setLobbyData(this.lobbyData);

          // 로비 내 매칭 정보 섹션 즉시 업데이트
          this.ui.renderMatchInfoInLobby(this.lobbyData);
        }

        // 매칭 생성 성공 후 게임 시작 호출
        console.log("🎮 게임 시작 호출 시작");
        try {
          await this.service.startGames(this.lobbyData);
          console.log("✅ 게임 시작 성공");
        } catch (startError) {
          console.error("❌ 게임 시작 실패:", startError);
          // 게임 시작 실패는 매칭 생성이 성공했으므로 사용자에게 경고만 표시
          console.warn("⚠️ 매칭은 생성되었지만 게임 시작에 실패했습니다.");
        }

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

  private showTournamentResult(tournamentData: any): void {
    console.log("🏆 토너먼트 결과 표시:", tournamentData);

    const currentUserId = Number(UserManager.getUserId());
    const isWinner = tournamentData.winner.id === currentUserId;

    // 토너먼트 결과 HTML 생성
    const resultHtml = this.generateTournamentResultHtml(tournamentData, isWinner);

    // 컨테이너를 결과 페이지로 교체
    this.container.innerHTML = resultHtml;

    // 홈으로 돌아가기 버튼 이벤트 리스너 추가
    const homeButton = this.container.querySelector(".home-button");
    homeButton?.addEventListener("click", async () => {
      try {
        // 로비 퇴장 API 호출
        await this.service.leaveLobby();
        console.log("🏆 토너먼트 완료 후 로비 퇴장 성공");

        if (window.router) {
          window.router.navigate("/lobby");
        }
      } catch (error) {
        console.error("❌ 토너먼트 완료 후 로비 퇴장 실패:", error);
        // 에러가 발생해도 홈으로 이동
        if (window.router) {
          window.router.navigate("/lobby");
        }
      }
    });
  }

  private generateTournamentResultHtml(tournamentData: any, isWinner: boolean): string {
    const { tournament, winner, total_rounds, round_results } = tournamentData;

    // 라운드별 결과 HTML 생성
    const roundResultsHtml = Object.entries(round_results)
      .map(([round, matches]: [string, any]) => {
        const matchesHtml = matches
          .map((match: any) => {
            // 플레이어 정보 안전하게 추출
            const playerOneName = match.player_one?.nickname || match.player_one?.username || "알 수 없음";
            const playerTwoName = match.player_two?.nickname || match.player_two?.username || "알 수 없음";
            const winnerName = match.winner_id === match.player_one?.id ? playerOneName : playerTwoName;

            return `
              <div class="match-result glass-card p-3 mb-2">
                <div class="flex justify-between items-center">
                  <span class="font-medium">${playerOneName} vs ${playerTwoName}</span>
                  <span class="text-sm">${match.score || "점수 없음"}</span>
                </div>
                <div class="text-sm text-gray-600 mt-1">
                  승자: ${winnerName}
                  | 플레이 시간: ${match.play_time || "시간 정보 없음"}
                </div>
              </div>
            `;
          })
          .join("");

        return `
          <div class="round-section mb-6">
            <h4 class="text-lg font-semibold text-primary-700 mb-3">라운드 ${round}</h4>
            ${matchesHtml}
          </div>
        `;
      })
      .join("");

    return `
      <div class="tournament-result-container min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
        <!-- 배경 플로팅 요소들 -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute top-20 left-20 w-20 h-20 bg-primary-300/30 rounded-full floating"></div>
          <div class="absolute top-40 right-40 w-16 h-16 bg-secondary-300/30 rounded-full floating" style="animation-delay: -2s"></div>
          <div class="absolute bottom-32 left-32 w-12 h-12 bg-neutral-300/30 rounded-full floating" style="animation-delay: -4s"></div>
          <div class="absolute bottom-20 right-20 w-24 h-24 bg-primary-200/20 rounded-full floating" style="animation-delay: -1s"></div>
        </div>

        <div class="max-w-4xl mx-auto relative z-10">
          <!-- 결과 헤더 -->
          <div class="text-center mb-8">
            <div class="glass-card p-8 mb-6">
              <h1 class="text-4xl font-bold text-primary-700 mb-4">
                🏆 토너먼트 완료!
              </h1>
              
              ${
                isWinner
                  ? `
                <div class="winner-announcement mb-4">
                  <h2 class="text-3xl font-bold text-yellow-600 mb-2">축하합니다! 🎉</h2>
                  <p class="text-xl text-primary-600">당신이 토너먼트 우승자입니다!</p>
                </div>
              `
                  : `
                <div class="participant-result mb-4">
                  <h2 class="text-2xl font-bold text-primary-600 mb-2">토너먼트 참가 완료</h2>
                  <p class="text-lg text-primary-600">수고하셨습니다!</p>
                </div>
              `
              }

              <div class="tournament-info grid md:grid-cols-3 gap-4 mt-6">
                <div class="stat-item text-center">
                  <div class="text-2xl font-bold text-primary-700">${winner?.nickname || winner?.username || "알 수 없음"}</div>
                  <div class="text-sm text-gray-600">우승자</div>
                </div>
                <div class="stat-item text-center">
                  <div class="text-2xl font-bold text-primary-700">${total_rounds || 0}</div>
                  <div class="text-sm text-gray-600">총 라운드</div>
                </div>
                <div class="stat-item text-center">
                  <div class="text-2xl font-bold text-primary-700">${tournament?.tournament_type || "일반"}</div>
                  <div class="text-sm text-gray-600">토너먼트 형식</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 라운드별 결과 -->
          <div class="rounds-container glass-card p-6 mb-6">
            <h3 class="text-2xl font-bold text-primary-700 mb-6">라운드별 결과</h3>
            ${roundResultsHtml}
          </div>

          <!-- 홈으로 돌아가기 버튼 -->
          <div class="text-center">
            <button class="home-button bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200">
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    `;
  }

  destroy(): void {
    // this.ui.clearEventHandlers(); // 핸들러 제거
    this.service.disconnect();
  }
}
