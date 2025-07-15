import { ApiResponse } from "#shared/api/response.js";
import { LobbyService } from "#domains/lobby/service/lobbyService.js";
import { TournamentService } from "#domains/lobby/service/tournamentService.js";

export class LobbyController {
  constructor(lobbyService = new LobbyService(), tournamentService = new TournamentService()) {
    this.lobbyService = lobbyService;
    this.tournamentService = tournamentService;

    Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter((prop) => typeof this[prop] === "function" && prop !== "constructor")
      .forEach((fn) => {
        this[fn] = this[fn].bind(this);
      });
  }

  // 로비 전체 조회
  async getAll(_req, res) {
    try {
      const lobbies = await this.lobbyService.getAllLobbies();
      return ApiResponse.ok(res, lobbies);
    } catch (err) {
      return ApiResponse.error(res, err, 500);
    }
  }

  // 로비 단일 조회
  async getById(req, res) {
    const id = Number(req.params.id);
    try {
      const lobby = await this.lobbyService.getLobbyById(id);
      if (!lobby) return ApiResponse.error(res, new Error("해당 로비를 찾을 수 없습니다."), 404);
      return ApiResponse.ok(res, lobby);
    } catch (err) {
      return ApiResponse.error(res, err, 500);
    }
  }

  // 로비 생성
  async create(req, res) {
    const { tournament_type, max_player, user_id } = req.body;
    const validTypes = ["LAST_16", "QUARTERFINAL", "SEMIFINAL", "FINAL"];

    try {
      // 입력 검증
      if (!tournament_type) {
        return ApiResponse.error(res, new Error("토너먼트 타입이 필요합니다."), 400);
      }

      if (!validTypes.includes(tournament_type)) {
        return ApiResponse.error(res, new Error("유효하지 않은 토너먼트 타입입니다."), 400);
      }

      // 1. 토너먼트 생성
      const tournament = await this.tournamentService.createTournament(tournament_type);

      // 2. 로비 생성 (토너먼트 ID와 생성자 ID 사용)
      const newLobby = await this.lobbyService.createLobby(tournament.id, max_player, user_id);

      return ApiResponse.ok(
        res,
        {
          // tournament,
          lobby: newLobby,
        },
        201
      );
    } catch (err) {
      return ApiResponse.error(res, err, 400);
    }
  }

  // 로비 입장
  async join(req, res) {
    const id = Number(req.params.id);
    const { user_id } = req.body;

    // 입력 검증
    if (!id || isNaN(id)) {
      return ApiResponse.error(res, new Error("유효하지 않은 로비 ID입니다."), 400);
    }

    if (!user_id || isNaN(user_id)) {
      return ApiResponse.error(res, new Error("유효하지 않은 사용자 ID입니다."), 400);
    }

    try {
      const joinedLobby = await this.lobbyService.joinLobby(id, user_id);
      return ApiResponse.ok(res, joinedLobby);
    } catch (err) {
      const statusCode = err.message.includes("존재하지 않는")
        ? 404
        : err.message.includes("가득")
        ? 409
        : err.message.includes("이미")
        ? 409
        : 400;
      return ApiResponse.error(res, err, statusCode);
    }
  }

  // 로비 퇴장
  async left(req, res) {
    const id = Number(req.params.id);
    const { user_id } = req.body;

    // 입력 검증
    if (!id || isNaN(id)) {
      return ApiResponse.error(res, new Error("유효하지 않은 로비 ID입니다."), 400);
    }

    try {
      const leftLobby = await this.lobbyService.leaveLobby(id, user_id);
      return ApiResponse.ok(res, leftLobby);
    } catch (err) {
      const statusCode = err.message.includes("존재하지 않는")
        ? 404
        : err.message.includes("참가하지 않은")
        ? 403
        : 400;
      return ApiResponse.error(res, err, statusCode);
    }
  }

  // 방장 위임
  async authorize(req, res) {
    const lobbyId = Number(req.params.id);
    const { current_user_id, target_user_id } = req.body; // 방장을 위임받을 유저

    // 입력 검증
    if (!lobbyId || isNaN(lobbyId)) {
      return ApiResponse.error(res, new Error("유효하지 않은 로비 ID입니다."), 400);
    }

    if (!target_user_id) {
      return ApiResponse.error(res, new Error("위임받을 유저 ID가 필요합니다."), 400);
    }

    try {
      const authorizedLobby = await this.lobbyService.transferLeadership(lobbyId, current_user_id, target_user_id);
      return ApiResponse.ok(res, authorizedLobby);
    } catch (err) {
      const statusCode = err.message.includes("권한이 없습니다")
        ? 403
        : err.message.includes("존재하지 않는")
        ? 404
        : 400;
      return ApiResponse.error(res, err, statusCode);
    }
  }

  // 레디 상태값 변경
  async ready_state(req, res) {
    const lobbyId = Number(req.params.id);
    const { user_id } = req.body;

    // 입력 검증
    if (!lobbyId || isNaN(lobbyId)) {
      return ApiResponse.error(res, new Error("유효하지 않은 로비 ID입니다."), 400);
    }

    try {
      const readyState = await this.lobbyService.toggleReadyState(lobbyId, user_id);
      return ApiResponse.ok(res, readyState);
    } catch (err) {
      const statusCode = err.message.includes("존재하지 않는")
        ? 404
        : err.message.includes("참가하지 않은")
        ? 403
        : 400;
      return ApiResponse.error(res, err, statusCode);
    }
  }

  // 매칭 생성
  async create_match(req, res) {
    const lobbyId = Number(req.params.id);

    // 입력 검증
    if (!lobbyId || isNaN(lobbyId)) {
      return ApiResponse.error(res, new Error("유효하지 않은 로비 ID입니다."), 400);
    }

    try {
      const createdMatch = await this.lobbyService.createMatch(lobbyId, user_id);
      return ApiResponse.ok(res, createdMatch);
    } catch (err) {
      const statusCode = err.message.includes("권한이 없습니다")
        ? 403
        : err.message.includes("존재하지 않는")
        ? 404
        : err.message.includes("충분하지 않습니다")
        ? 409
        : 400;
      return ApiResponse.error(res, err, statusCode);
    }
  }
}
