import PongException from "#shared/exception/pongException.js";

class UserHelpers {
  validateParamUserId(id) {
    if (!id || isNaN(Number(id)) || Number(id) <= 0) {
      throw new PongException("Invalid or missing user id", 400);
    }
  }

  validateUpdateMyPageForm(formData) {
    if (!formData.nickname && !formData.profileImage) {
      throw new PongException("At least one field (nickname or profile image) must be provided", 400);
    }
  }

  validateUpdateNickname(nickname) {
    if (!nickname) {
      return;
    }
    if (nickname.length < 3 || nickname.length > 20) {
      throw new PongException("Nickname must be between 3 and 20 characters long", 400);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
      throw new PongException("Nickname can only contain letters, numbers, and underscores", 400);
    }
  }

  validateUpdateProfileImage(profileImage) {
    if (!profileImage) {
      return;
    }
    if (typeof profileImage !== "string") {
      throw new PongException("Profile image must be a string URL", 400);
    }
    // data URL 또는 HTTP URL 둘 다 허용
    if (!/^(https?:\/\/.+\.(jpg|jpeg|png|gif)|data:image\/(jpeg|jpg|png|gif);base64,.+)$/.test(profileImage)) {
      throw new PongException("Profile image must be a valid URL or data URL", 400);
    }
  }

  validateUpdatePasswordForm(formData) {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmNewPassword) {
      throw new PongException("All password fields are required", 400);
    }
    this.validateUpdateNewPassword(formData.newPassword, formData.confirmNewPassword);
  }

  validateUpdateNewPassword(newPassword, confirmNewPassword) {
    if (newPassword.length < 6 || newPassword.length > 12) {
      throw new PongException("New password must be between 6 and 12 characters long", 400);
    }
    if (
      !/[a-z]/.test(newPassword) ||
      !/[A-Z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[^a-zA-Z0-9]/.test(newPassword)
    ) {
      throw new PongException("New password must include lowercase, uppercase, number, and special character", 400);
    }
    if (newPassword !== confirmNewPassword) {
      throw new PongException("New password and confirmation do not match", 400);
    }
  }

  validateUserStatusForm(formData) {
    if (!formData.status) {
      throw new PongException("Status is required", 400);
    }
    const validStatuses = ["OFFLINE", "ONLINE", "PLAYING"];
    if (!validStatuses.includes(formData.status)) {
      throw new PongException(`Invalid status. Valid statuses are: ${validStatuses.join(", ")}`, 400);
    }
  }

  validateExistingUser(user) {
    if (!user) {
      throw new PongException("User not found", 404);
    }
  }
}
export default UserHelpers;
