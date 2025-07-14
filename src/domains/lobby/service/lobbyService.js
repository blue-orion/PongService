import { LobbyRepository } from "#domains/lobby/repo/lobbyRepo.js";
import { TournamentRepository } from "#domains/lobby/repo/tournamentRepo.js";

export class LobbyService {
  constructor(lobbyRepository = new LobbyRepository(), tournamentRepository = new TournamentRepository()) {
    this.lobbyRepository = lobbyRepository;
    this.tournamentRepository = tournamentRepository;
  }

  async getAllLobbies() {
    return await this.lobbyRepository.findAll();
  }

  async getLobbyById(id) {
    return await this.lobbyRepository.findById(id);
  }

  async createLobby(tournament_id, max_player, creator_id) {
    const tournament = await this.tournamentRepository.findById(tournament_id);
    if (!tournament_id || !max_player || !creator_id) throw new Error("입력 값이 누락되었습니다.");
    if (!tournament) throw new Error("해당 토너먼트를 찾을 수 없습니다.");    
    if (tournament.tournament_status !== "PENDING") throw new Error("이미 시작된 토너먼트입니다.");

    // 로비 생성
    const lobby = await this.lobbyRepository.create(tournament_id, max_player, creator_id);

    // 방장을 자동으로 로비에 참가시키기
    await this.lobbyRepository.addOrReactivatePlayer(lobby.id, creator_id, true); // true = 방장

    return lobby;
  }

  async joinLobby(id, userId) {
    const lobby = await this.lobbyRepository.findById(id);
    if (!lobby) throw new Error("존재하지 않는 로비입니다.");

    if (lobby.lobby_status !== "PENDING")
      throw new Error("이미 시작된 로비입니다.");

    const alreadyIn = await this.lobbyRepository.isPlayerAlreadyInLobby(id, userId);
    if (alreadyIn) throw new Error("이미 해당 로비에 참가 중입니다.");

    const currentPlayers = await this.lobbyRepository.countPlayers(id);
    if (currentPlayers >= lobby.max_player)
      throw new Error("로비 인원이 가득 찼습니다.");

    return await this.lobbyRepository.addOrReactivatePlayer(id, userId, false); // false = 일반 멤버
  }

  async leaveLobby(lobbyId, userId) {
    const lobby = await this.lobbyRepository.findById(lobbyId);
    if (!lobby) throw new Error("존재하지 않는 로비입니다.");

    const playerInLobby = await this.lobbyRepository.isPlayerAlreadyInLobby(lobbyId, userId);
    if (!playerInLobby) throw new Error("해당 로비에 참가하지 않은 사용자입니다.");

    return await this.lobbyRepository.removePlayer(lobbyId, userId);
  }

  async transferLeadership(lobbyId, currentLeaderId, targetUserId) {
    const lobby = await this.lobbyRepository.findById(lobbyId);
    if (!lobby) throw new Error("존재하지 않는 로비입니다.");

    // 현재 유저가 방장인지 확인
    if (lobby.creator_id !== currentLeaderId) {
      throw new Error("방장 권한이 없습니다.");
    }

    // 타겟 유저가 로비에 있는지 확인
    const targetPlayerInLobby = await this.lobbyRepository.isPlayerAlreadyInLobby(lobbyId, targetUserId);
    if (!targetPlayerInLobby) throw new Error("해당 유저가 로비에 참가하지 않았습니다.");

    // 방장 권한 이전
    return await this.lobbyRepository.transferLeadership(lobbyId, currentLeaderId, targetUserId);
  }

  async authorizeLobby(lobbyId, userId) {
    // 이 메서드는 deprecated - transferLeadership 사용
    throw new Error("이 메서드는 더 이상 사용되지 않습니다. transferLeadership을 사용하세요.");
  }

  async toggleReadyState(lobbyId, userId) {
    const lobby = await this.lobbyRepository.findById(lobbyId);
    if (!lobby) throw new Error("존재하지 않는 로비입니다.");

    const playerInLobby = await this.lobbyRepository.isPlayerAlreadyInLobby(lobbyId, userId);
    if (!playerInLobby) throw new Error("해당 로비에 참가하지 않은 사용자입니다.");

    return await this.lobbyRepository.togglePlayerReadyState(lobbyId, userId);
  }

  async createMatch(lobbyId, userId) {
    const lobby = await this.lobbyRepository.findById(lobbyId);
    if (!lobby) throw new Error("존재하지 않는 로비입니다.");

    // 방장 권한 확인
    if (lobby.creator_id !== userId) {
      throw new Error("방장 권한이 없습니다.");
    }

    const currentPlayers = await this.lobbyRepository.countPlayers(lobbyId);
    if (currentPlayers < lobby.max_player)
      throw new Error("로비 인원이 충분하지 않습니다.");

    // 모든 플레이어가 준비 상태인지 확인
    const allReady = await this.lobbyRepository.areAllPlayersReady(lobbyId);
    if (!allReady) throw new Error("모든 플레이어가 준비 상태가 아닙니다.");

    // 토너먼트 시작 처리
    await this.tournamentRepository.updateStatus(lobby.tournament_id, "IN_PROGRESS");

    // 로비 상태 변경
    await this.lobbyRepository.updateLobbyStatus(lobbyId, "STARTED");

    // 매칭 생성 로직 (게임 도메인과 연동 필요)
    return await this.lobbyRepository.createInitialMatches(lobbyId);
  }
}