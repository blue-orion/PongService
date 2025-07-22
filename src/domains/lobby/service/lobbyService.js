import { GameRepository } from "#domains/game/repo/gameRepo.js";
import { LobbyRepository } from "#domains/lobby/repo/lobbyRepo.js";
import { TournamentRepository } from "#domains/lobby/repo/tournamentRepo.js";
import { Helpers } from "#domains/lobby/utils/helpers.js";
import { TOURNAMENT_STATUS, LOBBY_STATUS } from "#domains/lobby/utils/helpers.js";
import PongException from "#shared/exception/pongException.js";
import {
  CreateLobbyDto,
  CreateMatchDto,
  DetailedGameMatchDto,
  GameMatchDto,
  GetLobbiesDto,
  GetLobbyDto,
  GetMatchesDto,
  JoinLobbyDto,
  LeaveLobbyDto,
  LobbyPlayerResponseDto,
  LobbyResponseDto,
  MatchesResponseDto,
  MatchResponseDto,
  StartGameDto,
  ToggleReadyStateDto,
  TransferLeadershipDto,
} from "#domains/lobby/model/Lobby.dto.js";

export class LobbyService {
  constructor(
    lobbyRepository = new LobbyRepository(),
    tournamentRepository = new TournamentRepository(),
    gameRepositiory = new GameRepository()
  ) {
    this.lobbyRepository = lobbyRepository;
    this.tournamentRepository = tournamentRepository;
    this.gameRepository = gameRepositiory;
    this.helpers = new Helpers();
  }

  // === 조회 메서드 ===
  /**
   * 로비 전체 조회 (페이징)
   * @method GET /v1/lobbies?page=1&size=10
   *
   * @param {Object} requestData - { page, size }
   * @returns {LobbiesResponseDto};
   */
  async getAllLobbies(requestData) {
    const dto = new GetLobbiesDto(requestData);
    const skip = (dto.page - 1) * dto.size;

    const [lobbies, total] = await Promise.all([
      this.lobbyRepository.findAll(skip, dto.size),
      this.lobbyRepository.getCount(),
    ]);

    return {
      total,
      page: dto.page,
      size: dto.size,
      lobbies,
    };
  }

  /**
   * 로비 단일 조회
   * @method GET v1/lobbies/:id
   *
   * @param {Object} requestData - { id }
   * @returns {LobbyResponseDto}
   */
  async getLobbyById(requestData) {
    const dto = new GetLobbyDto(requestData);
    const lobby = await this.lobbyRepository.findById(dto.id);

    if (!lobby) {
      throw PongException.LOBBY_NOT_FOUND;
    }

    return new LobbyResponseDto(lobby);
  }

  /**
   * 로비 매칭 조회
   * @method GET v1/lobbies/:id/matches
   *
   * @param {Object} requestData - { lobby_id }
   * @returns {MatchesResponseDto}
   */
  async getMatches(requestData) {
    const dto = new GetMatchesDto(requestData);

    // 로비 유효성 확인
    const lobby = await this.helpers._getLobbyWithValidation(dto.lobby_id);

    // 토너먼트 정보 조회
    const tournament = await this.tournamentRepository.findById(lobby.tournament_id);
    if (!tournament) {
      throw PongException.TOURNAMENT_NOT_FOUND;
    }

    // 해당 토너먼트의 모든 게임 조회 (플레이어 정보 포함)
    const matches = await this.gameRepository.getGamesByTournamentId(tournament.id);

    // 라운드 정보 계산
    const currentRound = tournament.round;
    const totalRounds = this.helpers._calculateTotalRounds(tournament.tournament_type);

    return new MatchesResponseDto({
      lobby_id: dto.lobby_id,
      tournament_id: tournament.id,
      tournament_status: tournament.tournament_status,
      current_round: currentRound,
      total_rounds: totalRounds,
      matches: matches,
    });
  }

