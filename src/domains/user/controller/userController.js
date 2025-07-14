import userService from "#domains/user/service/userService.js";
import UpdatePasswordDto from "#domains/user/model/updatePasswordDto.js";
import { ApiResponse } from "#shared/api/response.js";

const userController = {
  // GET /v1/users/profile/id/:id
  async getUserProfileByIdHandler(request, reply) {
    const { id } = request.params;
    const profile = await userService.getProfileById(id);
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
    const { nickname } = request.body;
    await userService.updateUserNickname(user, nickname);
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
};
export default userController;

//비밀번호 변경
//닉네임, 프로필, 이미지 변경
//내 정보, 다른 유저 정보
//enable 상태 확인
