import { LobbyData, LobbyPlayer, SocketEventHandlers } from "../../../types/lobby";
import { AuthManager } from "../../../utils/auth";
import { UserManager } from "../../../utils/user";
import { PlayerRenderer } from "../renderers/PlayerRenderer";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
  }

  // TODO: 게임 시작 시 사용자가 참여하는 게임에 대한 시작 이벤트만 처리하게 해야 함
  // 이벤트 발생 시 어떤 데이터가 넘어오는지 확인해야함
  handleGameStarted(data: any, retryCount: number = 0) {
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
      sessionStorage.setItem("lastLobbyId", this.lobbyData.id.toString());
      console.log("💾 현재 로비 ID 저장:", this.lobbyData.id);
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

    const matches = this.lobbyData.matchData.matches;
    const userId = UserManager.getUserId();

    console.log("🔍 SocketEventProcessor 매치 검색 조건:", {
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

    console.log("🔍 SocketEventProcessor 참여 게임 검색 결과:", {
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
          게임 ID: ${data.game_id || "알 수 없음"}
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

    if (!this.lobbyData?.players) {
      console.warn("❌ 로비 데이터가 없어서 준비 상태 변경을 처리할 수 없습니다.");
      return;
    }

    const userId = data.user_id;
    const newReadyState = data.is_ready;
    const playerData = data.player;

    const playerIndex = this.lobbyData.players.findIndex((p: LobbyPlayer) => p.user_id === userId);
    if (playerIndex === -1) {
      console.warn(`❌ 플레이어 ${userId}를 찾을 수 없습니다.`);
      this.onDataRefresh();
      return;
    }

    // 준비 상태 업데이트
    this.lobbyData.players[playerIndex].is_ready = newReadyState;

    // 플레이어 데이터가 있으면 전체 정보 업데이트
    if (playerData) {
      this.lobbyData.players[playerIndex] = {
        ...this.lobbyData.players[playerIndex],
        ...playerData,
        user: this.lobbyData.players[playerIndex].user,
      };
    }

    // 현재 사용자의 준비 상태 업데이트
    const currentUserId = UserManager.getUserId();
    if (userId === currentUserId) {
      this.lobbyData.isPlayerReady = newReadyState;
    }

    // 모든 플레이어 준비 상태 재계산
    this.lobbyData.allPlayersReady = PlayerRenderer.areAllPlayersReady(this.lobbyData.players);

    console.log(`👤 플레이어 ${userId}의 준비 상태 변경: ${!newReadyState} → ${newReadyState}`);
    this.onUIUpdate(this.lobbyData);
  }

  handlePlayerChange(data: any): void {
    console.log("플레이어 변경 처리:", data);
    this.onDataRefresh();
  }

  handleLobbyUpdate(data: any): void {
    console.log("🎯 WebSocket에서 로비 업데이트 수신:", data);
    this.onDataRefresh();
  }

  handleLeadershipChange(data: any): void {
    console.log("🔄 방장 위임 처리 시작:", data);

    if (!this.lobbyData?.players) {
      console.warn("❌ 로비 데이터가 없어서 방장 위임을 처리할 수 없습니다.");
      return;
    }

    const newLeaderId = data.new_leader_id;
    const currentUserId = UserManager.getUserId();

    // 모든 플레이어의 리더 상태 업데이트
    this.lobbyData.players.forEach((player: LobbyPlayer) => {
      player.is_leader = player.user_id === newLeaderId;
    });

    // 새로운 호스트 정보 업데이트
    const newLeader = PlayerRenderer.findPlayerById(this.lobbyData.players, newLeaderId);
    if (newLeader) {
      this.lobbyData.host = PlayerRenderer.getPlayerDisplayName(newLeader);
      this.lobbyData.creatorId = newLeaderId;
      this.lobbyData.isHost = currentUserId === newLeaderId;
    }

    console.log(`🏆 호스트 정보 업데이트: ${this.lobbyData.host} (현재사용자가 호스트: ${this.lobbyData.isHost})`);
    this.onUIUpdate(this.lobbyData);

    // 방장 변경 알림
    this.showLeadershipChangeAlert(newLeaderId, currentUserId, newLeader);
  }

  handlePlayerLeft(data: any): void {
    console.log("🔄 플레이어 퇴장 처리 시작:", data);

    if (!this.lobbyData?.players) {
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

    if (!this.lobbyData?.players) {
      console.warn("❌ 로비 데이터가 없어서 플레이어 입장을 처리할 수 없습니다.");
      return;
    }

    const joinedUserId = data.user_id;
    const currentUserId = UserManager.getUserId();
    const lobbyInfo = data.lobby;

    // 기존 플레이어인지 신규 플레이어인지 확인
    const existingPlayerIndex = this.lobbyData.players.findIndex((p: LobbyPlayer) => p.user_id === joinedUserId);

    if (existingPlayerIndex !== -1) {
      // 기존 플레이어의 enabled 상태 변경
      this.lobbyData.players[existingPlayerIndex].enabled = true;
      if (lobbyInfo) {
        this.updateLobbyDataFromSocket(lobbyInfo); // 반환값 무시 (입장 시에는 호스트 변경 체크 불필요)
      }
    } else {
      // 신규 플레이어 추가
      this.processNewPlayerJoined(joinedUserId, lobbyInfo);
      return;
    }

    this.updatePlayerCounts();
    this.onUIUpdate(this.lobbyData);

    // 입장 알림 (현재 사용자가 아닌 경우)
    if (joinedUserId !== currentUserId) {
      const joinedPlayer = PlayerRenderer.findPlayerById(this.lobbyData.players, joinedUserId);
      if (joinedPlayer) {
        const playerName = PlayerRenderer.getPlayerDisplayName(joinedPlayer);
        console.log(`📢 플레이어 입장 알림: ${playerName}님이 로비에 입장했습니다.`);
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
      round: data.round,
      total_matches: data.total_matches,
      hasMatches: !!data.matches,
      isCompleted: !!data.message,
    });

    this.onUIUpdate(this.lobbyData);
    this.onDataRefresh();
  }

  private processPlayerLeft(leftUserId: number, data: any): void {
    if (!this.lobbyData) return;

    const leftPlayerIndex = this.lobbyData.players.findIndex((p: LobbyPlayer) => p.user_id === leftUserId);
    if (leftPlayerIndex === -1) {
      console.warn(`❌ 퇴장한 플레이어 ${leftUserId}를 찾을 수 없습니다.`);
      this.onDataRefresh();
      return;
    }

    const leftPlayer = this.lobbyData.players[leftPlayerIndex];
    const leftPlayerName = PlayerRenderer.getPlayerDisplayName(leftPlayer);

    console.log(`👋 플레이어 ${leftPlayerName}(${leftUserId})가 로비에서 퇴장함`);

    // 플레이어 목록에서 제거
    this.lobbyData.players.splice(leftPlayerIndex, 1);

    // 퇴장한 플레이어가 호스트였는지 확인
    if (leftUserId === this.lobbyData.creatorId) {
      console.log("🔄 호스트가 퇴장함 - 새로운 호스트 확인 필요");

      // 백엔드에서 새로운 호스트 정보가 왔는지 확인
      if (data.lobby && data.lobby.creator_id && data.lobby.creator_id !== leftUserId) {
        console.log("📥 백엔드에서 새로운 호스트 정보 수신:", data.lobby.creator_id);
        const hostUpdated = this.updateLobbyDataFromSocket(data.lobby);

        if (!hostUpdated) {
          console.log("❌ 백엔드 호스트 정보 업데이트 실패 - 자동 방장 선정 실행");
          this.autoAssignNewLeader();
          return;
        }
      } else {
        console.log("⚡ 백엔드에서 새로운 호스트 정보가 없음 - 자동 방장 선정 실행");
        // 백엔드에서 새로운 호스트 정보가 없으면 자동으로 방장 선정
        this.autoAssignNewLeader();
        return;
      }
    }

    this.updatePlayerCounts();
    this.onUIUpdate(this.lobbyData);
  }

  private processNewPlayerJoined(joinedUserId: number, lobbyInfo: any): void {
    if (!this.lobbyData || !lobbyInfo?.lobby_players) {
      console.warn("❌ 로비 정보가 없어서 전체 데이터를 새로고침합니다.");
      this.onDataRefresh();
      return;
    }

    const newPlayer = lobbyInfo.lobby_players.find((p: any) => p.user_id === joinedUserId && p.enabled === true);

    if (newPlayer) {
      console.log("🎉 새 플레이어 정보:", newPlayer);
      this.lobbyData.players.push(newPlayer);
      this.updatePlayerCounts();
      this.onUIUpdate(this.lobbyData);
    } else {
      console.warn("❌ 로비 정보에서 새 플레이어를 찾을 수 없습니다.");
      this.onDataRefresh();
    }
  }

  private updatePlayerCounts(): void {
    if (!this.lobbyData) return;

    this.lobbyData.currentPlayers = PlayerRenderer.getActivePlayers(this.lobbyData.players).length;
    this.lobbyData.allPlayersReady = PlayerRenderer.areAllPlayersReady(this.lobbyData.players);

    const currentUserId = UserManager.getUserId();
    this.lobbyData.isPlayerReady = PlayerRenderer.isCurrentUserReady(this.lobbyData.players, currentUserId);
  }

  private updateLobbyDataFromSocket(socketLobbyData: any): boolean {
    if (!this.lobbyData) return false;

    let hostUpdated = false;

    // 호스트 정보 업데이트
    if (socketLobbyData.creator_id) {
      const newCreatorId = socketLobbyData.creator_id;
      this.lobbyData.creatorId = newCreatorId;
      this.lobbyData.host = socketLobbyData.creator_nickname || "알 수 없음";

      const currentUserId = UserManager.getUserId();
      this.lobbyData.isHost = currentUserId === newCreatorId;

      // 모든 플레이어의 is_leader 상태 업데이트
      this.lobbyData.players.forEach((player: LobbyPlayer) => {
        player.is_leader = player.user_id === newCreatorId;
        // 새로운 방장의 enabled 상태를 true로 설정
        if (player.user_id === newCreatorId) {
          player.enabled = true;
        }
      });

      hostUpdated = true;
      console.log(`🎯 백엔드에서 새로운 호스트 정보 업데이트 완료: ${this.lobbyData.host} (ID: ${newCreatorId})`);
    }

    // 로비 상태 업데이트
    if (socketLobbyData.lobby_status) {
      this.lobbyData.status = socketLobbyData.lobby_status === "PENDING" ? "waiting" : "playing";
      this.lobbyData.statusText = socketLobbyData.lobby_status === "PENDING" ? "대기 중" : "게임 중";
    }

    return hostUpdated;
  }

  private showLeadershipChangeAlert(
    newLeaderId: number,
    currentUserId: number | null,
    newLeader: LobbyPlayer | undefined
  ): void {
    if (currentUserId === newLeaderId) {
      console.log("🎉 현재 사용자가 새로운 방장이 됨");
      alert("🎉 축하합니다! 당신이 새로운 방장이 되었습니다!");
    } else if (newLeader) {
      const newLeaderName = PlayerRenderer.getPlayerDisplayName(newLeader);
      console.log(`📢 다른 사용자가 방장이 됨: ${newLeaderName}`);
      alert(`👑 ${newLeaderName}님이 새로운 방장이 되었습니다.`);
    }
  }

  // 자동 방장 선정 기능 추가
  private autoAssignNewLeader(): void {
    if (!this.lobbyData || !this.lobbyData.players || this.lobbyData.players.length === 0) {
      console.warn("❌ 새로운 방장을 선정할 플레이어가 없습니다.");
      this.onDataRefresh();
      return;
    }
    // 활성화된 플레이어 중에서 새로운 방장 선정
    const activePlayers = this.lobbyData.players.filter((player: LobbyPlayer) => player.enabled !== false);

    if (activePlayers.length === 0) {
      console.warn("❌ 활성화된 플레이어가 없어서 새로운 방장을 선정할 수 없습니다.");
      this.onDataRefresh();
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
    this.transferLeadership(newLeader.user_id, this.lobbyData.id);
  }

  // 자동 방장 변경 알림
  async transferLeadership(targetUserId: number, lobbyId: number): Promise<void> {
    console.log("🔄 방장 위임 API 호출 시작:", { targetUserId });

    const currentUserId = Number(UserManager.getUserId());
    if (!currentUserId) {
      throw new Error("로그인이 필요합니다.");
    }

    console.log("📤 방장 위임 요청 데이터:", {
      current_leader_id: currentUserId,
      target_user_id: targetUserId,
      lobbyId: lobbyId,
    });

    const response = await AuthManager.authenticatedFetch(`${API_BASE_URL}/lobbies/${lobbyId}/authorize`, {
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
}