  // === 로비 관리 메서드 ===
  /**
   * 로비 생성
   * @method POST /v1/lobbies
   *
   * @param {Object} requestData - { tournament_id, max_player, creator_id }
   * @returns {LobbyResponseDto}
   */
  async createLobby(requestData) {
    const dto = new CreateLobbyDto(requestData);

    await this.helpers._findActiveLobbyByUserId(dto.creator_id);

    const tournament = await this.helpers._getTournamentWithValidation(dto.tournament_id);
    this.helpers._validateTournamentStatus(tournament, TOURNAMENT_STATUS.PENDING);

    // 로비 생성
    const lobby = await this.lobbyRepository.create(dto.tournament_id, dto.max_player, dto.creator_id);

    // 방장도 자동으로 로비에 참가
    await this.lobbyRepository.addOrReactivatePlayer(lobby.id, dto.creator_id, true);

    // 업데이트된 로비 정보 조회
    const updatedLobby = await this.lobbyRepository.findById(lobby.id);
    return new LobbyResponseDto(updatedLobby);
  }

  /**
   * 로비 입장
   * @method POST v1/lobbies/:id/join
   *
   *  @param {Object} requestData - { lobby_id, user_id }
   * @returns {LobbyResponseDto}
   */
  async joinLobby(requestData) {
    // this.helpers._validateInput(id, userId);
    const dto = new JoinLobbyDto(requestData);

    // 로비 유효성 확인
    const lobby = await this.helpers._getLobbyWithValidation(dto.lobby_id);
    this.helpers._validateLobbyStatus(lobby, LOBBY_STATUS.PENDING);

    // 플레이어 참가 가능 여부 확인
    await this.helpers._validatePlayerCanJoin(dto.lobby_id, dto.user_id, lobby.max_player);

    // 플레이어 참가
    await this.lobbyRepository.addOrReactivatePlayer(dto.lobby_id, dto.user_id, false);

    // 업데이트된 로비 정보 조회
    const updatedLobby = await this.lobbyRepository.findById(dto.lobby_id);
    return new LobbyResponseDto(updatedLobby);
  }

  /**
   * 로비 퇴장
   * @method POST v1/:id/left
   *
   * @param {Object} requestData - { lobby_id, user_id }
   * @returns {LobbyResponseDto}
   */
  async leaveLobby(requestData) {
    const dto = new LeaveLobbyDto(requestData);

    //
    await this.helpers._getLobbyWithValidation(dto.lobby_id);
    await this.helpers._validatePlayerInLobby(dto.lobby_id, dto.user_id);

    await this.lobbyRepository.removePlayer(dto.lobby_id, dto.user_id);

    // 업데이트된 로비 정보 조회
    const updatedLobby = await this.lobbyRepository.findById(dto.lobby_id);
    return new LobbyResponseDto(updatedLobby);
  }

  /**
   * 방장 위임
   * @method POST v1/:id/authorize
   *
   * @param {Object} requestData - { lobby_id, current_leader_id, target_user_id }
   * @returns {LobbyResponseDto}
   */
  async transferLeadership(requestData) {
    const dto = new TransferLeadershipDto(requestData);

    // 로비, 권한 유효성 검사
    const lobby = await this.helpers._getLobbyWithValidation(dto.lobby_id);
    this.helpers._validateLeadership(lobby, dto.current_leader_id);

    // 위임 대상 유효성 검사
    await this.helpers._validatePlayerInLobby(dto.lobby_id, dto.target_user_id);

    // 방장 권한 이전
    const updatedLobby = await this.lobbyRepository.transferLeadership(
      dto.lobby_id,
      dto.current_leader_id,
      dto.target_user_id
    );

    // 업데이트된 로비 정보 조회
    return new LobbyResponseDto(updatedLobby);
  }

  /**
   * 레디 상태값 변경
   * @method POST v1/:id/ready_state
   *
   * @param {Object} requestData - { lobby_id, current_leader_id, target_user_id }
   * @returns {LobbyPlayerResponseDto}
   */
  async toggleReadyState(requestData) {
    const dto = new ToggleReadyStateDto(requestData);

    // 로비 및 플레이어 유효성 검증
    await this.helpers._getLobbyWithValidation(dto.lobby_id);
    await this.helpers._validatePlayerInLobby(dto.lobby_id, dto.user_id);

    // 준비 상태 토글
    const updatedUser = await this.lobbyRepository.togglePlayerReadyState(dto.lobby_id, dto.user_id);
    return new LobbyPlayerResponseDto(updatedUser);
  }

