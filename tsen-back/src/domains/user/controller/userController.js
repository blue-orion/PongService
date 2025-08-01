import { ApiResponse } from "#shared/api/response.js";
import PageRequest from "#shared/page/PageRequest.js";
import PageResponse from "#shared/page/PageResponse.js";

import UpdatePasswordDto from "#domains/user/model/updatePasswordDto.js";
import UpdateProfileDto from "#domains/user/model/updateProfileDto.js";
import UserHelpers from "#domains/user/utils/userHelpers.js";
import UserService from "#domains/user/service/userService.js";

const userHelpers = new UserHelpers();
const userService = new UserService();

const userController = {
  // GET /v1/users/profile/:id
  async getUserProfileByIdHandler(request, reply) {
    const userId = Number(request.params.id);
    userHelpers.validateParamUserId(userId);

    const profile = await userService.getProfileById(userId);
    return ApiResponse.ok(reply, profile);
  },

  // PUT /v1/users/update
  async updateMyPageHandler(request, reply) {
    const userId = Number(request.user.id);
    const updateProfileDto = new UpdateProfileDto(request.body);

    await userService.updateUserNickname(userId, updateProfileDto.nickname);
    await userService.updateUserProfileImage(userId, updateProfileDto.profileImage);

    await userService.broadcastCurrentUserProfile(userId);
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

  // GET /v1/users/status/:id
  async getUserStatusHandler(request, reply) {
    const userId = Number(request.params.id);
    userHelpers.validateParamUserId(userId);

    const status = await userService.getUserStatus(userId);
    return ApiResponse.ok(reply, { status });
  },

  // PUT /v1/users/status/:id
  async updateUserStatusHandler(request, reply) {
    const userId = Number(request.params.id);
    userHelpers.validateParamUserId(userId);

    const formData = { status: request.body.status };
    userHelpers.validateUserStatusForm(formData);

    await userService.updateUserStatus(userId, formData.status);
    return ApiResponse.ok(reply, { message: "User status updated successfully" });
  },

  // GET /v1/users/records/:id
  async getUserGameRecordsHandler(request, reply) {
    const userId = Number(request.params.id);
    userHelpers.validateParamUserId(userId);

    const pageable = PageRequest.of(request.query).orderBy("created_at", "desc");
    const records = await userService.getUserGameRecords(userId, pageable);
    return ApiResponse.ok(reply, PageResponse.of(pageable, records));
  },

  // GET /v1/users/summary/:id
  async getUserSummaryHandler(request, reply) {
    const userId = Number(request.params.id);
    userHelpers.validateParamUserId(userId);

    const summary = await userService.getUserSummary(userId);
    return ApiResponse.ok(reply, summary);
  },
};
export default userController;
