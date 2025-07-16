import prisma from "#shared/database/prisma.js";

const dashboardRepo = {
  async getRankData() {
    return prisma.user.findMany({
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
        win_rate: "desc",
      },
    });
  },
};

export default dashboardRepo;
