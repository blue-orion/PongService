import { describe, jest, beforeEach, it, expect } from "@jest/globals";
import { ApiResponse } from "#shared/api/response.js";
import { LobbyController } from "#domains/lobby/controller/lobbyController.js";
import { LobbyService } from "#domains/lobby/service/lobbyService.js";
import { TournamentService } from "#domains/lobby/service/tournamentService.js";

const mockTournamentRepository = {
  findById: jest.fn(),
  create: jest.fn(),
};

const mockLobbyRepository = {
  findById: jest.fn(),
  isPlayerAlreadyInLobby: jest.fn(),
  countPlayers: jest.fn(),
  addOrReactivatePlayer: jest.fn(),
};

const mockLobbyService = {
  joinLobby: jest.fn(),
};

const mockTournamentService = {
  createTournament: jest.fn(),
};

// Fixture
const fixtures = {
  validLobby: {
    id: 1,
    tournament_id: 1,
    creator_id: 100,
    max_player: 4,
    lobby_status: "PENDING",
    created_at: new Date(),
    updated_at: new Date(),
    enabled: true,
    tournament: {
      id: 1,
      tournament_type: "SEMIFINAL",
      tournament_status: "PENDING",
      created_at: new Date(),
      updated_at: new Date(),
      enabled: true,
    },
    lobby_players: [],
  },
  playingLobby: {
    id: 2,
    tournament_id: 1,
    creator_id: 100,
    max_player: 4,
    lobby_status: "PLAYING",
    created_at: new Date(),
    updated_at: new Date(),
    enabled: true,
  },
  fullLobby: {
    id: 3,
    tournament_id: 1,
    creator_id: 100,
    max_player: 2,
    lobby_status: "PENDING",
    created_at: new Date(),
    updated_at: new Date(),
    enabled: true,
  },
  validUser: {
    id: 100,
    username: "testuser",
    created_at: new Date(),
    updated_at: new Date(),
    enabled: true,
  },
  validLobbyPlayer: {
    id: 1,
    lobby_id: 1,
    user_id: 100,
    is_ready: false,
    is_leader: false,
    created_at: new Date(),
    updated_at: new Date(),
    enabled: true,
    user: {
      id: 100,
      username: "testuser",
      created_at: new Date(),
      updated_at: new Date(),
      enabled: true,
    },
  },
  reactivatedLobbyPlayer: {
    id: 2,
    lobby_id: 1,
    user_id: 101,
    is_ready: false,
    is_leader: false,
    created_at: new Date(),
    updated_at: new Date(),
    enabled: true,
    user: {
      id: 101,
      username: "reactivateduser",
      created_at: new Date(),
      updated_at: new Date(),
      enabled: true,
    },
  },
};