  // === 매치 생성 메서드 ===
  /**
   * 매칭 생성
   * @method POST v1/:id/create_match
   *
   * @param {Object} requestData - { lobby_id, user_id }
   * @returns {MatchResponseDto}
   */
  async createMatch(requestData) {
    const dto = new CreateMatchDto(requestData);

    const lobby = await this.helpers._getLobbyWithValidation(dto.lobby_id);
    this.helpers._validateLeadership(lobby, dto.user_id);

    await this.helpers._validateLobbyFull(dto.lobby_id, lobby.max_player);

    // 토너먼트 상태 확인
    const tournament = await this.tournamentRepository.findById(lobby.tournament_id);

    if (tournament.tournament_status === TOURNAMENT_STATUS.COMPLETED) {
      throw PongException.TOURNAMENT_COMPLETED;
    }

    const currentRound = tournament.round;

    const hasGames = await this.gameRepository.hasGamesInRound(tournament.id, 1);
    const result =
      currentRound === 1 && !hasGames
        ? await this._startInitialTournament(lobby, tournament)
        : await this._startNextRound(lobby, tournament);

    return new MatchResponseDto(result);
  }

  // ===== 초기 토너먼트 시작 =====
  async _startInitialTournament(lobby, tournament) {
    await this.helpers._validateAllPlayersReady(lobby.id);

    await Promise.all([
      this.tournamentRepository.updateStatus(tournament.id, TOURNAMENT_STATUS.IN_PROGRESS),
      this.lobbyRepository.updateLobbyStatus(lobby.id, LOBBY_STATUS.STARTED),
    ]);

    const players = await this.lobbyRepository.findActivePlayersByLobbyId(lobby.id);
    const shuffled = this.helpers._shuffleArray(players);
    const round = this.helpers._getRoundNumber(tournament.round);
    const matches = this.helpers._generateMatches(shuffled, tournament, round);

    const games = await this.gameRepository.createInitialMatches(matches);

    return {
      tournament_id: tournament.id,
      lobby_id: lobby.id,
      round: tournament.round,
      total_matches: matches.length,
      matches: games,
    };
  }

  // ===== 다음 라운드 진행 =====
  async _startNextRound(lobby, tournament) {
    const currentRound = tournament.round;
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

  // ===== 게임 시작 메서드 =====
  /**
   * 게임 시작
   * @method POST v1/:id/start_game
   *
   * @param {Object} requestData - { lobby_id, user_id, game_id }
   * @returns {Object} 게임 시작 결과
   */
  async startGame(requestData) {
    const dto = new StartGameDto(requestData);

    // 로비 유효성 검증
    const lobby = await this.helpers._getLobbyWithValidation(dto.lobby_id);

    // 방장 권한 검증 (게임 시작은 방장만 가능)
    this.helpers._validateLeadership(lobby, dto.user_id);

    // 게임 유효성 검증
    const game = await this.gameRepository.getGameById(dto.game_id);
    if (!game) {
      throw PongException.GAME_NOT_FOUND;
    }

    // 게임이 이미 시작되었는지 확인
    if (game.game_status !== "PENDING") {
      throw PongException.GAME_ALREADY_STARTED;
    }

    // 게임이 해당 로비의 토너먼트에 속하는지 확인
    if (game.tournament_id !== lobby.tournament_id) {
      throw PongException.INVALID_GAME_TOURNAMENT;
    }

    // 게임 상태를 IN_PROGRESS로 변경
    await this.gameRepository.updateGameStatus(dto.game_id, "IN_PROGRESS");

    // 플레이어 정보 조회
    const players = [
      await this.helpers._getUserById(game.player_one_id),
      await this.helpers._getUserById(game.player_two_id),
    ];

    return {
      game_id: game.id,
      tournament_id: game.tournament_id,
      lobby_id: dto.lobby_id,
      round: game.round,
      match: game.match,
      players: players.map((player) => ({
        id: player.id,
        nickname: player.nickname,
        username: player.username,
      })),
      game_status: "IN_PROGRESS",
      message: "게임이 시작되었습니다.",
    };
  }
}
