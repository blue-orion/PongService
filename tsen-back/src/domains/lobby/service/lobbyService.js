import { GameRepository } from "#domains/game/repo/gameRepo.js";
import { LobbyRepository } from "#domains/lobby/repo/lobbyRepo.js";
import { TournamentRepository } from "#domains/lobby/repo/tournamentRepo.js";
import { Helpers } from "#domains/lobby/utils/helpers.js";
import { TOURNAMENT_STATUS, LOBBY_STATUS } from "#domains/lobby/utils/helpers.js";
import PongException from "#shared/exception/pongException.js";
import prisma from "#shared/database/prisma.js";
import { LobbyStatus } from "@prisma/client";
import PageRequest from "#shared/page/PageRequest.js";
import PageResponse from "#shared/page/PageResponse.js";
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
   * @method GET /v1/lobbies?page=1&size=10&status=playing
   *
   * @param {PageRequest} pageRequest - 페이징 및 필터 정보
   * @returns {PageResponse} 페이징된 로비 목록
   */
  async getAllLobbies(pageRequest) {
    // 먼저 게임 중인데 플레이어가 0명인 로비들을 정리
    await this._cleanupEmptyStartedLobbies();

    const [lobbies, total] = await Promise.all([
      this.lobbyRepository.findAll(pageRequest.skip, pageRequest.take, pageRequest.filters),
      this.lobbyRepository.getCount(pageRequest.filters),
    ]);

    return PageResponse.of(pageRequest, lobbies, total);
  }

  /**
   * 게임 중인데 플레이어가 0명인 로비들을 자동으로 정리
   * @private
   */
  async _cleanupEmptyStartedLobbies() {
    try {
      // STARTED 상태이면서 활성 플레이어가 0명인 로비들 조회
      const emptyStartedLobbies = await this.lobbyRepository.findEmptyStartedLobbies();

      if (emptyStartedLobbies.length === 0) {
        return;
      }

      console.log(`[LobbyService] Found ${emptyStartedLobbies.length} empty started lobbies to cleanup`);

      // 각 로비에 대해 정리 작업 수행
      for (const lobby of emptyStartedLobbies) {
        await this._cleanupLobby(lobby);
      }
    } catch (error) {
      console.error(`[LobbyService] Error during lobby cleanup: ${error.message}`);
      // 정리 작업 실패해도 조회 작업은 계속 진행
    }
  }

  /**
   * 개별 로비 정리 작업
   * @private
   * @param {Object} lobby - 정리할 로비 객체
   */
  async _cleanupLobby(lobby) {
    try {
      console.log(`[LobbyService] Cleaning up lobby ${lobby.id}`);

      // 1. 해당 로비의 모든 비활성 플레이어들을 완전히 제거
      await this.lobbyRepository.removeAllPlayersInLobby(lobby.id);

      // 2. 로비 상태를 COMPLETED로 변경
      await this.lobbyRepository.updateLobbyStatus(lobby.id, LobbyStatus.COMPLETED);

      // 3. 토너먼트가 있다면 COMPLETED로 변경
      if (lobby.tournament_id) {
        await this.tournamentRepository.updateStatus(lobby.tournament_id, "COMPLETED");
      }

      console.log(`[LobbyService] Successfully cleaned up lobby ${lobby.id}`);
    } catch (error) {
      console.error(`[LobbyService] Error cleaning up lobby ${lobby.id}: ${error.message}`);
    }
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

    const hasGames = await this.gameRepository.hasGamesInRound(tournament.id, currentRound);
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

    const createdGames = await this.gameRepository.createInitialMatches(matches);

    // 최신 토너먼트 정보 재조회
    const latestTournament = await this.tournamentRepository.findById(tournament.id);

    return {
      tournament_id: tournament.id,
      lobby_id: lobby.id,
      current_round: tournament.round,
      total_rounds: this.helpers._calculateTotalRounds(latestTournament.tournament_type),
      tournament_status: latestTournament.tournament_status,
      total_matches: matches.length,
      matches: createdGames,
      games: createdGames,
    };
  }

  // ===== 다음 라운드 진행 =====
  async _startNextRound(lobby, tournament) {
    // 최신 토너먼트 정보 재조회 (라운드가 이미 증가되었을 수 있음)
    const latestTournament = await this.tournamentRepository.findById(tournament.id);
    const currentRound = latestTournament.round;

    console.log(`[LobbyService] Starting next round. Current round: ${currentRound} (was ${tournament.round})`);

    // 현재 라운드가 이미 게임을 가지고 있는지 확인
    const hasCurrentRoundGames = await this.gameRepository.hasGamesInRound(tournament.id, currentRound);
    if (hasCurrentRoundGames) {
      console.log(`[LobbyService] Round ${currentRound} already has games, no new games to create`);
      const existingGames = await this.gameRepository.getGamesByTournamentIdAndRound(tournament.id, currentRound);
      return {
        tournament_id: tournament.id,
        lobby_id: lobby.id,
        current_round: currentRound,
        total_matches: existingGames.length,
        matches: existingGames,
        message: "이미 현재 라운드의 게임이 생성되어 있습니다.",
      };
    }

    // 현재 로비에 있는 활성 플레이어들 조회 (이전 라운드 승자들)
    const activePlayers = await this.lobbyRepository.findActivePlayersByLobbyId(lobby.id);
    console.log(`[LobbyService] Found ${activePlayers.length} active players in lobby:`, activePlayers);

    // 모든 플레이어가 준비되었는지 확인
    await this.helpers._validateAllPlayersReady(lobby.id);

    // 플레이어가 1명이면 토너먼트 완료
    if (activePlayers.length === 1) {
      await this.tournamentRepository.updateStatus(tournament.id, TOURNAMENT_STATUS.COMPLETED);
      return {
        tournament_id: tournament.id,
        lobby_id: lobby.id,
        message: "토너먼트가 완료되었습니다.",
        winner: activePlayers[0],
      };
    }

    console.log(`[LobbyService] Creating matches for current round: ${currentRound}`);

    // 2라운드부터는 이전 라운드 승자들을 게임 순서대로 매칭
    const matches = await this.helpers._generateTournamentMatches(latestTournament.id, currentRound);

    console.log(`[LobbyService] Generated ${matches.length} matches:`, matches);

    const createdGames = await this.gameRepository.createInitialMatches(matches);
    console.log(`[LobbyService] Created ${createdGames.length} games:`, createdGames);

    return {
      tournament_id: tournament.id,
      lobby_id: lobby.id,
      current_round: currentRound,
      total_rounds: this.helpers._calculateTotalRounds(latestTournament.tournament_type),
      tournament_status: latestTournament.tournament_status,
      total_matches: matches.length,
      matches: createdGames,
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

  /**
   * 게임 완료 후 패자를 로비에서 제거
   * @param {number} tournamentId - 토너먼트 ID
   * @param {number} loserId - 패자 ID
   */
  async removeLoserFromLobby(tournamentId, loserId) {
    try {
      // 토너먼트에 해당하는 로비 찾기
      const tournament = await this.tournamentRepository.findById(tournamentId);
      if (!tournament || !tournament.lobbies || tournament.lobbies.length === 0) {
        console.log(`[LobbyService] No lobby found for tournament ${tournamentId}`);
        return null;
      }

      const lobby = tournament.lobbies[0];

      // 패자가 로비에 있는지 확인
      const loserInLobby = lobby.lobby_players.find((player) => player.user_id === loserId);
      if (!loserInLobby) {
        console.log(`[LobbyService] Loser ${loserId} not found in lobby ${lobby.id}`);
        return null;
      }

      // 패자를 로비에서 제거 (기존 removePlayer 메서드 사용)
      await this.lobbyRepository.removePlayer(lobby.id, loserId);

      console.log(`[LobbyService] Removed loser ${loserId} from lobby ${lobby.id}`);

      // 업데이트된 로비 정보 반환
      return await this.lobbyRepository.findById(lobby.id);
    } catch (error) {
      console.error(`[LobbyService] Error removing loser from lobby: ${error.message}`);
      throw error;
    }
  }

  /**
   * 로비 상태 업데이트
   * @param {number} lobbyId - 로비 ID
   * @param {LobbyStatus} status - 새로운 상태 (PENDING, STARTED, COMPLETED)
   */
  async updateLobbyStatus(lobbyId, status) {
    try {
      return await this.lobbyRepository.updateLobbyStatus(lobbyId, status);
    } catch (error) {
      console.error(`[LobbyService] Error updating lobby status: ${error.message}`);
      throw error;
    }
  }

  /**
   * 토너먼트 완료 결과 조회
   * @param {Object} requestData - { lobby_id }
   * @returns {Object} 토너먼트 결과 정보
   */
  async getTournamentResult(requestData) {
    const { lobby_id } = requestData;

    try {
      // 1. 로비 정보 조회
      const lobby = await this.lobbyRepository.findById(lobby_id);
      if (!lobby) {
        throw PongException.LOBBY_NOT_FOUND;
      }

      // 2. 토너먼트 정보 조회
      const tournament = await this.tournamentRepository.findById(lobby.tournament_id);
      if (!tournament) {
        throw PongException.TOURNAMENT_NOT_FOUND;
      }

      // 3. 토너먼트 상태에 따른 처리
      if (tournament.tournament_status !== "COMPLETED") {
        // 토너먼트가 아직 진행 중인 경우
        return {
          tournament: {
            id: tournament.id,
            tournament_type: tournament.tournament_type,
            tournament_status: tournament.tournament_status,
            round: tournament.round,
            created_at: tournament.created_at,
            updated_at: tournament.updated_at,
          },
          lobby: {
            id: lobby.id,
            max_player: lobby.max_player,
            lobby_status: lobby.lobby_status,
            creator_id: lobby.creator_id,
          },
          winner: null,
          total_rounds: this.helpers._calculateTotalRounds(tournament.tournament_type),
          round_results: {},
          is_completed: false,
          message: "토너먼트가 아직 진행 중입니다.",
        };
      }

      // 4. 모든 게임 결과 조회 (라운드별로 정렬)
      const allGames = tournament.games.sort((a, b) => {
        if (a.round !== b.round) return a.round - b.round;
        return a.match - b.match;
      });

      // 5. 최종 승자 찾기 (마지막 라운드의 승리자)
      const finalRound = Math.max(...allGames.map((game) => game.round));
      const finalGame = allGames.find((game) => game.round === finalRound && game.winner_id);

      let winner = null;
      if (finalGame && finalGame.winner_id) {
        const winnerData = await this.lobbyRepository.checkUserExists(finalGame.winner_id);
        if (!winnerData) {
          winner = await prisma.user.findUnique({
            where: { id: finalGame.winner_id },
            select: { id: true, nickname: true, username: true },
          });
        }
      }

      // 6. 라운드별 게임 결과 구성
      const roundResults = {};
      for (const game of allGames) {
        if (!roundResults[game.round]) {
          roundResults[game.round] = [];
        }

        const gameResult = {
          game_id: game.id,
          match: game.match,
          player_one: game.player_one
            ? {
                id: game.player_one.id,
                nickname: game.player_one.nickname,
                username: game.player_one.username,
              }
            : null,
          player_two: game.player_two
            ? {
                id: game.player_two.id,
                nickname: game.player_two.nickname,
                username: game.player_two.username,
              }
            : null,
          winner_id: game.winner_id,
          winner: game.winner
            ? {
                id: game.winner.id,
                nickname: game.winner.nickname,
                username: game.winner.username,
              }
            : null,
          score:
            game.player_one_score !== null && game.player_two_score !== null
              ? `${game.player_one_score}-${game.player_two_score}`
              : null,
          play_time: game.play_time,
          game_status: game.game_status,
        };

        roundResults[game.round].push(gameResult);
      }

      return {
        tournament: {
          id: tournament.id,
          tournament_type: tournament.tournament_type,
          tournament_status: tournament.tournament_status,
          round: tournament.round,
          created_at: tournament.created_at,
          updated_at: tournament.updated_at,
        },
        lobby: {
          id: lobby.id,
          max_player: lobby.max_player,
          lobby_status: lobby.lobby_status,
          creator_id: lobby.creator_id,
        },
        winner: winner,
        total_rounds: finalRound,
        round_results: roundResults,
        is_completed: true,
        message: "토너먼트가 완료되었습니다.",
      };
    } catch (error) {
      console.error(`[LobbyService] Error getting tournament result: ${error.message}`);
      throw error;
    }
  }
}
