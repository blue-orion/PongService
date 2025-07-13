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

//비밀번호 변경
//닉네임, 프로필, 이미지 변경
//내 정보, 다른 유저 정보
//enable 상태 확인
