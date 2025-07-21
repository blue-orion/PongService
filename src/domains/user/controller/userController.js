import { ApiResponse } from "#shared/api/response.js";

import UpdatePasswordDto from "#domains/user/model/updatePasswordDto.js";
import UpdateProfileDto from "#domains/user/model/updateProfileDto.js";
import UserHelpers from "#domains/user/utils/userHelpers.js";
import UserService from "#domains/user/service/userService.js";

const userHelpers = new UserHelpers();
const userService = new UserService();

const userController = {
  // GET /v1/users/profile/:id
  async getUserProfileByIdHandler(request, reply) {
    const id = Number(request.params.id);
    userHelpers.validateParamUserId(id);

    const profile = await userService.getProfileById(id);
    return ApiResponse.ok(reply, profile);
  },

  // PUT /v1/users/update
  async updateMyPageHandler(request, reply) {
    const user = request.user;
    const updateProfileDto = new UpdateProfileDto(request.body);
    userHelpers.validateUpdateMyPageForm(updateProfileDto);

    await userService.updateUserNickname(user, updateProfileDto.nickname);
    await userService.updateUserProfileImage(user, updateProfileDto.profileImage);
    return ApiResponse.ok(reply, { message: "User profile updated successfully" });
  },

  // PUT /v1/users/update/password
  async updatePasswordHandler(request, reply) {
    const user = request.user;
    const updatePasswordDto = new UpdatePasswordDto(request.body);
    userHelpers.validateUpdatePasswordForm(updatePasswordDto);

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

  // GET /v1/users/status/:userId
  async getUserStatusHandler(request, reply) {
    const userId = Number(request.params.userId);
    const status = await UserService.getUserStatus(userId);
    return ApiResponse.ok(reply, { status });
  },

  // PUT /v1/users/status/:userId
  async updateUserStatusHandler(request, reply) {
    const userId = Number(request.params.userId);
    const { status } = request.body;
    await UserService.updateUserStatus(userId, status);
    return ApiResponse.ok(reply, { message: "User status updated successfully" });
  },
};
export default userController;
