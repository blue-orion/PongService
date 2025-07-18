import dashboardRepo from "#domains/dashboard/repo/dashboardRepo.js";

const dashboardService = {
  async getRankData(pageable) {
    return dashboardRepo.getRankData(pageable);
  },
};

export default dashboardService;
