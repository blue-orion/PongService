import userService from "#domains/user/service/userService.js";
import { ApiResponse } from "#shared/api/response.js";

const userController = {
  // GET /v1/auth/me
  async meHandler(request, reply) {
    const user = await userService.getMe(request.user);
    return ApiResponse.ok(reply, user);
  },
};

export default userController;
