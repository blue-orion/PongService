import userRepo from "#domains/user/repo/userRepo.js";

const userService = {
  async updateUserProfile(userId, requestUserId, nickname) {
    if (userId != requestUserId) {
      throw new Error("Unauthorized to update this user profile");
    }
    const user = await userRepo.getUserById(requestUserId);
    await userRepo.updateUserProfile(user.id, nickname);
  },
};

export default userService;
