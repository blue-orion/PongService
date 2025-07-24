import { LobbyData, LobbyPlayer, SocketEventHandlers } from "../../../types/lobby";
import { AuthManager } from "../../../utils/auth";
import { UserManager } from "../../../utils/user";
import { PlayerRenderer } from "../renderers/PlayerRenderer";

export class SocketEventProcessor {
  private lobbyData: LobbyData | null = null;
  private onUIUpdate: (lobbyData: LobbyData) => void;
  private onDataRefresh: () => void;
  private onPlayGame?: () => void;
  private getParticipatedGame?: () => any;

  constructor(
    onUIUpdate: (lobbyData: LobbyData) => void,
    onDataRefresh: () => void,
    onPlayGame?: () => void,
    getParticipatedGame?: () => any
  ) {
    this.onUIUpdate = onUIUpdate;
    this.onDataRefresh = onDataRefresh;
    this.onPlayGame = onPlayGame;
    this.getParticipatedGame = getParticipatedGame;
  }

  setLobbyData(lobbyData: LobbyData | null): void {
    console.log("lobbyData: ", lobbyData);
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
  }

  // TODO: 게임 시작 시 사용자가 참여하는 게임에 대한 시작 이벤트만 처리하게 해야 함
  // 이벤트 발생 시 어떤 데이터가 넘어오는지 확인해야함
  handleGameStarted(data: any, retryCount: number = 0): void {
    console.log("🎮 게임 시작 이벤트 처리 시작:", data, `(재시도: ${retryCount})`);
    console.log("🔍 SocketEventProcessor의 lobbyData:", this.lobbyData);

    // matchData가 없으면 잠시 기다렸다가 다시 시도 (match:created 이벤트 대기)
    if (!this.lobbyData?.matchData) {
      if (retryCount < 10) {
        // 최대 10번 재시도 (1초)
        console.log(`⏳ matchData가 아직 없습니다. 100ms 후 다시 시도합니다... (${retryCount + 1}/10)`);
        setTimeout(() => {
          this.handleGameStarted(data, retryCount + 1);
        }, 100);
        return;
      } else {
        console.warn("❌ matchData를 찾을 수 없어서 게임 시작 처리를 중단합니다.");
        return;
      }
    }

    // SocketEventProcessor의 lobbyData로 직접 게임 참여 확인
    const participatedGame = this.findParticipatedGame();
    console.log("🔍 SocketEventProcessor에서 직접 찾은 참여 게임:", participatedGame);

    if (!participatedGame) {
      console.log("🚫 현재 사용자가 참여하는 게임이 없습니다. 라우팅을 건너뜁니다.");
      return;
    }

    // 이벤트로 받은 game_id와 사용자가 참여하는 게임의 game_id가 일치하는지 확인
    console.log("🔍 게임 ID 비교:", {
      participatedGameId: participatedGame.game_id,
      eventGameId: data.game_id,
      isMatch: participatedGame.game_id === data.game_id,
    });

    if (participatedGame.game_id !== data.game_id) {
      console.log("🚫 다른 게임의 시작 이벤트입니다. 라우팅을 건너뜁니다.");
      console.log(`참여 게임 ID: ${participatedGame.game_id}, 이벤트 게임 ID: ${data.game_id}`);
      return;
    }

    console.log("✅ 현재 사용자가 참여하는 게임입니다. 게임으로 이동합니다.");

    // 현재 로비 ID를 세션 스토리지에 저장 (게임 종료 후 돌아가기 위함)
    if (this.lobbyData?.id) {
      const lobbyIdToSave = this.lobbyData.id.toString();
      sessionStorage.setItem("lastLobbyId", lobbyIdToSave);
      console.log("💾 현재 로비 ID 저장:", lobbyIdToSave);

      // 저장된 값 즉시 확인
      const savedValue = sessionStorage.getItem("lastLobbyId");
      console.log("🔍 저장 후 바로 확인된 값:", savedValue);
    } else {
      console.warn("⚠️ lobbyData 또는 lobbyData.id가 없어서 lastLobbyId를 저장할 수 없습니다.");
      console.log("🔍 lobbyData:", this.lobbyData);
    }

    // 게임 시작 알림 모달 표시
    this.showGameStartCountdown(data);

    // 3초 후 playGame() 콜백을 통해 게임 라우트로 이동
    setTimeout(() => {
      console.log("🎯 playGame() 콜백을 통해 게임으로 이동");
      if (this.onPlayGame) {
        this.onPlayGame();
      } else {
        console.warn("❌ onPlayGame 콜백이 설정되지 않았습니다.");
      }
    }, 3000);
  }

