import userService from "#domains/user/service/userService.js";
import UpdatePasswordDto from "#domains/user/model/updatePasswordDto.js";
import { ApiResponse } from "#shared/api/response.js";

const userController = {
  // GET /v1/users/profile/id/:id
  async getUserProfileByIdHandler(request, reply) {
    const { id } = request.params;
    const profile = await userService.getProfileById(parseInt(id));
    return ApiResponse.ok(reply, profile);
  },

  // GET /v1/users/myinfo
  async getMyInfoHandler(request, reply) {
    const userId = request.user.id;
    const myInfo = await userService.getProfileById(userId);
    return ApiResponse.ok(reply, myInfo);
  },

  // PUT /v1/users/update
  async updateMyPageHandler(request, reply) {
    const user = request.user;
    const { nickname, profileImage } = request.body;
    await userService.updateUserNickname(user, nickname);
    await userService.updateUserProfileImage(user, profileImage);
    return ApiResponse.ok(reply, { message: "User profile updated successfully" });
  },

  // PUT /v1/users/update/password
  async updatePasswordHandler(request, reply) {
    const user = request.user;
    const updatePasswordDto = new UpdatePasswordDto(request.body);
    const encryptUtils = await request.server.encryptUtils;
    await userService.updateUserPassword(user, updatePasswordDto, encryptUtils);
    return ApiResponse.ok(reply, { message: "Password updated successfully" });
  },

  // DELETE /v1/users/disable
  async disableUserHandler(request, reply) {
    const userId = request.user.id;
    await userService.disableUser(userId);
    return ApiResponse.ok(reply, { message: "User account disabled successfully" });
  },
};
export default userController;
