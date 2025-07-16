import { GameRepository } from "#domains/game/repo/gameRepo.js";
import { LobbyRepository } from "#domains/lobby/repo/lobbyRepo.js";
import { TournamentRepository } from "#domains/lobby/repo/tournamentRepo.js";
import { Helpers } from "#domains/lobby/utils/helpers.js";
import { TOURNAMENT_STATUS, LOBBY_STATUS } from "#domains/lobby/utils/helpers.js";
import prisma from "#shared/database/prisma.js";
import PongException from "#shared/exception/pongException.js";

export class LobbyService {
  constructor(
    lobbyRepository = new LobbyRepository(),
    tournamentRepository = new TournamentRepository(),
    gameRepositiory = new GameRepository(),
    helpers = new Helpers()
  ) {
    this.lobbyRepository = lobbyRepository;
    this.tournamentRepository = tournamentRepository;
    this.gameRepository = gameRepositiory;
    this.helpers = helpers;
  }

  // === 조회 메서드 ===
  async getAllLobbies(page, size) {
    const skip = (page - 1) * size;
    const [lobbies, total] = await Promise.all([this.lobbyRepository.findAll(skip, size), prisma.lobby.count()]);

    return {
      total,
      page,
      size,
      lobbies,
    };
  }

  async getLobbyById(id) {
    return await this.lobbyRepository.findById(id);
  }

  // === 로비 관리 메서드 ===
  async createLobby(tournament_id, max_player, creator_id) {
    this.helpers._validateLobbyInput(tournament_id, max_player, creator_id);

    const tournament = await this.helpers._getTournamentWithValidation(tournament_id);
    this.helpers._validateTournamentStatus(tournament, TOURNAMENT_STATUS.PENDING);
    // 로비 생성
    const lobby = await this.lobbyRepository.create(tournament_id, max_player, creator_id);
    // 방장도 자동으로 로비에 참가
    await this.lobbyRepository.addOrReactivatePlayer(lobby.id, creator_id, true);

    return lobby;
  }

  async joinLobby(id, userId) {
    this.helpers._validateInput(id, userId);

    const lobby = await this.helpers._getLobbyWithValidation(id);
    this.helpers._validatePositiveInteger(userId, "유저 Id");
    this.helpers._validateLobbyStatus(lobby, LOBBY_STATUS.PENDING);
    await this.helpers._validatePlayerCanJoin(id, userId, lobby.max_player);

    return await this.lobbyRepository.addOrReactivatePlayer(id, userId, false);
  }

  async leaveLobby(lobbyId, userId) {
    await this.helpers._getLobbyWithValidation(lobbyId);
    await this.helpers._validatePlayerInLobby(lobbyId, userId);

    return await this.lobbyRepository.removePlayer(lobbyId, userId);
  }

  async transferLeadership(lobbyId, currentLeaderId, targetUserId) {
    const lobby = await this.helpers._getLobbyWithValidation(lobbyId);
    this.helpers._validateLeadership(lobby, currentLeaderId);

    await this.helpers._validatePlayerInLobby(lobbyId, targetUserId, ApiResponse.ERROR_MESSAGES.TARGET_NOT_IN_LOBBY);

    // 방장 권한 이전
    return await this.lobbyRepository.transferLeadership(lobbyId, currentLeaderId, targetUserId);
  }

  async toggleReadyState(lobbyId, userId) {
    await this.helpers._getLobbyWithValidation(lobbyId);
    await this.helpers._validatePlayerInLobby(lobbyId, userId);

    return await this.lobbyRepository.togglePlayerReadyState(lobbyId, userId);
  }

  // === 매치 생성 메서드 ===
  async createMatch(lobbyId, userId) {
    const lobby = await this.helpers._getLobbyWithValidation(lobbyId);

    this.helpers._validateLeadership(lobby, userId);
    await this.helpers._validateLobbyFull(lobbyId, lobby.max_player);

    // 토너먼트 상태 확인
    const tournament = await this.tournamentRepository.findById(lobby.tournament_id);

    if (tournament.tournament_status === TOURNAMENT_STATUS.COMPLETED) {
      throw PongException.TOURNAMENT_COMPLETED;
    }

    const currentRound = tournament.round;

    if (currentRound === 1) {
      const hasGames = await this.gameRepository.hasGamesInRound(tournament.id, 1);
      if (!hasGames) return await this._startInitialTournament(lobby, tournament);
    }

    return await this._startNextRound(lobby, tournament);
  }

  // ===== 초기 토너먼트 시작 =====
  async _startInitialTournament(lobby, tournament) {
    await this.helpers._validateAllPlayersReady(lobby.id);

    console.log("llllllllllllllllllllllllllllllll");

    await Promise.all([
      this.tournamentRepository.updateStatus(tournament.id, TOURNAMENT_STATUS.IN_PROGRESS),
      this.lobbyRepository.updateLobbyStatus(lobby.id, LOBBY_STATUS.STARTED),
    ]);

    const players = await this.lobbyRepository.findActivePlayersByLobbyId(lobby.id);
    const shuffled = this.helpers._shuffleArray(players);
    const round = this.helpers._getRoundNumber(this.helpers._getInitialRound(players.length));
    const matches = this.helpers._generateMatches(shuffled, tournament, round);

    await this.gameRepository.createInitialMatches(matches);

    return {
      tournament_id: tournament.id,
      lobby_id: lobby.id,
      total_matches: matches.length,
      matches,
    };
  }

  // ===== 다음 라운드 진행 =====
  async _startNextRound(lobby, tournament) {
    const currentRound = await this.gameRepository.getCurrentRound(tournament.id);
    await this.helpers._validateRoundComplete(tournament.id, currentRound);

    const winners = await this.gameRepository.getRoundWinners(tournament.id, currentRound);
    await this.helpers._validateWinnersReady(lobby.id, winners);

    if (winners.length === 1) {
      await this.tournamentRepository.updateStatus(tournament.id, TOURNAMENT_STATUS.COMPLETED);
      return {
        tournament_id: tournament.id,
        lobby_id: lobby.id,
        message: "토너먼트가 완료되었습니다.",
        winner: winners[0],
      };
    }

    const shuffled = this.helpers._shuffleArray(winners);
    const nextRound = currentRound + 1;
    const matches = this.helpers._generateMatches(shuffled, tournament, nextRound);

    await this.gameRepository.createInitialMatches(matches);

    return {
      tournament_id: tournament.id,
      lobby_id: lobby.id,
      round: this.helpers._getRoundType(nextRound),
      total_matches: matches.length,
      matches,
    };
  }
}