  private findParticipatedGame(): any {
    console.log("🔍 SocketEventProcessor에서 참여 게임 직접 검색 시작");
    console.log("🔍 this.lobbyData 존재 여부:", !!this.lobbyData);
    console.log("🔍 this.lobbyData.matchData 존재 여부:", !!this.lobbyData?.matchData);

    // JSON.stringify로 실제 그 순간의 객체 상태 확인
    if (this.lobbyData) {
      console.log(
        "🔍 실제 lobbyData JSON:",
        JSON.stringify(
          {
            id: this.lobbyData.id,
            hasMatchData: !!this.lobbyData.matchData,
            matchDataKeys: this.lobbyData.matchData ? Object.keys(this.lobbyData.matchData) : [],
            matchDataType: typeof this.lobbyData.matchData,
            matchDataValue: this.lobbyData.matchData,
          },
          null,
          2
        )
      );
    }

    if (!this.lobbyData || !this.lobbyData.matchData) {
      console.warn("❌ SocketEventProcessor의 로비 데이터 혹은 매치가 생성되기 이전입니다.");
      console.warn("상세 정보:", {
        hasLobbyData: !!this.lobbyData,
        hasMatchData: !!this.lobbyData?.matchData,
        lobbyDataKeys: this.lobbyData ? Object.keys(this.lobbyData) : [],
        matchDataValue: this.lobbyData?.matchData,
      });
      return undefined;
    }

    const games = this.lobbyData.matchData.games;
    const userId = UserManager.getUserId();

    console.log("게임 시작 이벤트 발생 전 게임 정보 조회", games);

    const participatedGame = games?.find(
      (game) =>
        game.game_status !== "COMPLETED" &&
        ((game.player_one?.id === userId) || (game.player_two?.id === userId))
    );

    console.log("🔍 SocketEventProcessor 참여 게임 검색 결과:", {
      userId,
      totalGames: games?.length || 0,
      participatedGame: participatedGame
        ? {
            game_id: participatedGame.game_id,
            game_status: participatedGame.game_status,
            left_player: participatedGame.player_one,
            right_player: participatedGame.player_two,
          }
        : "없음",
    });

    return participatedGame;
  }

