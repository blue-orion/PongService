import { ApiResponse } from "#shared/api/response.js";
import { LobbyService } from "#domains/lobby/service/lobbyService.js";
import { TournamentService } from "#domains/lobby/service/tournamentService.js";
import { Helpers } from "#domains/lobby/utils/helpers.js";
import websocketManager from "#shared/websocket/websocketManager.js";
import { GameService } from "#domains/game/service/gameService.js";
import { LobbyStatus } from "@prisma/client";
import PageRequest from "#shared/page/PageRequest.js";

export class LobbyController {
  constructor(lobbyService = new LobbyService(), tournamentService = new TournamentService()) {
    this.lobbyService = lobbyService;
    this.tournamentService = tournamentService;
    this.gameService = GameService.getInstance();
    this.helpers = new Helpers();

    // 게임 서비스에 로비 알림 콜백 등록
    this.gameService.setLobbyNotificationCallback(this.handleGameCompleted.bind(this));

    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter((prop) => typeof this[prop] === "function" && prop !== "constructor")
      .forEach((fn) => {
        this[fn] = this[fn].bind(this);
      });
  }

  /**
   * 로비 전체 조회 (페이징)
   * @method GET /v1/lobbies?page=1&size=12&status=playing
   */
  async getAll(req, res) {
    try {
      const pageRequest = PageRequest.of(req.query, 1, 6);
      const pageResponse = await this.lobbyService.getAllLobbies(pageRequest);
      return ApiResponse.ok(res, pageResponse);
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
      const games = createdMatch.games; // Game 모델 기반의 배열

      // 3. 로비 네임스페이스를 통해 해당 로비 룸에 매칭 완료 알림 전송
      const lobbyNamespace = websocketManager.getLobbyNamespace();
      if (lobbyNamespace) {
        lobbyNamespace.to(`lobby-${id}`).emit("match:created", {
          tournament_id: createdMatch.tournament_id,
          tournament_status: createdMatch.tournament_status,
          lobby_id: createdMatch.lobby_id,
          current_round: createdMatch.current_round,
          total_rounds: createdMatch.total_rounds,
          total_matches: createdMatch.total_matches,
          games: createdMatch.games,
          message: createdMatch.message,
          winner: createdMatch.winner
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

      console.log(gameStartResult);
      return ApiResponse.ok(res, gameStartResult);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * 게임 완료 콜백 처리
   * 게임 서비스에서 게임이 끝났을 때 호출되는 콜백 함수
   * @param {number} tournamentId - 토너먼트 ID
   * @param {number} gameId - 완료된 게임 ID
   * @param {Object} gameResult - 게임 결과 { winnerId, loserId }
   */
  async handleGameCompleted(tournamentId, gameId, gameResult = {}) {
    try {
      console.log(`[LobbyController] Game completed: tournamentId=${tournamentId}, gameId=${gameId}`);

      const { winnerId, loserId } = gameResult;

      // 1. 패자를 로비에서 제거
      if (loserId) {
        const updatedLobby = await this.lobbyService.removeLoserFromLobby(tournamentId, loserId);
        console.log(`[LobbyController] Removed loser ${loserId} from lobby`);
      }

      // 2. 현재 라운드의 모든 게임이 완료되었는지 확인하고, 완료되었으면 라운드 증가 또는 토너먼트 완료
      const result = await this.tournamentService.checkAndIncrementRoundIfAllGamesCompleted(tournamentId);
      const { tournament: updatedTournament, isCompleted } = result;

      // 3. 토너먼트 ID로 해당 로비 찾기
      const tournament = await this.tournamentService.getTournamentById(tournamentId);
      if (tournament && tournament.lobbies && tournament.lobbies.length > 0) {
        const lobbyId = tournament.lobbies[0].id; // 첫 번째 로비 ID 사용

        // 4. 로비 네임스페이스를 통해 게임 완료 알림 전송
        const lobbyNamespace = websocketManager.getLobbyNamespace();
        if (lobbyNamespace) {
          if (isCompleted) {
            // 토너먼트가 완료된 경우 - 로비 상태도 COMPLETED로 변경
            await this.lobbyService.updateLobbyStatus(lobbyId, LobbyStatus.COMPLETED);
            console.log(`[LobbyController] Updated lobby ${lobbyId} status to COMPLETED`);

            lobbyNamespace.to(`lobby-${lobbyId}`).emit("tournament:completed", {
              tournament_id: tournamentId,
              lobby_id: lobbyId,
              tournament_status: updatedTournament.tournament_status,
              tournament_type: updatedTournament.tournament_type,
              final_round: updatedTournament.round,
              winner_id: winnerId,
              message: "토너먼트가 완료되었습니다!",
            });
          } else {
            // 게임만 완료된 경우
            lobbyNamespace.to(`lobby-${lobbyId}`).emit("game:completed", {
              tournament_id: tournamentId,
              game_id: gameId,
              lobby_id: lobbyId,
              current_round: updatedTournament.round,
              tournament_status: updatedTournament.tournament_status,
              winner_id: winnerId,
              loser_id: loserId,
              message: "게임이 완료되었습니다.",
            });
          }

          // 5. 패자가 로비에서 제거되었음을 알림
          if (loserId) {
            lobbyNamespace.to(`lobby-${lobbyId}`).emit("lobby:playerRemoved", {
              lobby_id: lobbyId,
              removed_user_id: loserId,
              reason: "game_loss",
              message: "게임에서 패배하여 로비에서 제외되었습니다.",
            });
          }
        }
      }
    } catch (error) {
      console.error(`[LobbyController] Error handling game completion: ${error.message}`);
    }
  }

  /**
   * 토너먼트 완료 결과 조회
   * @method GET v1/lobbies/:id/finish
   */
  async lobby_finish(req, res) {
    try {
      const { id } = req.params;

      const tournamentResult = await this.lobbyService.getTournamentResult({
        lobby_id: id,
      });

      return ApiResponse.ok(res, tournamentResult);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }
}