describe("로비 입장 Test 케이스", () => {
  let lobbyService;
  let tournamentService;
  let lobbyController;

  let mockReq;
  let mockRes;

  let lobby_id;
  let user_id;

  beforeEach(() => {
    tournamentService = new TournamentService(mockTournamentRepository);
    lobbyService = new LobbyService(mockLobbyRepository, mockTournamentRepository);
    lobbyController = new LobbyController(lobbyService, tournamentService);

    mockReq = {
      params: {},
      body: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // ApiResponse mock 설정
    jest.spyOn(ApiResponse, "ok").mockImplementation((res, data, status) => {
      return res.status(status || 200).json({
        success: true,
        data,
      });
    });

    jest.spyOn(ApiResponse, "error").mockImplementation((res, error, status) => {
      return res.status(status || 500).json({
        success: false,
        error: error.message,
      });
    });

    // 응답 미리 설정
    mockLobbyRepository.findById.mockResolvedValue(fixtures.validLobby);
    mockLobbyRepository.isPlayerAlreadyInLobby.mockResolvedValue(false);
    mockLobbyRepository.countPlayers.mockResolvedValue(2);
    mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);
  });

  describe("정상 케이스", () => {
    it("새로운 플레이어 로비 입장에 성공하면 res 200", async () => {
      lobby_id = 1;
      user_id = 100;

      mockReq.params.id = lobby_id.toString();
      mockReq.body = {
        user_id: user_id,
      };

      mockLobbyRepository.findById.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.isPlayerAlreadyInLobby.mockResolvedValue(false);
      mockLobbyRepository.countPlayers.mockResolvedValue(2);
      mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);

      const result = await lobbyController.join(mockReq, mockRes);

      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.isPlayerAlreadyInLobby).toHaveBeenCalledWith(lobby_id, user_id);
      expect(mockLobbyRepository.countPlayers).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(lobby_id, user_id, false);

      expect(result).toEqual(mockRes, fixtures.validLobbyPlayer, 200);
    });

    it("기존 플레이어 재입장에 성공하면 res 200", async () => {
      lobby_id = 1;
      user_id = 101;

      mockReq.params.id = lobby_id.toString();
      mockReq.body = {
        user_id: user_id,
      };

      mockLobbyRepository.findById.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.isPlayerAlreadyInLobby.mockResolvedValue(false);
      mockLobbyRepository.countPlayers.mockResolvedValue(2);
      mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.reactivatedLobbyPlayer);

      const result = await lobbyController.join(mockReq, mockRes);

      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.isPlayerAlreadyInLobby).toHaveBeenCalledWith(lobby_id, user_id);
      expect(mockLobbyRepository.countPlayers).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(lobby_id, user_id, false);

      expect(result).toEqual(mockRes, fixtures.reactivatedLobbyPlayer, 200);
    });

    it("최대 인원 직전 입장에 성공하면 res 200", async () => {
      lobby_id = 1;
      user_id = 100;

      mockReq.params.id = lobby_id.toString();
      mockReq.body = {
        user_id: user_id,
      };

      mockLobbyRepository.findById.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.isPlayerAlreadyInLobby.mockResolvedValue(false);
      mockLobbyRepository.countPlayers.mockResolvedValue(3); // 최대 4명 중 3명
      mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);

      const result = await lobbyController.join(mockReq, mockRes);

      expect(mockLobbyRepository.countPlayers).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(lobby_id, user_id, false);

      expect(result).toEqual(mockRes, fixtures.validLobbyPlayer, 200);
    });
  });

  describe("유효성 에러 케이스", () => {
    it("로비 ID가 없으면 400 에러", async () => {
      mockReq.params.id = "";
      mockReq.body = { user_id: 100 };

      const result = await lobbyController.join(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(mockRes, new Error("유효하지 않은 로비 ID입니다."), 400);
    });

    it("로비 ID가 NaN이면 400 에러", async () => {
      mockReq.params.id = "invalid";
      mockReq.body = { user_id: 100 };

      const result = await lobbyController.join(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(mockRes, new Error("유효하지 않은 로비 ID입니다."), 400);
    });

    it("사용자 ID가 없으면 400 에러", async () => {
      mockReq.params.id = "1";
      mockReq.body = {};

      const result = await lobbyController.join(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(mockRes, new Error("유효하지 않은 사용자 ID입니다."), 400);
    });

    it("사용자 ID가 NaN이면 400 에러", async () => {
      mockReq.params.id = "1";
      mockReq.body = { user_id: "invalid" };

      const result = await lobbyController.join(mockReq, mockRes);

      expect(ApiResponse.error).toHaveBeenCalledWith(mockRes, new Error("유효하지 않은 사용자 ID입니다."), 400);
    });

    it("존재하지 않는 로비 ID면 404 에러", async () => {
      lobby_id = 999;
      user_id = 100;

      mockReq.params.id = lobby_id.toString();
      mockReq.body = { user_id: user_id };

      mockLobbyRepository.findById.mockResolvedValue(null);

      await expect(lobbyService.joinLobby(lobby_id, user_id)).rejects.toThrow("존재하지 않는 로비입니다.");

      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.isPlayerAlreadyInLobby).not.toHaveBeenCalled();
      expect(mockLobbyRepository.countPlayers).not.toHaveBeenCalled();
      expect(mockLobbyRepository.addOrReactivatePlayer).not.toHaveBeenCalled();
    });

    it("이미 시작된 로비면 409 에러", async () => {
      lobby_id = 2;
      user_id = 100;

      mockReq.params.id = lobby_id.toString();
      mockReq.body = { user_id: user_id };

      mockLobbyRepository.findById.mockResolvedValue(fixtures.playingLobby);

      await expect(lobbyService.joinLobby(lobby_id, user_id)).rejects.toThrow("이미 시작된 로비입니다.");

      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.isPlayerAlreadyInLobby).not.toHaveBeenCalled();
      expect(mockLobbyRepository.countPlayers).not.toHaveBeenCalled();
      expect(mockLobbyRepository.addOrReactivatePlayer).not.toHaveBeenCalled();
    });

    it("이미 해당 로비에 참가 중이면 409 에러", async () => {
      lobby_id = 1;
      user_id = 100;

      mockReq.params.id = lobby_id.toString();
      mockReq.body = { user_id: user_id };

      mockLobbyRepository.findById.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.isPlayerAlreadyInLobby.mockResolvedValue(true);

      await expect(lobbyService.joinLobby(lobby_id, user_id)).rejects.toThrow("이미 해당 로비에 참가 중입니다.");

      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.isPlayerAlreadyInLobby).toHaveBeenCalledWith(lobby_id, user_id);
      expect(mockLobbyRepository.countPlayers).not.toHaveBeenCalled();
      expect(mockLobbyRepository.addOrReactivatePlayer).not.toHaveBeenCalled();
    });

    it("로비 인원이 가득 찼으면 409 에러", async () => {
      lobby_id = 3;
      user_id = 100;

      mockReq.params.id = lobby_id.toString();
      mockReq.body = { user_id: user_id };

      mockLobbyRepository.findById.mockResolvedValue(fixtures.fullLobby);
      mockLobbyRepository.isPlayerAlreadyInLobby.mockResolvedValue(false);
      mockLobbyRepository.countPlayers.mockResolvedValue(2); // max_player가 2인 로비에 2명

      await expect(lobbyService.joinLobby(lobby_id, user_id)).rejects.toThrow("로비 인원이 가득 찼습니다.");

      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.isPlayerAlreadyInLobby).toHaveBeenCalledWith(lobby_id, user_id);
      expect(mockLobbyRepository.countPlayers).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.addOrReactivatePlayer).not.toHaveBeenCalled();
    });
  });

  describe("db 조건 에러 케이스", () => {
    it("로비 정보 조회 중 db 에러", async () => {
      lobby_id = 1;
      user_id = 100;

      const dbError = new Error("Database connection failed");
      mockLobbyRepository.findById.mockRejectedValue(dbError);

      await expect(lobbyService.joinLobby(lobby_id, user_id)).rejects.toThrow("Database connection failed");

      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.isPlayerAlreadyInLobby).not.toHaveBeenCalled();
    });

    it("플레이어 중복 확인 중 db 에러", async () => {
      lobby_id = 1;
      user_id = 100;

      mockLobbyRepository.findById.mockResolvedValue(fixtures.validLobby);

      const dbError = new Error("Player check failed");
      mockLobbyRepository.isPlayerAlreadyInLobby.mockRejectedValue(dbError);

      await expect(lobbyService.joinLobby(lobby_id, user_id)).rejects.toThrow("Player check failed");

      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.isPlayerAlreadyInLobby).toHaveBeenCalledWith(lobby_id, user_id);
    });

    it("플레이어 수 확인 중 db 에러", async () => {
      lobby_id = 1;
      user_id = 100;

      mockLobbyRepository.findById.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.isPlayerAlreadyInLobby.mockResolvedValue(false);

      const dbError = new Error("Player count failed");
      mockLobbyRepository.countPlayers.mockRejectedValue(dbError);

      await expect(lobbyService.joinLobby(lobby_id, user_id)).rejects.toThrow("Player count failed");

      expect(mockLobbyRepository.countPlayers).toHaveBeenCalledWith(lobby_id);
    });

    it("플레이어 추가 중 db 에러", async () => {
      lobby_id = 1;
      user_id = 100;

      mockLobbyRepository.findById.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.isPlayerAlreadyInLobby.mockResolvedValue(false);
      mockLobbyRepository.countPlayers.mockResolvedValue(2);

      const dbError = new Error("Player addition failed");
      mockLobbyRepository.addOrReactivatePlayer.mockRejectedValue(dbError);

      await expect(lobbyService.joinLobby(lobby_id, user_id)).rejects.toThrow("Player addition failed");

      expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(lobby_id, user_id, false);
    });
  });

  describe("엣지 케이스", () => {
    it("null / undefined 입력 처리", async () => {
      await expect(lobbyService.joinLobby(null, 100)).rejects.toThrow();
      await expect(lobbyService.joinLobby(1, undefined)).rejects.toThrow();
      await expect(lobbyService.joinLobby(null, null)).rejects.toThrow();
    });

    it("number 타입이 아닌 입력 처리", async () => {
      lobby_id = "1";
      user_id = "100";

      mockLobbyRepository.findById.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.isPlayerAlreadyInLobby.mockResolvedValue(false);
      mockLobbyRepository.countPlayers.mockResolvedValue(2);
      mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);

      const result = await lobbyService.joinLobby(lobby_id, user_id);

      expect(result).toEqual(fixtures.validLobbyPlayer);
      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(lobby_id, user_id, false);
    });

    it("음수 ID 입력 처리", async () => {
      lobby_id = -1;
      user_id = -100;

      mockLobbyRepository.findById.mockResolvedValue(null);

      await expect(lobbyService.joinLobby(lobby_id, user_id)).rejects.toThrow("존재하지 않는 로비입니다.");

      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
    });

    it("0 ID 입력 처리", async () => {
      lobby_id = 0;
      user_id = 0;

      mockLobbyRepository.findById.mockResolvedValue(null);

      await expect(lobbyService.joinLobby(lobby_id, user_id)).rejects.toThrow("존재하지 않는 로비입니다.");

      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
    });
  });

  describe("e2e 정상 케이스", () => {
    it("전체 로비 입장 플로우 성공", async () => {
      lobby_id = 1;
      user_id = 100;

      mockReq.params.id = lobby_id.toString();
      mockReq.body = { user_id: user_id };

      // 모든 단계별 mock 설정
      mockLobbyRepository.findById.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.isPlayerAlreadyInLobby.mockResolvedValue(false);
      mockLobbyRepository.countPlayers.mockResolvedValue(2);
      mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);

      const result = await lobbyController.join(mockReq, mockRes);

      // 모든 단계가 순서대로 실행되는지 확인
      expect(mockLobbyRepository.findById).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.isPlayerAlreadyInLobby).toHaveBeenCalledWith(lobby_id, user_id);
      expect(mockLobbyRepository.countPlayers).toHaveBeenCalledWith(lobby_id);
      expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(lobby_id, user_id, false);

      expect(ApiResponse.ok).toHaveBeenCalledWith(mockRes, fixtures.validLobbyPlayer);
    });
  });
});
