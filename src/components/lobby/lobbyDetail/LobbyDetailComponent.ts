import { Component } from "../../Component";
import { MatchInfo } from "../../../types/lobby";
import { UserManager } from "../../../utils/user";
import { LobbyDetailService } from "./LobbyDetailService";
import { LobbyDetailUI } from "./LobbyDetailUI";
import { SocketEventProcessor } from "../managers/SocketEventProcessor";
import { LobbyData, SocketEventHandlers, UIEventHandlers } from "../../../types/lobby";
import { LobbyChatComponent } from "../chattingRoom/LobbyChatComponent";

export class LobbyDetailComponent extends Component {
  private lobbyId: string;
  private lobbyData: LobbyData | null = null;
  private isLoading: boolean = false;
  private service: LobbyDetailService;
  private ui: LobbyDetailUI;
  private socketProcessor: SocketEventProcessor;
  private chatComponent: LobbyChatComponent | null = null;

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

    // 채팅 컴포넌트 초기화
    this.initializeChat();

    console.log("로비 상세 컴포넌트 렌더링 완료");
  }

  private initializeChat(): void {
    // 채팅 컨테이너가 UI에 있는지 확인
    const chatContainer = this.container.querySelector("#chat-container");

    if (chatContainer && !this.chatComponent) {
      this.chatComponent = new LobbyChatComponent(chatContainer as HTMLElement, this.lobbyId);
      console.log("💬 채팅 컴포넌트 초기화 완료");
    }
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
    // SocketEventProcessor의 새로운 getEventHandlers() 메소드 사용
    const socketHandlers: SocketEventHandlers = {
      ...this.socketProcessor.getEventHandlers(),
      // 연결 상태 변경은 LobbyDetailComponent에서 직접 처리
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
      // lobbyData와 matchData가 모두 존재하는 경우에만 처리
      if (this.lobbyData && this.lobbyData.matchData) {
        if (this.lobbyData.matchData.games) {
          // games 필드가 존재하면 matches를 games로 설정
          this.lobbyData.matchData.games = this.lobbyData.matchData.games || [];
          this.lobbyData.matchData.matches = this.lobbyData.matchData.games || [];
        } else if (this.lobbyData.matchData.matches) {
          // games 필드가 없으면 matches를 games로 설정
          this.lobbyData.matchData.games = this.lobbyData.matchData.matches || [];
          this.lobbyData.matchData.matches = this.lobbyData.matchData.matches || [];
        }
      }
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

      this.initializeChat();
    } catch (error) {
      console.error("로비 데이터 로드 실패:", error);
      this.ui.showErrorState(error instanceof Error ? error.message : "로비 정보를 불러오는데 실패했습니다.");
    } finally {
      this.isLoading = false;
    }
  }

  private handleUIUpdate(lobbyData: LobbyData): void {
    this.lobbyData = lobbyData;

    // lobbyData와 matchData가 모두 존재하는 경우에만 처리
    if (lobbyData && lobbyData.matchData && this.lobbyData && this.lobbyData.matchData) {
      if (lobbyData.matchData.games) {
        // games 필드가 존재하면 matches를 games로 설정
        this.lobbyData.matchData.games = lobbyData.matchData.games || [];
        this.lobbyData.matchData.matches = lobbyData.matchData.games || [];
      } else if (lobbyData.matchData.matches) {
        // games 필드가 없으면 matches를 games로 설정
        this.lobbyData.matchData.games = lobbyData.matchData.matches || [];
        this.lobbyData.matchData.matches = lobbyData.matchData.matches || [];
      }
    }
    this.socketProcessor.setLobbyData(this.lobbyData); // 최신 로비 데이터 동기화
    this.ui.updatePlayersUI(lobbyData);
    this.ui.updateActionButtonsUI(lobbyData);

    // 매칭 정보가 변경된 경우 렌더링
    this.ui.renderMatchInfoInLobby(lobbyData);

    // 채팅 컴포넌트가 사라진 경우 재초기화
    this.initializeChat();
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

      // 낙관적 업데이트 - 백엔드 DTO 호환성
      const currentUserId = Number(UserManager.getUserId());
      if (currentUserId) {
        // 백엔드 DTO 호환성을 위한 players 배열 안전 접근
        const players = this.lobbyData.players || this.lobbyData.lobby_players || [];
        const currentPlayerIndex = players.findIndex((p: any) => p.user_id === Number(currentUserId));
        
        if (currentPlayerIndex !== -1) {
          const originalReadyState = this.lobbyData.isPlayerReady;
          const newReadyState = !this.lobbyData.isPlayerReady;

          // 백엔드 DTO 호환성 - players와 lobby_players 모두 업데이트
          if (this.lobbyData.players && this.lobbyData.players.length > 0) {
            this.lobbyData.players[currentPlayerIndex].is_ready = newReadyState;
            this.lobbyData.allPlayersReady =
              this.lobbyData.players.length > 0 && this.lobbyData.players.every((p: any) => p.is_ready);
          } else if (this.lobbyData.lobby_players && this.lobbyData.lobby_players.length > 0) {
            this.lobbyData.lobby_players[currentPlayerIndex].is_ready = newReadyState;
            this.lobbyData.allPlayersReady =
              this.lobbyData.lobby_players.length > 0 && this.lobbyData.lobby_players.every((p: any) => p.is_ready);
          }
          
          this.lobbyData.isPlayerReady = newReadyState;

          this.ui.updatePlayersUI(this.lobbyData);
          this.ui.updateActionButtonsUI(this.lobbyData);

          try {
            await this.service.toggleReady();
          } catch (error) {
            // API 실패 시 원래 상태로 되돌리기
            console.error("❌ 준비 상태 API 실패 - 원래 상태로 롤백");
            
            if (this.lobbyData.players && this.lobbyData.players.length > 0) {
              this.lobbyData.players[currentPlayerIndex].is_ready = originalReadyState || false;
              this.lobbyData.allPlayersReady =
                this.lobbyData.players.length > 0 && this.lobbyData.players.every((p: any) => p.is_ready);
            } else if (this.lobbyData.lobby_players && this.lobbyData.lobby_players.length > 0) {
              this.lobbyData.lobby_players[currentPlayerIndex].is_ready = originalReadyState || false;
              this.lobbyData.allPlayersReady =
                this.lobbyData.lobby_players.length > 0 && this.lobbyData.lobby_players.every((p: any) => p.is_ready);
            }
            
            this.lobbyData.isPlayerReady = originalReadyState || false;

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

    // 게임 시작 시 로비 ID를 백업으로 저장
    if (this.lobbyData?.id) {
      const lobbyIdToSave = this.lobbyData.id.toString();
      sessionStorage.setItem("lastLobbyId", lobbyIdToSave);
      console.log("🔄 백업 - 게임 시작 시 로비 ID 저장:", lobbyIdToSave);
    }

    const game = this.getParticipatedGameId();
    if (!game) {
      console.warn("매칭된 게임이 없습니다.");
      return;
    }
    if (window.router) {
      // 백엔드 DTO 호환성을 위해 tournament_id와 tournamentId 모두 확인
      const tournamentId = this.lobbyData?.tournament_id || this.lobbyData?.tournamentId;
      window.router.navigate(`/game/${game?.game_id}/${tournamentId}`, false);
    }
  }

  public getParticipatedGameId(): any | undefined {
    console.log("🔍 getParticipatedGameId 호출 시작");
    console.log("로비 데이터:", this.lobbyData);

    if (!this.lobbyData || !this.lobbyData.matchData) {
      console.warn("로비 데이터 혹은 매치가 생성되기 이전입니다.");
      return undefined;
    }
    // games필드도 있는데 LobbyDetailService의 matches에 저장되어 있음
    const matches = this.lobbyData?.matchData?.matches || this.lobbyData?.matchData?.games;
    const userId = UserManager.getUserId();

    const participatedMatch = matches?.find(
      (game) => {
        // 게임 상태가 완료되지 않았고, 현재 사용자가 참여한 게임인지 확인
        // game.left_player와 game.right_player는 각각 왼쪽과 오른쪽 플레이어 정보를 포함
        // userId는 현재 로그인한 사용자의 ID
        console.log(game, userId, game.left_player, game.right_player);
        return (
          game.game_status !== "COMPLETED" && 
          ((game.left_player?.id === userId) || (game.player_one?.id === userId) || 
          (game.right_player?.id === userId) || (game.player_two?.id === userId))
        );
      }
    );


    console.log("🔍 참여 게임 검색 결과:", {
      userId,
      totalMatches: matches?.length || 0,
      participatedMatch: participatedMatch
        ? {
            game_id: participatedMatch.game_id,
            game_status: participatedMatch.game_status,
            left_player: participatedMatch.player_one,
            right_player: participatedMatch.player_two,
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

    // 토너먼트 브라켓 생성을 위해 매치 데이터 변환
    const tournamentBracketHtml = this.generateTournamentBracketHtml(round_results, total_rounds);

    return `
      <div class="tournament-result-container min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 p-6">
        <!-- 배경 플로팅 요소들 -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute top-20 left-20 w-20 h-20 bg-primary-300/30 rounded-full floating"></div>
          <div class="absolute top-40 right-40 w-16 h-16 bg-secondary-300/30 rounded-full floating" style="animation-delay: -2s"></div>
          <div class="absolute bottom-32 left-32 w-12 h-12 bg-neutral-300/30 rounded-full floating" style="animation-delay: -4s"></div>
          <div class="absolute bottom-20 right-20 w-24 h-24 bg-primary-200/20 rounded-full floating" style="animation-delay: -1s"></div>
        </div>

        <div class="max-w-6xl mx-auto relative z-10">
          <!-- 결과 헤더 -->
          <div class="text-center mb-8">
            <div class="glass-card p-8 mb-6">
              <h1 class="text-4xl font-bold text-primary-700 mb-4">
                🏆 토너먼트 브라켓
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
                  <div class="text-2xl font-bold text-primary-700">${
                    winner?.nickname || winner?.username || "알 수 없음"
                  }</div>
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

          <!-- 토너먼트 브라켓 -->
          <div class="tournament-bracket-container-result glass-card p-6 mb-6">
            ${tournamentBracketHtml}
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

  private generateTournamentBracketHtml(roundResults: any, totalRounds: number): string {
    let bracketHTML = '<div class="tournament-bracket-container-final">';

    // 각 라운드별로 처리
    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = roundResults[round] || [];
      const nextRoundMatches = roundResults[round + 1] || [];
      const roundName = this.getRoundName(round, totalRounds);

      bracketHTML += `
        <div class="bracket-round-wrapper-final" data-round="${round}">
          <div class="bracket-round-column-final">
            <div class="round-label-final">${roundName}</div>
            <div class="round-matches-container-final">
              ${roundMatches.map((match: any, index: number) => this.renderFinalTournamentMatch(match, round, index)).join("")}
            </div>
          </div>
      `;

      // 다음 라운드가 있으면 연결선 추가
      if (round < totalRounds) {
        bracketHTML += this.renderFinalRoundConnectors(roundMatches, nextRoundMatches, round);
      }

      bracketHTML += "</div>";
    }

    bracketHTML += "</div>";
    return bracketHTML;
  }

  private getRoundName(round: number, totalRounds: number): string {
    if (round === totalRounds) return "결승";
    if (round === totalRounds - 1) return "준결승";
    if (round === totalRounds - 2) return "8강";
    if (round === totalRounds - 3) return "16강";
    return `${round}라운드`;
  }

  private renderFinalTournamentMatch(match: any, round: number, index: number): string {
    const playerOneName = match.player_one?.nickname || match.player_one?.username || "알 수 없음";
    const playerTwoName = match.player_two?.nickname || match.player_two?.username || "알 수 없음";
    const winnerName = match.winner_id === match.player_one?.id ? playerOneName : playerTwoName;
    const isPlayerOneWinner = match.winner_id === match.player_one?.id;
    const isPlayerTwoWinner = match.winner_id === match.player_two?.id;

    // 점수 정보 처리 - 다양한 필드명 확인
    console.log(match);
    
    let playerOneScore = 0;
    let playerTwoScore = 0;
    
    // match.score가 "2-10" 형태의 문자열인 경우 파싱
    if (typeof match.score === 'string' && match.score.includes('-')) {
      const scoreParts = match.score.split('-');
      if (scoreParts.length === 2) {
        playerOneScore = parseInt(scoreParts[0]) || 0;
        playerTwoScore = parseInt(scoreParts[1]) || 0;
      }
    } else {
      // 기존 방식으로 점수 확인
      playerOneScore = match.player_one_score || match.score?.left || match.left_score || 0;
      playerTwoScore = match.player_two_score || match.score?.right || match.right_score || 0;
    }

    return `
      <div class="tournament-match-final completed" data-game-id="${match.game_id}" data-round="${round}" data-index="${index}">
        <div class="match-bracket-final">
          <div class="match-player-final top-player ${isPlayerOneWinner ? "winner" : ""}">
            <div class="player-info-final">
              ${
                match.player_one?.profile_image
                  ? `<img src="${match.player_one.profile_image}" alt="프로필" class="player-avatar-small-final">`
                  : `<div class="player-avatar-placeholder-small-final">👤</div>`
              }
              <span class="player-name-final">${playerOneName}</span>
            </div>
            <div class="player-score-final">
              ${playerOneScore}
            </div>
          </div>
          
          <div class="match-connector-final">
            <div class="connector-line-final"></div>
            <div class="match-status-indicator-final completed">✓</div>
          </div>
          
          <div class="match-player-final bottom-player ${isPlayerTwoWinner ? "winner" : ""}">
            <div class="player-info-final">
              ${
                match.player_two?.profile_image
                  ? `<img src="${match.player_two.profile_image}" alt="프로필" class="player-avatar-small-final">`
                  : `<div class="player-avatar-placeholder-small-final">👤</div>`
              }
              <span class="player-name-final">${playerTwoName}</span>
            </div>
            <div class="player-score-final">
              ${playerTwoScore}
            </div>
          </div>
        </div>
        
        <div class="match-info-tooltip-final">
          <div class="match-winner-final">승자: ${winnerName}</div>
          <div class="match-score-final">${playerOneScore} - ${playerTwoScore}</div>
          <div class="match-time-final">${match.play_time || "시간 정보 없음"}</div>
        </div>
      </div>
    `;
  }

  private renderFinalRoundConnectors(currentRoundMatches: any[], nextRoundMatches: any[], round: number): string {
    // 연결선 제거 - 빈 문자열 반환
    return "";
  }

  destroy(): void {
    // 채팅 컴포넌트 정리
    if (this.chatComponent) {
      this.chatComponent.destroy();
      this.chatComponent = null;
      console.log("💬 채팅 컴포넌트 정리 완료");
    }

    // this.ui.clearEventHandlers(); // 핸들러 제거
    this.service.disconnect();
  }
}
