import { describe, jest, beforeEach, it, expect } from '@jest/globals';
// import { PrismaClient } from '@prisma/client';
// import { mockDeep } from 'jest-mock-extended';
import { ApiResponse } from "#shared/api/response.js";
import { LobbyController } from '#domains/lobby/controller/lobbyController.js';
import { LobbyService } from '#domains/lobby/service/lobbyService.js';
import { TournamentService } from '#domains/lobby/service/tournamentService.js';

// // Mocks
// const mockPrisma = mockDeep();

const mockTournamentRepository = {
    findById: jest.fn(),
    create: jest.fn()
};

const mockLobbyRepository = {
    create: jest.fn(),
    addOrReactivatePlayer: jest.fn(),
    findById: jest.fn()
};

// Fixture
const fixtures = {
    validTournament: {
        id: 1,
        tournament_type: 'SEMIFINAL',
        tournament_status: 'PENDING',
        created_at: new Date(),
        updated_at: new Date(),
        enabled: true
    },
    validLobby: {
        id: 1,
        tournament_id: 1,
        max_player: 4,
        lobby_status: 'PENDING',
        creator_id: 100,
        created_at: new Date(),
        updated_at: new Date(),
        enabled: true
    },
    validLobbyPlayer: {
        id: 1,
        lobby_id: 1,
        user_id: 100,
        is_ready: false,
        is_leader: true,
        created_at: new Date(),
        updated_at: new Date(),
        enabled: true
    }
};

describe('로비 생성 Test 케이스', () => {
    let lobbyController;
    let mockReq;
    let mockRes;

    beforeEach(() => {
        const tournamentService = new TournamentService(mockTournamentRepository);
        const lobbyService = new LobbyService(mockLobbyRepository, mockTournamentRepository);
        lobbyController = new LobbyController(lobbyService, tournamentService);

        mockReq = {
            body: {}
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        // ApiResponse mock 설정
        jest.spyOn(ApiResponse, 'ok').mockImplementation((res, data, status) => {
            return res.status(status || 200).json({
                success: true,
                data
            });
        });

        jest.spyOn(ApiResponse, 'error').mockImplementation((res, error, status) => {
            return res.status(status || 500).json({
                success: false,
                error: error.message
            });
        });

        // 응답 미리 설정
        mockTournamentRepository.create.mockResolvedValue(fixtures.validTournament);
        mockTournamentRepository.findById.mockResolvedValue(fixtures.validTournament);
        mockLobbyRepository.create.mockResolvedValue(fixtures.validLobby);
        mockLobbyRepository.addOrReactivatePlayer.mockResolvedValue(fixtures.validLobbyPlayer);
    });

    it('방 생성에 성공하면 res 201', async () => {
        mockReq.body = {
            tournament_type: 'SEMIFINAL',
            max_player: 4,
            user_id: 100
        };

        await lobbyController.create(mockReq, mockRes);

        expect(mockTournamentRepository.create).toHaveBeenCalledWith('SEMIFINAL');
        expect(mockLobbyRepository.create).toHaveBeenCalledWith(1, 4, 100);
        expect(mockLobbyRepository.addOrReactivatePlayer).toHaveBeenCalledWith(1, 100, true);

        expect(ApiResponse.ok).toHaveBeenCalledWith(
            mockRes,
            {
                tournament: fixtures.validTournament,
                lobby: fixtures.validLobby
            },
            201
        );
    });
});
