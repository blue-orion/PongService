import prisma from "#shared/database/prisma.js";
import { LobbyStatus } from "@prisma/client";

export class LobbyRepository {
  getCount(filters = {}) {
    const whereCondition = {
      lobby_status: {
        not: LobbyStatus.COMPLETED
      }
    };

    // status 필터가 있으면 추가
    if (filters.status) {
      if (filters.status === 'playing') {
        whereCondition.lobby_status = LobbyStatus.STARTED;
      } else if (filters.status === 'waiting') {
        whereCondition.lobby_status = LobbyStatus.PENDING;
      }
    }

    // search 필터가 있으면 추가 (로비 ID 검색)
    if (filters.search) {
      const searchId = parseInt(filters.search);
      if (!isNaN(searchId)) {
        whereCondition.id = searchId;
      }
    }

    return prisma.lobby.count({
      where: whereCondition
    });
  }

  async findAll(skip, take, filters = {}) {
    const whereCondition = {
      lobby_status: {
        not: LobbyStatus.COMPLETED
      }
    };

    // status 필터가 있으면 추가
    if (filters.status) {
      if (filters.status === 'playing') {
        whereCondition.lobby_status = LobbyStatus.STARTED;
      } else if (filters.status === 'waiting') {
        whereCondition.lobby_status = LobbyStatus.PENDING;
      }
    }

    // search 필터가 있으면 추가 (로비 ID 검색)
    if (filters.search) {
      const searchId = parseInt(filters.search);
      if (!isNaN(searchId)) {
        whereCondition.id = searchId;
      }
    }

    const lobbies = await prisma.lobby.findMany({
      skip,
      take,
      where: whereCondition,
      orderBy: [
        {
          lobby_status: "asc", // PENDING이 STARTED보다 먼저 오도록
        },
        {
          created_at: "desc", // 같은 상태 내에서는 최신순
        }
      ],
      include: {
        lobby_players: { include: { user: true } },
        tournament: true,
        creator: true, // creator 정보 포함
      },
    });

    // creator 정보가 이미 include되어 있으므로 별도 조회 불필요
    return lobbies;
  }

  async findById(id) {
    const lobby = await prisma.lobby.findUnique({
      where: { id: parseInt(id) },
      include: {
        lobby_players: { include: { user: true } },
        tournament: true,
      },
    });

    if (lobby) {
      // 생성자 정보를 별도로 조회
      lobby.creator = await prisma.user.findUnique({
        where: { id: lobby.creator_id },
        select: { id: true, nickname: true, username: true },
      });
    }

    return lobby;
  }

  async create(tournament_id, max_player, creator_id) {
    const lobby = await prisma.lobby.create({
      data: {
        tournament_id,
        max_player,
        lobby_status: "PENDING",
        creator_id,
      },
      include: {
        lobby_players: {
          include: { user: true },
        },
        tournament: true,
      },
    });

    // 생성자 정보를 별도로 조회
    lobby.creator = await prisma.user.findUnique({
      where: { id: creator_id },
      select: { id: true, nickname: true, username: true },
    });

    return lobby;
  }

  async countPlayers(lobby_id) {
    return await prisma.lobbyPlayer.count({
      where: { lobby_id, enabled: true },
    });
  }

  async addOrReactivatePlayer(lobby_id, user_id, is_leader) {
    // 기존 레코드 찾기
    const existingPlayer = await this.findExistingPlayer(lobby_id, user_id);

    if (existingPlayer) {
      // 기존 레코드가 있으면 재활성화
      return await prisma.lobbyPlayer.update({
        where: { id: existingPlayer.id },
        data: {
          enabled: true,
          is_leader,
          is_ready: false, // 재입장 시 준비 상태 초기화
          updated_at: new Date(),
        },
        include: { user: true },
      });
    } else {
      // 기존 레코드가 없으면 새로 생성
      return await prisma.lobbyPlayer.create({
        data: {
          lobby_id,
          user_id,
          is_leader,
          enabled: true,
          is_ready: false,
        },
        include: { user: true },
      });
    }
  }

  async removePlayer(lobby_id, user_id) {
    return await prisma.lobbyPlayer.updateMany({
      where: { lobby_id, user_id },
      data: { enabled: false },
    });
  }

  // 기존 플레이어 레코드 찾기 (enabled 상관없이)
  async findExistingPlayer(lobby_id, user_id) {
    return await prisma.lobbyPlayer.findFirst({
      where: { lobby_id, user_id },
    });
  }

  async findActiveLobbyByUserId(user_id) {
    return await prisma.lobbyPlayer.findFirst({
      where: {
        user_id: user_id,
        enabled: true,
        lobby: {
          enabled: true,
        },
      },
      include: {
        lobby: true,
      },
    });
  }

