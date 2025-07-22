import PongException from "#shared/exception/pongException.js";
import { GameRepository } from "#domains/game/repo/gameRepo.js";
import { LobbyRepository } from "#domains/lobby/repo/lobbyRepo.js";
import { TournamentRepository } from "#domains/lobby/repo/tournamentRepo.js";
import prisma from "#shared/database/prisma.js";

export const TOURNAMENT_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
};

export const LOBBY_STATUS = {
  PENDING: "PENDING",
  STARTED: "STARTED",
};

export const GAME_STATUS = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
};

export const TOURNAMENT_TYPE = {
  LAST_16: "LAST_16",
  QUARTERFINAL: "QUARTERFINAL",
  SEMIFINAL: "SEMIFINAL",
  FINAL: "FINAL",
};

export const ROUND_MAP = {
  1: "LAST_16",
  2: "QUARTERFINAL",
  3: "SEMIFINAL",
  4: "FINAL",
};

export const REVERSE_ROUND_MAP = {
  LAST_16: 1,
  QUARTERFINAL: 2,
  SEMIFINAL: 3,
  FINAL: 4,
};

export class Helpers {
  constructor(
    lobbyRepository = new LobbyRepository(),
    tournamentRepository = new TournamentRepository(),
    gameRepository = new GameRepository()
  ) {
    this.lobbyRepository = lobbyRepository;
    this.tournamentRepository = tournamentRepository;
    this.gameRepository = gameRepository;
  }

  // === 기본 검증 메서드 ===
  _validateInput(...inputs) {
    if (inputs.some((input) => !input)) {
      throw PongException.ENTITY_NOT_FOUND;
    }
  }

  _validateLobbyInput(tournament_id, max_player, creator_id) {
    if (!tournament_id || !max_player || !creator_id) {
      throw PongException.MISSING_INPUT;
    }
  }

  // === 엔티티 조회 및 검증 메서드 ===
  async _getTournamentWithValidation(tournament_id) {
    const tournament = await this.tournamentRepository.findById(tournament_id);
    if (!tournament) throw PongException.TOURNAMENT_NOT_FOUND;
    return tournament;
  }

  async _getLobbyWithValidation(id) {
    const lobby = await this.lobbyRepository.findById(id);
    if (!lobby) {
      throw PongException.LOBBY_NOT_FOUND;
    }
    return lobby;
  }

