import prisma from "#shared/database/prisma.js";

const dashboardRepo = {
  async getRankData(pageable) {
    return prisma.user.findMany({
      skip: pageable.skip,
      take: pageable.take,
      select: {
        id: true,
        username: true,
        nickname: true,
        profile_image: true,
        total_wins: true,
        total_loses: true,
        win_rate: true,
      },
      orderBy: {
        [pageable.sort]: pageable.order,
      },
    });
  },
};

export default dashboardRepo;
