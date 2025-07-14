import userService from "#domains/user/service/userService.js";
import { ApiResponse } from "#shared/api/response.js";

const userController = {
  // GET /v1/auth/me
  async meHandler(request, reply) {
    const user = await userService.getMe(request.user);
    return ApiResponse.ok(reply, user);
  },

  // GET /v1/users/profile/:username

  // GET /v1/users/profile/:id

  // GET /v1/users/myinfo/:username

  // PUT /v1/users/update/:username
};

export default userController;
