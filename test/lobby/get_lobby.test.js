import { describe, jest, beforeEach, it, expect } from "@jest/globals";
import { ApiResponse } from "#shared/api/response.js";
import { LobbyController } from "#domains/lobby/controller/lobbyController.js";
import { LobbyService } from "#domains/lobby/service/lobbyService.js";

const mockLobbyRepository = {
  findAll: jest.fn(),
};

describe("로비 조회 Test 케이스", () => {
  let lobbyService;
  let lobbyController;

  let mockReq;
  let mockRes;

  beforeEach(() => {
    lobbyService = new LobbyService(mockLobbyRepository);
    lobbyController = new LobbyController(lobbyService);

    mockReq = {
      params: {},
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
  });

  describe("정상 케이스", () => {
    it("Query param 없는 상태로 조회", async () => {
      //   mock.params = {};

      const result = await lobbyController.getAll(mockReq, mockRes);

      console.log(result);
    });
  });
});
