import dashboardRepo from "#domains/dashboard/repo/dashboardRepo.js";

const dashboardService = {
  async getRankData(page, pageSize) {
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    return dashboardRepo.getRankData(skip, take);
  },
};

export default dashboardService;
