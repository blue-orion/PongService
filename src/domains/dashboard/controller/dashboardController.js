import dashboardService from "#domains/dashboard/service/dashboardService.js";
import { ApiResponse } from "#shared/api/response.js";

const dashboardController = {
  // GET /v1/dashboard/rank
  async getRankHandler(request, reply) {
    const userRanks = await dashboardService.getRankData();
    return ApiResponse.ok(reply, userRanks);
  },
};
export default dashboardController;
