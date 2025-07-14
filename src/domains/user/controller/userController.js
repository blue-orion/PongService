import userService from "#domains/user/service/userService.js";
import { ApiResponse } from "#shared/api/response.js";

const userController = {
  // PUT /v1/users/update/:id
  async updateMyPageHandler(request, reply) {
    console.log("Updating user profile for ID:", request.params.id);
    console.log("Updating user profile for ID:", request.user.userId);

    const { nickname } = request.body;
    await userService.updateUserProfile(request.params.id, request.user.userId, nickname);
    return ApiResponse.ok(reply, { message: "User profile updated successfully" });
  },

  // GET /v1/users/profile/:username

  // GET /v1/users/profile/:id

  // GET /v1/users/myinfo/:username
};

export default userController;
