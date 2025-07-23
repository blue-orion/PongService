import { LobbyData, LobbyPlayer, SocketEventHandlers } from "../../../types/lobby";
import { AuthManager } from "../../../utils/auth";
import { UserManager } from "../../../utils/user";
import { PlayerRenderer } from "../renderers/PlayerRenderer";

export class SocketEventProcessor {
  private lobbyData: LobbyData | null = null;
  private onUIUpdate: (lobbyData: LobbyData) => void;
  private onDataRefresh: () => void;

  constructor(onUIUpdate: (lobbyData: LobbyData) => void, onDataRefresh: () => void) {
    this.onUIUpdate = onUIUpdate;
    this.onDataRefresh = onDataRefresh;
  }

  setLobbyData(lobbyData: LobbyData | null): void {
    this.lobbyData = lobbyData;
  }

  handleGameStarted(data: any) {
    console.log("게임 시작 이벤트 처리 시작:", data);

    window.router.navigate(`/game/${data.game_id}/${data.tournament_id}`, false);
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
        this.updateLobbyDataFromSocket(lobbyInfo);
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
      if (data.lobby) {
        this.updateLobbyDataFromSocket(data.lobby);
      } else {
        this.onDataRefresh();
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

  private updateLobbyDataFromSocket(socketLobbyData: any): void {
    if (!this.lobbyData) return;

    // 호스트 정보 업데이트
    if (socketLobbyData.creator_id) {
      this.lobbyData.creatorId = socketLobbyData.creator_id;
      this.lobbyData.host = socketLobbyData.creator_nickname || "알 수 없음";

      const currentUserId = UserManager.getUserId();
      this.lobbyData.isHost = currentUserId === socketLobbyData.creator_id;
    }

    // 로비 상태 업데이트
    if (socketLobbyData.lobby_status) {
      this.lobbyData.status = socketLobbyData.lobby_status === "PENDING" ? "waiting" : "playing";
      this.lobbyData.statusText = socketLobbyData.lobby_status === "PENDING" ? "대기 중" : "게임 중";
    }
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
}
