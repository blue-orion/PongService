import PongException from "#shared/exception/pongException.js";
import { ApiResponse } from "#shared/api/response.js";
import { LobbyService } from "#domains/lobby/service/lobbyService.js";
import { TournamentService } from "#domains/lobby/service/tournamentService.js";
import { Helpers } from "#domains/lobby/utils/helpers.js";
import websocketManager from "#shared/websocket/websocketManager.js";

export class LobbyController {
  constructor(lobbyService = new LobbyService(), tournamentService = new TournamentService()) {
    this.lobbyService = lobbyService;
    this.tournamentService = tournamentService;
    this.helpers = new Helpers();

    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter((prop) => typeof this[prop] === "function" && prop !== "constructor")
      .forEach((fn) => {
        this[fn] = this[fn].bind(this);
      });
  }

  /**
   * 로비 전체 조회 (페이징)
   * @method GET /v1/lobbies?page=1&size=10
   */
  async getAll(req, res) {
    try {
      const { page = 1, size = 6 } = req.query;
      const lobbies = await this.lobbyService.getAllLobbies({
        page,
        size,
      });
      return ApiResponse.ok(res, lobbies);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * 로비 단일 조회
   * @method GET v1/lobbies/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const lobby = await this.lobbyService.getLobbyById({ id });

      return ApiResponse.ok(res, lobby);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * 로비 매칭 조회
   * @method GET v1/lobbies/:id/matches
   */
  async getMatches(req, res) {
    try {
      const { id } = req.params;
      const matches = await this.lobbyService.getMatches({
        lobby_id: id,
      });

      return ApiResponse.ok(res, matches);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * 로비 생성
   * @method POST /v1/lobbies
   */
  async create(req, res) {
    try {
      const { tournament_type, max_player, user_id } = req.body;

      this.helpers._validateCreateLobbyInput(tournament_type, max_player, user_id);

      // 1. 토너먼트 생성
      const tournament = await this.tournamentService.createTournament(tournament_type);

      // 2. 로비 생성
      const tournament_id = tournament.id;
      const newLobby = await this.lobbyService.createLobby({
        tournament_id,
        max_player,
        creator_id: user_id,
      });

      return ApiResponse.ok(res, { lobby: newLobby }, 201);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * 로비 입장
   * @method POST v1/lobbies/:id/join
   */
  async join(req, res) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      const joinedLobby = await this.lobbyService.joinLobby({
        lobby_id: id,
        user_id,
      });

      // 로비 네임스페이스를 통해 해당 로비 룸에 이벤트 전송
      const lobbyNamespace = websocketManager.getLobbyNamespace();
      if (lobbyNamespace) {
        lobbyNamespace.to(`lobby-${id}`).emit("lobby:join", {
          user_id,
          lobby_id: id,
          type: "join",
          lobby: joinedLobby,
        });
      }

      return ApiResponse.ok(res, { lobby: joinedLobby }, 201);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * 로비 퇴장
   * @method POST v1/:id/left
   */
  async left(req, res) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      const leftLobby = await this.lobbyService.leaveLobby({
        lobby_id: id,
        user_id,
      });

      // 로비 네임스페이스를 통해 해당 로비 룸에 이벤트 전송
      const lobbyNamespace = websocketManager.getLobbyNamespace();
      if (lobbyNamespace) {
        lobbyNamespace.to(`lobby-${id}`).emit("lobby:left", {
          user_id,
          lobby_id: id,
          type: "left",
          lobby: leftLobby,
        });
      }

      return ApiResponse.ok(res, leftLobby);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * 방장 위임
   * @method POST v1/:id/authorize
   */
  async authorize(req, res) {
    try {
      const { id } = req.params;
      const { current_leader_id, target_user_id } = req.body;

      const authorizedLobby = await this.lobbyService.transferLeadership({
        lobby_id: id,
        current_leader_id,
        target_user_id,
      });

      // 로비 네임스페이스를 통해 해당 로비 룸에 이벤트 전송
      const lobbyNamespace = websocketManager.getLobbyNamespace();
      if (lobbyNamespace) {
        lobbyNamespace.to(`lobby-${id}`).emit("lobby:authorize", {
          lobby_id: id,
          new_leader_id: target_user_id,
          lobby: authorizedLobby,
        });
      }

      return ApiResponse.ok(res, authorizedLobby);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * 레디 상태값 변경
   * @method POST v1/:id/ready_state
   */
  async ready_state(req, res) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      const readyState = await this.lobbyService.toggleReadyState({
        lobby_id: id,
        user_id,
      });

      // 로비 네임스페이스를 통해 해당 로비 룸에 이벤트 전송
      const lobbyNamespace = websocketManager.getLobbyNamespace();
      if (lobbyNamespace) {
        lobbyNamespace.to(`lobby-${id}`).emit("lobby:ready", {
          lobby_id: id,
          user_id,
          is_ready: readyState.is_ready,
          player: readyState,
        });
      }

      return ApiResponse.ok(res, readyState);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * 매칭 생성
   * @method POST v1/:id/create_match
   */
  async create_match(req, res) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      // 1. 매칭 생성
      const createdMatch = await this.lobbyService.createMatch({
        lobby_id: id,
        user_id,
      });

      // 2. 매칭된 게임 정보 추출
      const matchGames = createdMatch.matches; // Game 모델 기반의 배열

      // 3. 로비 네임스페이스를 통해 해당 로비 룸에 매칭 완료 알림 전송
      const lobbyNamespace = websocketManager.getLobbyNamespace();
      if (lobbyNamespace) {
        lobbyNamespace.to(`lobby-${id}`).emit("match:created", {
          tournament_id: createdMatch.tournament_id,
          lobby_id: createdMatch.lobby_id,
          round: createdMatch.round,
          total_matches: createdMatch.total_matches,
          games: matchGames.map((game) => ({
            game_id: game.game_id,
            round: game.round,
            match: game.match,
            game_status: game.game_status,
            player_one: {
              id: game.player_one.id,
              nickname: game.player_one.user?.nickname,
              username: game.player_one.user?.username,
            },
            player_two: {
              id: game.player_two.id,
              nickname: game.player_two.user?.nickname,
              username: game.player_two.user?.username,
            },
          })),
          message: "매칭이 완료되었습니다.",
        });
      }

      return ApiResponse.ok(res, createdMatch);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * 게임 시작
   * @method POST v1/:id/start_game
   */
  async start_game(req, res) {
    try {
      const { id } = req.params;
      const { user_id, game_id } = req.body;

      // 1. 게임 시작
      const gameStartResult = await this.lobbyService.startGame({
        lobby_id: id,
        user_id,
        game_id,
      });

      // 2. 로비 네임스페이스를 통해 게임 시작 알림 전송
      const lobbyNamespace = websocketManager.getLobbyNamespace();
      if (lobbyNamespace) {
        lobbyNamespace.to(`lobby-${id}`).emit("game:started", {
          game_id: gameStartResult.game_id,
          lobby_id: id,
          tournament_id: gameStartResult.tournament_id,
          players: gameStartResult.players,
          message: "게임이 시작되었습니다.",
        });
      }

      return ApiResponse.ok(res, gameStartResult);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }
}
