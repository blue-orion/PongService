import userService from "#domains/user/service/userService.js";
import { ApiResponse } from "#shared/api/response.js";

const userController = {
  // GET /v1/users/profile/id/:id
  async getUserProfileByIdHandler(request, reply) {
    const { id } = request.params;
    const userId = request.user.id;
    const profile = await userService.getProfileById(userId, id);
    return ApiResponse.ok(reply, profile);
  },

  // GET /v1/users/profile/username/:username
  async getUserProfileByUsernameHandler(request, reply) {
    const { username } = request.params;
    const userId = request.user.id;
    console.log("username", username);
    const profile = await userService.getProfileByUsername(userId, username);
    return ApiResponse.ok(reply, profile);
  },

  // GET /v1/users/profile/nickname/:nickname
  async getUserProfileByNicknameHandler(request, reply) {
    const { nickname } = request.params;
    const userId = request.user.id;
    const profile = await userService.getProfileByNickname(userId, nickname);
    return ApiResponse.ok(reply, profile);
  },

  // GET /v1/users/myinfo
  async getMyInfoHandler(request, reply) {
    const user = request.user;
    const myInfo = await userService.getProfileById(user, user.id);
    return ApiResponse.ok(reply, myInfo);
  },

  // PUT /v1/users/update/:id
};

export default userController;

//비밀번호 변경
//닉네임, 프로필, 이미지 변경
//내 정보, 다른 유저 정보
//enable 상태 확인
