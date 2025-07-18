import PongException from "#shared/exception/pongException.js";
import { ApiResponse } from "#shared/api/response.js";
import { LobbyService } from "#domains/lobby/service/lobbyService.js";
import { TournamentService } from "#domains/lobby/service/tournamentService.js";
import { Helpers } from "#domains/lobby/utils/helpers.js";

export class LobbyController {
  constructor(lobbyService = new LobbyService(), tournamentService = new TournamentService(), helpers = new Helpers()) {
    this.lobbyService = lobbyService;
    this.tournamentService = tournamentService;
    this.helpers = helpers;

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
        size
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
        user_id
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
        user_id
      });
      
      return ApiResponse.ok(res, { lobby: joinedLobby }, 201);
    } catch (error) {
      return this._handleError(res, error);
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
        user_id
      });
      
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
      // const lobbyId = this.helpers._validatePositiveInteger(req.params.id, "로비 ID");
      // const { current_user_id, target_user_id } = req.body;

      const { id } = req.params;
      const { current_leader_id, target_user_id } = req.body;

      const authorizedLobby = await this.lobbyService.transferLeadership({
        lobby_id: id,
        current_leader_id,
        target_user_id
      });

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
      // const lobbyId = this.helpers._validatePositiveInteger(req.params.id, "로비 ID");
      // const { user_id } = req.body;
      const { id } = req.params;
      const { user_id } = req.body;
      
      const readyState = await this.lobbyService.toggleReadyState({
        lobby_id: id,
        user_id
      });

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

      const createdMatch = await this.lobbyService.createMatch({
        lobby_id: id,
        user_id
      });
      return ApiResponse.ok(res, createdMatch);
    } catch (error) {
      return ApiResponse.error(res, error);
    }
  }
}