  private showGameStartCountdown(data: any): void {
    // 기존 카운트다운 모달이 있으면 제거
    const existingModal = document.querySelector(".game-start-countdown-modal");
    if (existingModal) {
      existingModal.remove();
    }

    // 카운트다운 모달 생성
    const modal = document.createElement("div");
    modal.className =
      "game-start-countdown-modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

    modal.innerHTML = `
      <div class="glass-card p-8 text-center max-w-md mx-4">
        <div class="mb-6">
          <h2 class="text-3xl font-bold text-primary-700 mb-2">🎮 게임 시작!</h2>
          <p class="text-lg text-gray-600">곧 게임으로 이동합니다</p>
        </div>
        
        <div class="countdown-circle mb-4">
          <div class="text-6xl font-bold text-primary-600 countdown-number">3</div>
        </div>
        
        <div class="text-sm text-gray-500">
          게임 ID: \${data.game_id || "알 수 없음"}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 카운트다운 애니메이션
    let count = 3;
    const countdownElement = modal.querySelector(".countdown-number");

    const countdownInterval = setInterval(() => {
      count--;
      if (countdownElement) {
        countdownElement.textContent = count.toString();

        // 카운트다운 애니메이션 효과
        countdownElement.classList.add("animate-pulse");
        setTimeout(() => {
          countdownElement.classList.remove("animate-pulse");
        }, 500);
      }

      if (count <= 0) {
        clearInterval(countdownInterval);
        modal.remove();
      }
    }, 1000);

    // 3초 후 모달 자동 제거 (안전장치)
    setTimeout(() => {
      if (modal.parentNode) {
        modal.remove();
      }
    }, 3000);
  }

  handleReadyStateChange(data: any): void {
    console.log("🔄 준비 상태 변경 처리 시작:", data);

    // 백엔드 DTO 호환성을 위한 players 배열 안전 접근
    const players = this.lobbyData?.players || this.lobbyData?.lobby_players || [];
    if (!this.lobbyData || players.length === 0) {
      console.warn("❌ 로비 데이터가 없어서 준비 상태 변경을 처리할 수 없습니다.");
      return;
    }

    const userId = data.user_id;
    const newReadyState = data.is_ready;
    const playerData = data.player;

    const playerIndex = players.findIndex((p: LobbyPlayer) => p.user_id === userId);
    if (playerIndex === -1) {
      console.warn(`❌ 플레이어 \${userId}를 찾을 수 없습니다. 부분 업데이트만 진행합니다.`);
      return;
    }

    // 준비 상태 업데이트 - 백엔드 DTO 호환성
    if (this.lobbyData.players && this.lobbyData.players.length > 0) {
      this.lobbyData.players[playerIndex].is_ready = newReadyState;

      // 플레이어 데이터가 있으면 전체 정보 업데이트
      if (playerData) {
        this.lobbyData.players[playerIndex] = {
          ...this.lobbyData.players[playerIndex],
          ...playerData,
          user: this.lobbyData.players[playerIndex].user,
        };
      }

      // 모든 플레이어 준비 상태 재계산
      this.lobbyData.allPlayersReady = PlayerRenderer.areAllPlayersReady(this.lobbyData.players);
    } else if (this.lobbyData.lobby_players && this.lobbyData.lobby_players.length > 0) {
      this.lobbyData.lobby_players[playerIndex].is_ready = newReadyState;

      // 플레이어 데이터가 있으면 전체 정보 업데이트
      if (playerData) {
        this.lobbyData.lobby_players[playerIndex] = {
          ...this.lobbyData.lobby_players[playerIndex],
          ...playerData,
          user: this.lobbyData.lobby_players[playerIndex].user,
        };
      }

      // 모든 플레이어 준비 상태 재계산
      this.lobbyData.allPlayersReady = PlayerRenderer.areAllPlayersReady(this.lobbyData.lobby_players);
    }

    // 현재 사용자의 준비 상태 업데이트
    const currentUserId = UserManager.getUserId();
    if (userId === currentUserId) {
      this.lobbyData.isPlayerReady = newReadyState;
    }

    console.log(`👤 플레이어 \${userId}의 준비 상태 변경: \${!newReadyState} → \${newReadyState}`);
    this.onUIUpdate(this.lobbyData);
  }

  handlePlayerChange(data: any): void {
    console.log("플레이어 변경 처리:", data);
    console.warn("⚠️ 플레이어 변경 이벤트는 현재 부분 업데이트로 처리되지 않습니다.");
  }

  handleLobbyUpdate(data: any): void {
    console.log("🎯 WebSocket에서 로비 업데이트 수신:", data);
    console.warn("⚠️ 로비 업데이트 이벤트는 현재 부분 업데이트로 처리되지 않습니다.");
  }

  handleLeadershipChange(data: any): void {
    console.log("🔄 방장 위임 처리 시작:", data);

    // 백엔드 DTO 호환성을 위한 players 배열 안전 접근
    const players = this.lobbyData?.players || this.lobbyData?.lobby_players || [];
    if (!this.lobbyData || players.length === 0) {
      console.warn("❌ 로비 데이터가 없어서 방장 위임을 처리할 수 없습니다.");
      return;
    }

    const newLeaderId = data.new_leader_id;
    const currentUserId = UserManager.getUserId();

    // 모든 플레이어의 리더 상태 업데이트
    players.forEach((player: LobbyPlayer) => {
      player.is_leader = player.user_id === newLeaderId;
    });

    // 새로운 호스트 정보 업데이트
    const newLeader = PlayerRenderer.findPlayerById(players, newLeaderId);
    if (newLeader) {
      this.lobbyData.host = PlayerRenderer.getPlayerDisplayName(newLeader);
      // 백엔드 DTO 호환성을 위한 creatorId 필드 업데이트
      this.lobbyData.creatorId = newLeaderId;
      this.lobbyData.creator_id = newLeaderId;
      this.lobbyData.isHost = currentUserId === newLeaderId;
    }

    console.log(`🏆 호스트 정보 업데이트: ${this.lobbyData.host} (현재사용자가 호스트: ${this.lobbyData.isHost})`);
    this.onUIUpdate(this.lobbyData);

    // 방장 변경 알림
    this.showLeadershipChangeAlert(newLeaderId, currentUserId, newLeader);
  }

  handleHostTransferred(data: any): void {
    console.log("🔄 호스트 자동 이전 처리 시작:", data);

    // 백엔드 DTO 호환성을 위한 players 배열 안전 접근
    const players = this.lobbyData?.players || this.lobbyData?.lobby_players || [];
    if (!this.lobbyData || players.length === 0) {
      console.warn("❌ 로비 데이터가 없어서 호스트 이전을 처리할 수 없습니다.");
      return;
    }

    const newHostId = data.new_host_id;
    const oldHostId = data.old_host_id;
    const reason = data.reason || "UNKNOWN";
    const currentUserId = UserManager.getUserId();

    console.log(`🔄 호스트 이전: ${oldHostId} → ${newHostId} (이유: ${reason})`);

    // 로비 데이터가 함께 전송된 경우 전체 업데이트
    if (data.lobby) {
      console.log("📦 전체 로비 데이터 업데이트");
      this.updateLobbyDataFromSocket(data.lobby);
    } else {
      // 부분 업데이트: 모든 플레이어의 리더 상태 변경
      players.forEach((player: LobbyPlayer) => {
        player.is_leader = player.user_id === newHostId;
      });

      // 새로운 호스트 정보 업데이트
      const newHost = PlayerRenderer.findPlayerById(players, newHostId);
      if (newHost) {
        this.lobbyData.host = PlayerRenderer.getPlayerDisplayName(newHost);
        // 백엔드 DTO 호환성을 위한 creatorId 필드 업데이트
        this.lobbyData.creatorId = newHostId;
        this.lobbyData.creator_id = newHostId;
        this.lobbyData.isHost = currentUserId === newHostId;
      }
    }

    console.log(`🏆 호스트 이전 완료: ${this.lobbyData.host} (현재사용자가 호스트: ${this.lobbyData.isHost})`);
    this.onUIUpdate(this.lobbyData);

    // 호스트 이전 알림
    const oldHost = oldHostId ? PlayerRenderer.findPlayerById(players, oldHostId) : null;
    const newHost = PlayerRenderer.findPlayerById(players, newHostId);
    
    const oldHostName = oldHost ? PlayerRenderer.getPlayerDisplayName(oldHost) : `사용자 ${oldHostId}`;
    const newHostName = newHost ? PlayerRenderer.getPlayerDisplayName(newHost) : `사용자 ${newHostId}`;

    if (reason === "HOST_LEFT") {
      if (newHostId === currentUserId) {
        console.log(`🏆 ${oldHostName}님이 나가서 당신이 새로운 호스트가 되었습니다!`);
      } else {
        console.log(`🔄 ${oldHostName}님이 나가서 ${newHostName}님이 새로운 호스트가 되었습니다.`);
      }
    } else {
      if (newHostId === currentUserId) {
        console.log(`🏆 축하합니다! 당신이 새로운 호스트가 되었습니다.`);
      } else {
        console.log(`🔄 ${newHostName}님이 새로운 호스트가 되었습니다.`);
      }
    }
  }

  handlePlayerLeft(data: any): void {
    console.log("🔄 플레이어 퇴장 처리 시작:", data);

    // 백엔드 DTO 호환성을 위한 players 배열 안전 접근
    const players = this.lobbyData?.players || this.lobbyData?.lobby_players || [];
    if (!this.lobbyData || players.length === 0) {
      console.warn("❌ 로비 데이터가 없어서 플레이어 퇴장을 처리할 수 없습니다.");
      return;
    }

    const leftUserId = data.user_id;
    const currentUserId = UserManager.getUserId();

    // 현재 사용자가 퇴장한 경우
    if (leftUserId === currentUserId) {
      console.log("🚪 현재 사용자가 로비에서 퇴장함");
      alert("로비에서 퇴장했습니다.");
      if (window.router) {
        window.router.navigate("/");
      }
      return;
    }

    // 다른 플레이어 퇴장 처리
    this.processPlayerLeft(leftUserId, data);
  }

  handlePlayerJoined(data: any): void {
    console.log("🔄 플레이어 입장 처리 시작:", data);
    console.log("🔍 받은 데이터 상세 분석:", {
      dataKeys: Object.keys(data),
      user_id: data.user_id,
      hasLobby: !!data.lobby,
      lobbyKeys: data.lobby ? Object.keys(data.lobby) : [],
      lobbyData: data.lobby,
    });

    // 백엔드 DTO 호환성을 위한 players 배열 안전 접근
    const players = this.lobbyData?.players || this.lobbyData?.lobby_players || [];
    if (!this.lobbyData || players.length === 0) {
      console.warn("❌ 로비 데이터가 없어서 플레이어 입장을 처리할 수 없습니다.");
      return;
    }

    const joinedUserId = data.user_id;
    const currentUserId = UserManager.getUserId();
    const lobbyInfo = data.lobby;

    console.log("🔍 현재 로비 플레이어 목록:", {
      currentPlayers: players.map((p) => ({ user_id: p.user_id, enabled: p.enabled })),
      joinedUserId,
      currentUserId,
    });

    // 기존 플레이어인지 신규 플레이어인지 확인
    const existingPlayerIndex = players.findIndex((p: LobbyPlayer) => p.user_id === joinedUserId);

    if (existingPlayerIndex !== -1) {
      console.log("🔄 기존 플레이어의 재입장입니다.");
      // 기존 플레이어의 enabled 상태 변경
      players[existingPlayerIndex].enabled = true;
      if (lobbyInfo) {
        this.updateLobbyDataFromSocket(lobbyInfo);
      }
    } else {
      // 신규 플레이어 추가
      console.log(`👤 신규 플레이어 \${joinedUserId}가 로비에 입장함`);
      console.log("🔍 현재 this.lobbyData:", this.lobbyData);
      this.processNewPlayerJoined(joinedUserId, lobbyInfo);
      return;
    }

    this.updatePlayerCounts();
    this.onUIUpdate(this.lobbyData);

    // 입장 알림 (현재 사용자가 아닌 경우)
    if (joinedUserId !== currentUserId) {
      const joinedPlayer = PlayerRenderer.findPlayerById(players, joinedUserId);
      if (joinedPlayer) {
        const playerName = PlayerRenderer.getPlayerDisplayName(joinedPlayer);
        console.log(`📢 플레이어 입장 알림: \${playerName}님이 로비에 입장했습니다.`);
      }
    }
  }

  handleMatchCreated(data: any): void {
    console.log("🔄 매칭 생성 이벤트 처리 시작:", data);

    if (!this.lobbyData) {
      console.warn("❌ 로비 데이터가 없어서 매칭 생성을 처리할 수 없습니다.");
      return;
    }

    // 로비 데이터에 매칭 정보 저장
    this.lobbyData.matchData = data;

    console.log("📊 매칭 생성 정보:", {
      tournament_id: data.tournament_id,
      round: data.games[0].round,
      total_matches: data.total_matches,
      hasMatches: !!data.matches,
      isCompleted: !!data.message,
    });

    this.onUIUpdate(this.lobbyData);
  }

  // 새로운 백엔드 이벤트 핸들러들
  handleGameCompleted(data: any): void {
    console.log("🎮 게임 완료 이벤트 처리:", data);
    
    if (!this.lobbyData) {
      console.warn("❌ 로비 데이터가 없어서 게임 완료를 처리할 수 없습니다.");
      return;
    }

    // 매치 데이터 업데이트 필요 시 처리
    if (this.lobbyData.matchData && this.lobbyData.matchData.matches) {
      const gameId = data.game_id;
      const matchIndex = this.lobbyData.matchData.matches.findIndex(match => match.game_id === gameId);
      
      if (matchIndex !== -1) {
        this.lobbyData.matchData.matches[matchIndex].game_status = "COMPLETED";
        this.lobbyData.matchData.matches[matchIndex].winner = { 
          id: data.winner_id, 
          nickname: "Winner"
        };
        console.log(`✅ 게임 ${gameId} 상태를 COMPLETED로 업데이트`);
      }
    }

    // 토너먼트 상태 업데이트
    if (this.lobbyData.matchData) {
      this.lobbyData.matchData.tournament_status = data.tournament_status;
      this.lobbyData.matchData.current_round = data.current_round;
    }

    this.onUIUpdate(this.lobbyData);
    
    // 사용자에게 게임 완료 알림
    console.log(`🎉 게임이 완료되었습니다. 승자: ${data.winner_id}`);
  }

  handleTournamentCompleted(data: any): void {
    console.log("🏆 토너먼트 완료 이벤트 처리:", data);
    
    if (!this.lobbyData) {
      console.warn("❌ 로비 데이터가 없어서 토너먼트 완료를 처리할 수 없습니다.");
      return;
    }

    // 토너먼트 완료 상태 업데이트
    if (this.lobbyData.matchData) {
      this.lobbyData.matchData.tournament_status = "COMPLETED";
      this.lobbyData.matchData.winner = { 
        id: data.winner_id, 
        nickname: "Tournament Winner", 
        username: "winner" 
      };
    }

    this.onUIUpdate(this.lobbyData);

    // 토너먼트 완료 알림
    console.log(`🏆 토너먼트가 완료되었습니다! 우승자: ${data.winner_id}`);
    
    // 토너먼트 완료 시 자동으로 결과 페이지로 이동하거나 알림 표시
    setTimeout(() => {
      if (this.onDataRefresh) {
        this.onDataRefresh(); // 완료된 토너먼트 정보 새로고침
      }
    }, 1000);
  }

  handlePlayerRemoved(data: any): void {
    console.log("💀 플레이어 제거 이벤트 처리:", data);
    
    if (!this.lobbyData) {
      console.warn("❌ 로비 데이터가 없어서 플레이어 제거를 처리할 수 없습니다.");
      return;
    }

    const removedUserId = data.removed_user_id;
    const currentUserId = UserManager.getUserId();
    
    // 현재 사용자가 제거된 경우
    if (removedUserId === currentUserId) {
      console.log("💀 현재 사용자가 로비에서 제거되었습니다.");
      alert(`로비에서 제거되었습니다. 사유: ${data.reason}`);
      
      // 홈으로 이동
      if (window.router) {
        window.router.navigate("/lobby");
      }
      return;
    }

    // 다른 플레이어가 제거된 경우
    const players = this.lobbyData.players || this.lobbyData.lobby_players || [];
    const removedPlayerIndex = players.findIndex((p: LobbyPlayer) => p.user_id === removedUserId);
    
    if (removedPlayerIndex !== -1) {
      const removedPlayer = players[removedPlayerIndex];
      const playerName = PlayerRenderer.getPlayerDisplayName(removedPlayer);
      
      console.log(`💀 플레이어 ${playerName}(${removedUserId})가 제거됨`);
      
      // 플레이어 목록에서 제거
      if (this.lobbyData.players) {
        this.lobbyData.players.splice(removedPlayerIndex, 1);
      }
      if (this.lobbyData.lobby_players) {
        this.lobbyData.lobby_players.splice(removedPlayerIndex, 1);
      }
      
      this.updatePlayerCounts();
      this.onUIUpdate(this.lobbyData);
      
      // 제거 알림
      console.log(`📢 ${playerName}님이 로비에서 제거되었습니다. 사유: ${data.reason}`);
    }
  }

  // 이벤트 핸들러 팩토리 메소드 - LobbyDetailComponent에서 사용
  getEventHandlers(): SocketEventHandlers {
    return {
      onReadyStateChange: (data) => this.handleReadyStateChange(data),
      onPlayerChange: (data) => this.handlePlayerChange(data),
      onLobbyUpdate: (data) => this.handleLobbyUpdate(data),
      onLeadershipChange: (data) => this.handleLeadershipChange(data),
      onHostTransferred: (data) => this.handleHostTransferred(data),
      onPlayerLeft: (data) => this.handlePlayerLeft(data),
      onPlayerJoined: (data) => this.handlePlayerJoined(data),
      onMatchCreated: (data) => this.handleMatchCreated(data),
      onConnectionStatusChange: (isConnected, transport) => {
        // 연결 상태 변경 처리는 LobbyDetailComponent에서 직접 처리
        console.log(`🔌 연결 상태 변경: ${isConnected} (${transport})`);
      },
      onGameStarted: (data) => this.handleGameStarted(data),
      onGameCompleted: (data) => this.handleGameCompleted(data),
      onTournamentCompleted: (data) => this.handleTournamentCompleted(data),
      onPlayerRemoved: (data) => this.handlePlayerRemoved(data),
    };
  }

  // 누락된 private 메소드들

  private showLeadershipChangeAlert(newLeaderId: number, currentUserId: number | null, newLeader: LobbyPlayer | undefined): void {
    const playerName = newLeader ? PlayerRenderer.getPlayerDisplayName(newLeader) : `사용자 ${newLeaderId}`;
    
    if (newLeaderId === currentUserId) {
      console.log(`🏆 축하합니다! 당신이 새로운 방장이 되었습니다.`);
    } else {
      console.log(`🔄 ${playerName}님이 새로운 방장이 되었습니다.`);
    }
  }

  private processPlayerLeft(leftUserId: number, data: any): void {
    const players = this.lobbyData?.players || this.lobbyData?.lobby_players || [];
    const leftPlayerIndex = players.findIndex((p: LobbyPlayer) => p.user_id === leftUserId);

    if (leftPlayerIndex === -1) {
      console.warn(`❌ 퇴장한 플레이어 ${leftUserId}를 찾을 수 없습니다.`);
      return;
    }

    const leftPlayer = players[leftPlayerIndex];
    const playerName = PlayerRenderer.getPlayerDisplayName(leftPlayer);

    // 플레이어를 목록에서 제거거나 비활성화
    if (this.lobbyData) {
      if (this.lobbyData.players) {
        this.lobbyData.players.splice(leftPlayerIndex, 1);
      }
      if (this.lobbyData.lobby_players) {
        this.lobbyData.lobby_players.splice(leftPlayerIndex, 1);
      }
    }

    this.updatePlayerCounts();
    this.onUIUpdate(this.lobbyData!);

    console.log(`👋 ${playerName}님이 로비에서 퇴장했습니다.`);
  }

  private updateLobbyDataFromSocket(lobbyInfo: any): void {
    if (!this.lobbyData || !lobbyInfo) return;

    // 백엔드 DTO 호환성을 위한 로비 정보 업데이트
    Object.keys(lobbyInfo).forEach(key => {
      if (key in this.lobbyData!) {
        (this.lobbyData as any)[key] = lobbyInfo[key];
      }
    });

    console.log("🔄 소켓에서 받은 로비 정보로 업데이트 완료");
  }

  private processNewPlayerJoined(joinedUserId: number, lobbyInfo: any): void {
    if (!this.lobbyData) return;

    // 새로운 플레이어 정보가 lobbyInfo에 포함되어 있으면 전체 플레이어 목록 업데이트
    if (lobbyInfo && (lobbyInfo.players || lobbyInfo.lobby_players)) {
      const newPlayers = lobbyInfo.players || lobbyInfo.lobby_players;
      
      if (this.lobbyData.players) {
        this.lobbyData.players = newPlayers;
      }
      if (this.lobbyData.lobby_players) {
        this.lobbyData.lobby_players = newPlayers;
      }
      
      console.log(`👤 신규 플레이어 ${joinedUserId} 추가 및 전체 플레이어 목록 업데이트`);
    } else {
      console.warn("⚠️ 새로운 플레이어 정보를 lobbyInfo에서 찾을 수 없습니다. 전체 데이터 새로고침이 필요할 수 있습니다.");
      // 전체 데이터 새로고침 요청
      this.onDataRefresh();
      return;
    }

    this.updatePlayerCounts();
    this.onUIUpdate(this.lobbyData);
  }

  private updatePlayerCounts(): void {
    if (!this.lobbyData) return;

    const players = this.lobbyData.players || this.lobbyData.lobby_players || [];
    const activePlayers = players.filter((p: LobbyPlayer) => p.enabled !== false);

    // 백엔드 DTO 호환성을 위한 플레이어 수 업데이트
    this.lobbyData.currentPlayers = activePlayers.length;

    // 최대 플레이어 수 필드도 호환성 확인
    const maxPlayers = this.lobbyData.maxPlayers || this.lobbyData.max_player || 8;
    this.lobbyData.maxPlayers = maxPlayers;
    this.lobbyData.max_player = maxPlayers;

    console.log(`📊 플레이어 수 업데이트: ${activePlayers.length}/${maxPlayers}`);
  }
}
