import dashboardRepo from "#domains/dashboard/repo/dashboardRepo.js";

const dashboardService = {
  async getRankData() {
    return dashboardRepo.getRankData();
  },
};

export default dashboardService;