  async _getUserById(user_id) {
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: {
        id: true,
        nickname: true,
        username: true,
        profile_image: true,
      },
    });
    if (!user) {
      throw PongException.USER_NOT_FOUND;
    }
    return user;
  }

  // === 상태 검증 메서드 ===
  _validateTournamentStatus(tournament, expectedStatus) {
    if (tournament.tournament_status !== expectedStatus) {
      throw PongException.LOBBY_ALREADY_STARTED;
    }
  }

  _validateLobbyStatus(lobby, expectedStatus) {
    if (lobby.lobby_status !== expectedStatus) {
      throw PongException.LOBBY_ALREADY_STARTED;
    }
  }

  // === 권한 검증 메서드 ===
  _validateLeadership(lobby, userId) {
    if (lobby.creator_id !== userId) {
      throw PongException.NOT_LEADER;
    }
  }

  // === 플레이어 관련 검증 메서드 ===
  async _validatePlayerCanJoin(lobbyId, userId, maxPlayers) {
    const [realUserIn, alreadyIn, currentPlayers] = await Promise.all([
      this.lobbyRepository.checkUserExists(userId),
      this.lobbyRepository.isPlayerAlreadyInLobby(lobbyId, userId),
      this.lobbyRepository.countPlayers(lobbyId),
    ]);

    if (realUserIn) {
      throw PongException.NOT_REAL_USER;
    }

    if (alreadyIn) {
      throw PongException.ALREADY_IN_LOBBY;
    }

    if (!alreadyIn && currentPlayers >= maxPlayers) {
      throw PongException.LOBBY_FULL;
    }
  }

  async _findActiveLobbyByUserId(userId) {
    const existingLobby = await this.lobbyRepository.findActiveLobbyByUserId(userId);
    console.log(existingLobby);
    if (existingLobby) {
      throw PongException.ALREADY_IN_LOBBY;
    }
  }

  async _validatePlayerInLobby(lobbyId, userId) {
    const playerInLobby = await this.lobbyRepository.isPlayerAlreadyInLobby(lobbyId, userId);
    if (!playerInLobby) {
      throw PongException.TARGET_NOT_IN_LOBBY;
    }
  }

  // === 로비 상태 검증 메서드 ===
  async _validateLobbyFull(lobbyId, maxPlayers) {
    const currentPlayers = await this.lobbyRepository.countPlayers(lobbyId);
    if (currentPlayers !== maxPlayers) {
      throw PongException.INSUFFICIENT_PLAYERS;
    }
  }

  async _validateAllPlayersReady(lobbyId) {
    const allReady = await this.lobbyRepository.areAllPlayersReady(lobbyId);
    if (!allReady) {
      throw PongException.PLAYERS_NOT_READY;
    }
  }

  // === 토너먼트 진행 검증 메서드 ===
  async _validateRoundComplete(tournamentId, currentRound) {
    const isRoundComplete = await this.gameRepository.isRoundComplete(tournamentId, currentRound);
    if (!isRoundComplete) {
      throw PongException.ROUND_NOT_COMPLETE;
    }
  }

  async _validateWinnersReady(lobbyId, winners) {
    const winnersReady = await this.lobbyRepository.areWinnersReady(lobbyId, winners);
    if (!winnersReady) {
      throw PongException.WINNERS_NOT_READY;
    }
  }

  // === 토너먼트 완료 검증 메서드 ===
  _validateTournamentNotCompleted(tournament) {
    if (tournament.tournament_status === "COMPLETED") {
      throw PongException.TOURNAMENT_COMPLETED;
    }
  }

  // -------------

  // === 검증 헬퍼 메서드 ===
  _validatePositiveInteger(value, fieldName) {
    const num = Number(value);
    if (!value || isNaN(num) || num <= 0) {
      throw PongException.INVALID_INPUT(fieldName);
    }
    return num;
  }

  _validateUserId(userId, fieldName = "사용자 ID") {
    if (!userId || isNaN(Number(userId))) {
      throw PongException.INVALID_INPUT(fieldName);
    }
  }

  _validateCreateLobbyInput(tournament_type, max_player, user_id) {
    if (!tournament_type) {
      throw new PongException("토너먼트 타입이 필요합니다.", 400);
    }

    if (!max_player || isNaN(Number(max_player)) || Number(max_player) <= 0) {
      throw new PongException("유효하지 않은 최대 플레이어 수입니다.", 400);
    }

    if (!user_id || isNaN(Number(user_id))) {
      throw new PongException("유효하지 않은 사용자 ID입니다.", 400);
    }

    const validTypes = ["LAST_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];
    if (!validTypes.includes(tournament_type)) {
      throw new PongException("유효하지 않은 토너먼트 타입입니다.", 400);
    }

    const validMaxPlayers = {
      LAST_16: 16,
      QUARTERFINAL: 8,
      SEMIFINAL: 4,
      FINAL: 2,
    };

    if (validMaxPlayers[tournament_type] !== Number(max_player)) {
      throw new PongException(
        `${tournament_type} 토너먼트 타입에는 ${validMaxPlayers[tournament_type]}명이 필요합니다.`,
        400
      );
    }
  }

  // === 매칭 생성 로직 ===
  _getInitialRound(count) {
    return Math.ceil(Math.log2(count));
  }

  _getRoundNumber(power) {
    return power;
  }

  _getRoundType(roundNumber) {
    const types = {
      1: "LAST_16",
      2: "QUARTERFINAL",
      3: "SEMIFINAL",
      4: "FINAL",
    };
    return types[roundNumber] || `ROUND_${roundNumber}`;
  }

  _shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  _generateMatches(players, tournament, round) {
    const matches = [];

    for (let i = 0; i < players.length; i += 2) {
      const p1 = players[i];
      const p2 = players[i + 1];
      if (!p2) break; // 홀수일 경우 p2는 없음

      matches.push({
        tournament_id: tournament.id,
        player_one_id: p1.user_id,
        player_two_id: p2.user_id,
        round,
        match: i,
        game_status: GAME_STATUS.PENDING,
      });
    }

    return matches;
  }

  // === 토너먼트 관련 유틸리티 메서드 ===
  _calculateTotalRounds(tournamentType) {
    const roundCounts = {
      LAST_16: 4, // 16강 -> 8강 -> 4강 -> 결승
      QUARTERFINAL: 3, // 8강 -> 4강 -> 결승
      SEMIFINAL: 2, // 4강 -> 결승
      FINAL: 1, // 결승
    };
    return roundCounts[tournamentType] || 4;
  }
}
