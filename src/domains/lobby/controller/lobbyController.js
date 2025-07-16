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
   * @param {query: page, query: size} req
   * @returns
   */
  async getAll(req, res) {
    try {
      const { page = 1, size = 6 } = req.query;

      const pageNum = this.helpers._validatePositiveInteger(page, "페이지 번호");
      const sizeNum = this.helpers._validatePositiveInteger(size, "페이지 크기");

      const lobbies = await this.lobbyService.getAllLobbies(pageNum, sizeNum);
      return ApiResponse.ok(res, lobbies);
    } catch (error) {
      return this._handleError(res, error);
    }
  }

  /**
   * 로비 단일 조회
   * @method GET v1/lobbies/:id
   * @param {params: id} req
   * @returns
   */
  async getById(req, res) {
    try {
      const id = this.helpers._validatePositiveInteger(req.params.id, "로비 ID");

      const lobby = await this.lobbyService.getLobbyById(id);
      if (!lobby) {
        throw PongException.LOBBY_NOT_FOUND;
      }

      return ApiResponse.ok(res, lobby);
    } catch (error) {
      return this._handleError(res, error);
    }
  }

  /**
   * 로비 생성
   * @method POST /v1/lobbies
   * @param {tournament_type, max_player, user_id} req
   * @returns
   */
  async create(req, res) {
    try {
      const { tournament_type, max_player, user_id } = req.body;

      this.helpers._validateCreateLobbyInput(tournament_type, max_player, user_id);

      // 1. 토너먼트 생성
      const tournament = await this.tournamentService.createTournament(tournament_type);

      // 2. 로비 생성
      const newLobby = await this.lobbyService.createLobby(tournament.id, max_player, user_id);

      return ApiResponse.ok(res, { lobby: newLobby }, 201);
    } catch (error) {
      return this._handleError(res, error);
    }
  }

  /**
   * 로비 입장
   * @method POST v1/lobbies/:id/join
   * @param {params: id, body: user_id} req
   * @returns
   */
  async join(req, res) {
    try {
      const id = this.helpers._validatePositiveInteger(req.params.id, "로비 ID");
      const { user_id } = req.body;

      this.helpers._validateUserId(user_id);

      const joinedLobby = await this.lobbyService.joinLobby(id, user_id);
      return ApiResponse.ok(res, joinedLobby);
    } catch (error) {
      return this._handleError(res, error);
    }
  }

  /**
   * 로비 퇴장
   * @method POST v1/:id/left
   * @param {params: id, body: user_id} req
   * @returns
   */
  async left(req, res) {
    try {
      const id = this.helpers._validatePositiveInteger(req.params.id, "로비 ID");
      const { user_id } = req.body;

      this.helpers._validateUserId(user_id);

      const leftLobby = await this.lobbyService.leaveLobby(id, user_id);
      return ApiResponse.ok(res, leftLobby);
    } catch (error) {
      return this._handleError(res, error);
    }
  }

  /**
   * 방장 위임
   * @method POST v1/:id/authorize"
   * @param {params: id, body: current_user_id, target_user_id} req
   * @returns
   */
  async authorize(req, res) {
    try {
      const lobbyId = this.helpers._validatePositiveInteger(req.params.id, "로비 ID");
      const { current_user_id, target_user_id } = req.body;

      this.helpers._validateUserId(current_user_id, "현재 사용자 ID");
      this.helpers._validateUserId(target_user_id, "위임받을 사용자 ID");

      const authorizedLobby = await this.lobbyService.transferLeadership(lobbyId, current_user_id, target_user_id);

      return ApiResponse.ok(res, authorizedLobby);
    } catch (error) {
      return this._handleError(res, error);
    }
  }

  /**
   * 레디 상태값 변경
   * @method POST v1/:id/ready_state
   * @param {params: id, body: user_id} req
   * @returns
   */
  async ready_state(req, res) {
    try {
      const lobbyId = this.helpers._validatePositiveInteger(req.params.id, "로비 ID");
      const { user_id } = req.body;

      this.helpers._validateUserId(user_id);

      const readyState = await this.lobbyService.toggleReadyState(lobbyId, user_id);
      return ApiResponse.ok(res, readyState);
    } catch (error) {
      return this._handleError(res, error);
    }
  }

  /**
   * 매칭 생성
   * @method POST v1/:id/create_match
   * @param {params: id} req
   * @returns
   */
  async create_match(req, res) {
    try {
      const lobbyId = this.helpers._validatePositiveInteger(req.params.id, "로비 ID");
      const { user_id } = req.body;

      this.helpers._validateUserId(user_id);

      const createdMatch = await this.lobbyService.createMatch(lobbyId, user_id);
      return ApiResponse.ok(res, createdMatch);
    } catch (error) {
      return this._handleError(res, error);
    }
  }

  // === 에러 처리 헬퍼 메서드 ===
  _handleError(res, error) {
    // PongException인 경우 해당 상태 코드 사용
    if (error instanceof PongException) {
      return ApiResponse.error(res, error, error.statusCode);
    }

    // 기존 에러 메시지 기반 상태 코드 매핑
    const statusCode = this._getStatusCodeFromMessage(error.message);
    return ApiResponse.error(res, error, statusCode);
  }

  _getStatusCodeFromMessage(message) {
    const errorMappings = {
      "존재하지 않는": 404,
      "찾을 수 없습니다": 404,
      "권한이 없습니다": 403,
      "방장 권한이 없습니다": 403,
      "참가하지 않은": 403,
      "가득 ": 409,
      "이미 ": 409,
      "충분하지 않습니다": 409,
      "완료되지 않았습니다": 409,
      "준비 상태가 아닙니다": 409,
      "종료되었습니다 ": 409,
    };

    for (const [keyword, code] of Object.entries(errorMappings)) {
      if (message.includes(keyword)) {
        return code;
      }
    }

    return 400; // 기본값
  }
}
