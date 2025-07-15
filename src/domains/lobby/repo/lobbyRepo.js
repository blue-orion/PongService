import prisma from "#shared/database/prisma.js";

export class LobbyRepository {
  async findAll(skip, take) {
    return await prisma.lobby.findMany({
      skip,
      take,
      orderBy: {
        created_at: "desc", // 최신순 정렬 등 필요시
      },
      include: {
        lobby_players: { include: { user: true } },
        tournament: true,
      },
    });
  }

  async findById(id) {
    return await prisma.lobby.findUnique({
      where: { id },
      include: {
        lobby_players: { include: { user: true } },
        tournament: true,
      },
    });
  }

  async create(tournament_id, max_player, creator_id) {
    return await prisma.lobby.create({
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

  async transferLeadership(lobbyId, currentLeaderId, targetUserId) {
    return await prisma.$transaction(async (tx) => {
      // 1. 현재 방장의 is_leader를 false로 변경
      await tx.lobbyPlayer.updateMany({
        where: {
          lobby_id: lobbyId,
          user_id: currentLeaderId,
          enabled: true,
        },
        data: {
          is_leader: false,
          updated_at: new Date(),
        },
      });

      // 2. 새로운 방장의 is_leader를 true로 변경
      await tx.lobbyPlayer.updateMany({
        where: {
          lobby_id: lobbyId,
          user_id: targetUserId,
          enabled: true,
        },
        data: {
          is_leader: true,
          updated_at: new Date(),
        },
      });

      // 3. 로비의 creator_id도 변경
      await tx.lobby.update({
        where: { id: lobbyId },
        data: {
          creator_id: targetUserId,
          updated_at: new Date(),
        },
      });

      // 4. 업데이트된 로비 정보 반환
      return await tx.lobby.findUnique({
        where: { id: lobbyId },
        include: {
          lobby_players: {
            where: { enabled: true },
            include: { user: true },
          },
          tournament: true,
        },
      });
    });
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
    return await prisma.lobbyPlayer.updateMany({
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

  // 초기 매칭 생성 (게임 도메인과 연동 필요)
  async createInitialMatches(lobby_id) {
    // 게임 도메인의 서비스와 연동하여 초기 매칭 생성
    // 이 부분은 Game 도메인과 협력하여 구현 필요
    throw new Error("매칭 생성 기능은 게임 도메인과 연동하여 구현 예정입니다.");
  }
}
