import { describe, jest, beforeEach, it, expect } from "@jest/globals";
import { ApiResponse } from "#shared/api/response.js";
import { LobbyController } from "#domains/lobby/controller/lobbyController.js";
import { LobbyService } from "#domains/lobby/service/lobbyService.js";
import { TournamentService } from "#domains/lobby/service/tournamentService.js";

const mockLobbyRepository = {
  findById: jest.fn(),
  isPlayerAlreadyInLobby: jest.fn(),
  countPlayers: jest.fn(),
  addOrReactivatePlayer: jest.fn(),
};

const mockLobbyService = {
  join: jest.fn(),
};

// Fixture
const fixtures = {};
