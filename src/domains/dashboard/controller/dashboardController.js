import dashboardService from "#domains/dashboard/service/dashboardService.js";
import { ApiResponse } from "#shared/api/response.js";

const dashboardController = {
  // GET /v1/dashboard/rank
  async getRankHandler(request, reply) {
    const { page = 1, pageSize = 10 } = request.query;
    const userRanks = await dashboardService.getRankData(Number(page), Number(pageSize));
    return ApiResponse.ok(reply, userRanks);
  },
};
export default dashboardController;
