import UserService from "#domains/user/service/userService.js";
import UpdatePasswordDto from "#domains/user/model/updatePasswordDto.js";
import { ApiResponse } from "#shared/api/response.js";

const userController = {
  // GET /v1/users/profile/:id
  async getUserProfileByIdHandler(request, reply) {
    const id = Number(request.params.id);
    const profile = await UserService.getProfileById(id);
    return ApiResponse.ok(reply, profile);
  },

  // PUT /v1/users/update
  async updateMyPageHandler(request, reply) {
    const user = request.user;
    const { nickname, profileImage } = request.body;
    await UserService.updateUserNickname(user, nickname);
    await UserService.updateUserProfileImage(user, profileImage);
    return ApiResponse.ok(reply, { message: "User profile updated successfully" });
  },

  // PUT /v1/users/update/password
  async updatePasswordHandler(request, reply) {
    const user = request.user;
    const updatePasswordDto = new UpdatePasswordDto(request.body);
    const encryptUtils = await request.server.encryptUtils;
    await UserService.updateUserPassword(user, updatePasswordDto, encryptUtils);
    return ApiResponse.ok(reply, { message: "Password updated successfully" });
  },

  // DELETE /v1/users/disable
  async disableUserHandler(request, reply) {
    const userId = request.user.id;
    await UserService.disableUser(userId);
    return ApiResponse.ok(reply, { message: "User account disabled successfully" });
  },
};
export default userController;
