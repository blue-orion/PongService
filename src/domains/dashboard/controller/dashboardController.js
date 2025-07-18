import dashboardService from "#domains/dashboard/service/dashboardService.js";
import { ApiResponse } from "#shared/api/response.js";
import PageRequest from "#shared/page/PageRequest.js";
import PageResponse from "#shared/page/PageResponse.js";

const dashboardController = {
  // GET /v1/dashboard/rank
  async getRankHandler(request, reply) {
    const pageable = PageRequest.of(request.query).orderBy("win_rate");
    const userRanks = await dashboardService.getRankData(pageable);
    return ApiResponse.ok(reply, PageResponse.of(pageable, userRanks));
  },
};
export default dashboardController;