  // 활성화된 플레이어만 확인
  async isPlayerAlreadyInLobby(lobby_id, user_id) {
    const existing = await prisma.lobbyPlayer.findFirst({
      where: { lobby_id, user_id, enabled: true },
    });
    return Boolean(existing);
  }

  async updateLobbyStatus(lobby_id, status) {
    return await prisma.lobby.update({
      where: { id: lobby_id },
      data: { lobby_status: status },
    });
  }

  async updateMaxPlayer(lobby_id, max_player) {
    return await prisma.lobby.update({
      where: { id: lobby_id },
      data: { max_player },
    });
  }

  async transferLeadership(lobby_id, current_leader_id, target_user_id) {
    return await prisma.$transaction(async (tx) => {
      // 1. 현재 방장의 is_leader를 false로 변경
      await tx.lobbyPlayer.updateMany({
        where: {
          lobby_id,
          user_id: current_leader_id,
        },
        data: {
          is_leader: false,
          updated_at: new Date(),
        },
      });

      // 2. 새로운 방장의 is_leader를 true로 변경
      await tx.lobbyPlayer.updateMany({
        where: {
          lobby_id,
          user_id: target_user_id,
        },
        data: {
          is_leader: true,
          updated_at: new Date(),
        },
      });

      // 3. 로비의 creator_id도 변경
      await tx.lobby.update({
        where: { id: lobby_id },
        data: {
          creator_id: target_user_id,
          updated_at: new Date(),
        },
      });

      // 4. 업데이트된 로비 정보 반환
      return await tx.lobby.findUnique({
        where: { id: lobby_id },
      });
    });
  }

  async checkUserExists(user_id) {
    if (!user_id) {
      return false; // 유효하지 않은 ID라면 false 반환
    }

    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });

    return Boolean(!user);
  }

  // 플레이어 준비 상태 토글
  async togglePlayerReadyState(lobby_id, user_id) {
    // 현재 준비 상태 조회
    const currentPlayer = await prisma.lobbyPlayer.findFirst({
      where: {
        lobby_id,
        user_id,
        enabled: true,
      },
    });

    if (!currentPlayer) {
      throw new Error("해당 플레이어가 로비에 참가하지 않았습니다.");
    }

    // 준비 상태 반전
    await prisma.lobbyPlayer.updateMany({
      where: {
        lobby_id,
        user_id,
        enabled: true,
      },
      data: {
        is_ready: !currentPlayer.is_ready,
        updated_at: new Date(),
      },
    });

    return await prisma.lobbyPlayer.findFirst({
      where: {
        lobby_id,
        user_id,
        enabled: true,
      },
    });
  }

  // 모든 플레이어 준비 상태 확인
  async areAllPlayersReady(lobby_id) {
    // 활성화된 모든 플레이어 조회
    const players = await prisma.lobbyPlayer.findMany({
      where: {
        lobby_id,
        enabled: true,
      },
      select: {
        is_ready: true,
        is_leader: true,
      },
    });

    // 플레이어가 없으면 false
    if (players.length === 0) {
      return false;
    }

    // 모든 플레이어가 준비 상태인지 확인
    return players.every((player) => player.is_ready);
  }

  async findActivePlayersByLobbyId(lobby_id) {
    return await prisma.lobbyPlayer.findMany({
      where: {
        lobby_id,
        enabled: true, // 활성화된 플레이어만 조회
      },
      include: {
        user: true, // 사용자 정보도 포함
      },
    });
  }

  async areWinnersReady(lobbyId, winners) {
    const winnerIds = winners.map((w) => w.user_id);

    const readyWinnersCount = await prisma.lobbyPlayer.count({
      where: {
        lobby_id: lobbyId,
        user_id: { in: winnerIds },
        is_ready: true,
        enabled: true,
      },
    });

    return readyWinnersCount === winners.length;
  }

  /**
   * STARTED 상태이면서 활성 플레이어가 0명인 로비들 조회
   * @returns {Array} 빈 STARTED 로비 목록
   */
  async findEmptyStartedLobbies() {
    const lobbies = await prisma.lobby.findMany({
      where: {
        lobby_status: LobbyStatus.STARTED,
      },
      include: {
        lobby_players: {
          where: {
            enabled: true, // 활성 플레이어만 조회
          },
        },
      },
    });

    // 활성 플레이어가 0명인 로비만 필터링
    return lobbies.filter(lobby => lobby.lobby_players.length === 0);
  }

  /**
   * 로비의 모든 비활성 플레이어들을 완전히 제거
   * @param {number} lobbyId - 로비 ID
   */
  async removeAllPlayersInLobby(lobbyId) {
    await prisma.lobbyPlayer.deleteMany({
      where: {
        lobby_id: lobbyId,
      },
    });
  }
}
