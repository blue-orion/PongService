import DashboardRepo from "#domains/dashboard/repo/dashboardRepo.js";

class DashboardService {
  constructor(dashboardRepo = new DashboardRepo()) {
    this.dashboardRepo = dashboardRepo;
  }
  async getRankData(pageable) {
    return this.dashboardRepo.getRankData(pageable);
  }
}

export default DashboardService;
