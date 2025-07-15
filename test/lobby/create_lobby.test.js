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
  create: jest.fn(),
  addOrReactivatePlayer: jest.fn(),
  findById: jest.fn(),
};

const mockLobbyService = {
  createLobby: jest.fn(),
};

const mockTournamentService = {
  createTournament: jest.fn(),
};

// Fixture
const fixtures = {
  validTournament: {
    id: 1,
    tournament_type: "SEMIFINAL",
    tournament_status: "PENDING",
    created_at: new Date(),
    updated_at: new Date(),
    enabled: true,
  },
  activeTournament: {
    id: 2,
    tournament_type: "SEMIFINAL",
    tournament_status: "IN_PROGRESS",
    created_at: new Date(),
    updated_at: new Date(),
    enabled: true,
  },
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
  validUser: {
    id: 100,
    username: "testtest",
    created_at: new Date(),
    updated_at: new Date(),
    enabled: true,
  },
  validLobbyPlayer: {
    id: 1,
    lobby_id: 1,
    user_id: 100,
    is_ready: false,
    is_leader: true,
    created_at: new Date(),
    updated_at: new Date(),
    enabled: true,
  },
};

describe("로비 생성 Test 케이스", () => {
  let lobbyService;
  let tournamentService;

  let lobbyController;

  let mockReq;
  let mockRes;

  let tournament_id;
  let tournament_type;
  let max_player;
  let user_id;

  beforeEach(() => {
    tournamentService = new TournamentService(mockTournamentRepository);
    lobbyService = new LobbyService(mockLobbyRepository, mockTournamentRepository);

    lobbyController = new LobbyController(lobbyService, tournamentService);

    mockReq = {
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
    mockTournamentRepository.create.mockResolvedValue(fixtures.validTournament);
    mockTournamentRepository.findById.mockResolvedValue(fixtures.validTournament);
    mockLobbyRepository.create.mockResolvedValue(fixtures.validLobby);
    mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);
  });

  describe("정상 케이스", () => {
    it("FINAL 생성에 성공하면 res 201", async () => {
      tournament_id = 1;
      tournament_type = "FINAL";
      max_player = 2;
      user_id = 100;

      mockReq.body = {
        tournament_type: tournament_type,
        max_player: max_player,
        user_id: user_id,
      };

      mockTournamentRepository.findById.mockResolvedValue(fixtures.validTournament);
      mockLobbyRepository.create.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);

      const result = await lobbyController.create(mockReq, mockRes);

      expect(mockTournamentRepository.create).toHaveBeenCalledWith(tournament_type);
      expect(mockLobbyRepository.create).toHaveBeenCalledWith(tournament_id, max_player, user_id);
      expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(tournament_id, user_id, true);

      expect(result).toEqual(
        mockRes,
        {
          lobby: fixtures.validLobby,
        },
        201
      );
    });
    it("SEMIFINAL 생성에 성공하면 res 201", async () => {
      tournament_id = 1;
      tournament_type = "SEMIFINAL";
      max_player = 4;
      user_id = 100;

      mockReq.body = {
        tournament_type: tournament_type,
        max_player: max_player,
        user_id: user_id,
      };

      mockTournamentRepository.findById.mockResolvedValue(fixtures.validTournament);
      mockLobbyRepository.create.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);

      const result = await lobbyController.create(mockReq, mockRes);

      expect(mockTournamentRepository.create).toHaveBeenCalledWith(tournament_type);
      expect(mockLobbyRepository.create).toHaveBeenCalledWith(tournament_id, max_player, user_id);
      expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(tournament_id, user_id, true);

      expect(result).toEqual(
        mockRes,
        {
          lobby: fixtures.validLobby,
        },
        201
      );
    });
    it("QUARTERFINAL 생성에 성공하면 res 201", async () => {
      tournament_id = 1;
      tournament_type = "QUARTERFINAL";
      max_player = 8;
      user_id = 100;

      mockReq.body = {
        tournament_type: tournament_type,
        max_player: max_player,
        user_id: user_id,
      };

      mockTournamentRepository.findById.mockResolvedValue(fixtures.validTournament);
      mockLobbyRepository.create.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);

      const result = await lobbyController.create(mockReq, mockRes);

      expect(mockTournamentRepository.create).toHaveBeenCalledWith(tournament_type);
      expect(mockLobbyRepository.create).toHaveBeenCalledWith(tournament_id, max_player, user_id);
      expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(tournament_id, user_id, true);

      expect(result).toEqual(
        mockRes,
        {
          lobby: fixtures.validLobby,
        },
        201
      );
    });
    it("LAST_16 생성에 성공하면 res 201", async () => {
      tournament_id = 1;
      tournament_type = "LAST_16";
      max_player = 16;
      user_id = 100;

      mockReq.body = {
        tournament_type: tournament_type,
        max_player: max_player,
        user_id: user_id,
      };

      mockTournamentRepository.findById.mockResolvedValue(fixtures.validTournament);
      mockLobbyRepository.create.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);

      const result = await lobbyController.create(mockReq, mockRes);

      expect(mockTournamentRepository.create).toHaveBeenCalledWith(tournament_type);
      expect(mockLobbyRepository.create).toHaveBeenCalledWith(tournament_id, max_player, user_id);
      expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(tournament_id, user_id, true);

      expect(result).toEqual(
        mockRes,
        {
          lobby: fixtures.validLobby,
        },
        201
      );
    });
  });

  describe("유효성 에러 케이스", () => {
    it("존재하지 않는 토너먼트 id", async () => {
      tournament_id = 999;
      tournament_type = "SEMIFINAL";
      max_player = 4;
      user_id = 100;

      mockReq.body = {
        tournament_type: tournament_type,
        max_player: max_player,
        user_id: user_id,
      };

      mockTournamentRepository.findById.mockResolvedValue(null);

      await expect(lobbyService.createLobby(tournament_id, max_player, user_id)).rejects.toThrow(
        "해당 토너먼트를 찾을 수 없습니다."
      );

      expect(mockTournamentRepository.findById).toHaveBeenCalledWith(tournament_id);
      expect(mockLobbyRepository.create).not.toHaveBeenCalled();
      expect(mockLobbyRepository.addOrReactivatePlayer).not.toHaveBeenCalled();
    });
    it("IN_PROGRESS (이미 시작한) 토너먼트", async () => {
      tournament_id = 2;
      tournament_type = "SEMIFINAL";
      max_player = 4;
      user_id = 100;

      mockReq.body = {
        tournament_type: tournament_type,
        max_player: max_player,
        user_id: user_id,
      };

      mockTournamentRepository.findById.mockResolvedValue(fixtures.activeTournament);

      await expect(lobbyService.createLobby(tournament_id, max_player, user_id)).rejects.toThrow(
        "이미 시작된 토너먼트입니다."
      );

      expect(mockTournamentRepository.findById).toHaveBeenCalledWith(tournament_id);
      expect(mockLobbyRepository.create).not.toHaveBeenCalled();
      expect(mockLobbyRepository.addOrReactivatePlayer).not.toHaveBeenCalled();
    });
    it("COMPLETED (이미 종료된) 토너먼트", async () => {
      tournament_id = 1;
      tournament_type = "SEMIFINAL";
      max_player = 4;
      user_id = 100;

      mockReq.body = {
        tournament_type: tournament_type,
        max_player: max_player,
        user_id: user_id,
      };

      const completedTournament = {
        ...fixtures.validTournament,
        tournament_status: "COMPLETED",
      };

      mockTournamentRepository.findById.mockResolvedValue(completedTournament);

      await expect(lobbyService.createLobby(tournament_id, max_player, user_id)).rejects.toThrow(
        "이미 시작된 토너먼트입니다."
      );
    });
  });

  describe("db 조건 에러 케이스", () => {
    it("토너먼트 db 정보 조회 에러", async () => {
      tournament_id = 1;
      tournament_type = "SEMIFINAL";
      max_player = 4;
      user_id = 100;

      const dbError = new Error("Database connection failed");
      mockTournamentRepository.findById.mockRejectedValue(dbError);

      await expect(lobbyService.createLobby(tournament_id, max_player, user_id)).rejects.toThrow(
        "Database connection failed"
      );
    });
    it("로비 생성 중 db 에러", async () => {
      tournament_id = 1;
      tournament_type = "SEMIFINAL";
      max_player = 4;
      user_id = 100;

      mockTournamentRepository.findById.mockResolvedValue(fixtures.validTournament);

      const dbError = new Error("Lobby creation failed");
      mockLobbyRepository.create.mockRejectedValue(dbError);

      await expect(lobbyService.createLobby(tournament_id, max_player, user_id)).rejects.toThrow(
        "Lobby creation failed"
      );
    });
    it("로비 생성 중 db 에러", async () => {
      tournament_id = 1;
      tournament_type = "SEMIFINAL";
      max_player = 4;
      user_id = 100;

      mockTournamentRepository.findById.mockResolvedValue(fixtures.validTournament);

      const dbError = new Error("Lobby creation failed");
      mockLobbyRepository.create.mockRejectedValue(dbError);

      await expect(lobbyService.createLobby(tournament_id, max_player, user_id)).rejects.toThrow(
        "Lobby creation failed"
      );
    });
    it("로비 생성 중 방생성자(최초방장) 추가시 db 에러", async () => {
      tournament_id = 1;
      tournament_type = "SEMIFINAL";
      max_player = 4;
      user_id = 100;

      mockTournamentRepository.findById.mockResolvedValue(fixtures.validTournament);
      mockLobbyRepository.create.mockResolvedValue(fixtures.validLobby);

      const dbError = new Error("Player addition failed");
      mockLobbyRepository.addOrReactivatePlayer.mockRejectedValue(dbError);

      // Act & Assert
      await expect(lobbyService.createLobby(tournament_id, max_player, user_id)).rejects.toThrow(
        "Player addition failed"
      );
    });
  });

  describe("엣지 케이스", () => {
    it("null / undefined 입력 처리", async () => {
      await expect(lobbyService.createLobby(null, 4, 100)).rejects.toThrow();

      await expect(lobbyService.createLobby(1, undefined, 100)).rejects.toThrow();

      await expect(lobbyService.createLobby(1, 4, null)).rejects.toThrow();
    });
    it("number 타입이 아닌 입력 처리", async () => {
      tournament_id = "1";
      tournament_type = "SEMIFINAL";
      max_player = "4";
      user_id = "100";

      mockTournamentRepository.findById.mockResolvedValue(fixtures.validTournament);
      mockLobbyRepository.create.mockResolvedValue(fixtures.validLobby);
      mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);

      const result = await lobbyService.createLobby(tournament_id, max_player, user_id);

      expect(result).toEqual(fixtures.validLobby);
    });
  });

  describe("e2e 정상 케이스", () => {});
});
