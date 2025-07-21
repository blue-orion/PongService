import PongException from "#shared/exception/pongException.js";

class AuthHelpers {
  validateLoginForm(formData) {
    if (!formData.username || !formData.passwd) {
      throw PongException.BAD_REQUEST;
    }
  }

  validateLogoutForm(formData) {
    if (!formData.userId) {
      throw PongException.BAD_REQUEST;
    }
  }

  validateRegisterForm(formData) {
    this.validateUsername(formData.username);
    this.validatePasswd(formData.passwd, formData.confirmPasswd);
    this.validateNickname(formData.nickname);
    this.validateProfileImage(formData.profile_image);
  }

  validateUsername(username) {
    if (!username) {
      throw new PongException("Username is required", 400);
    }
    if (!username || username.length < 3 || username.length > 20) {
      throw new PongException("Username must be between 3 and 20 characters long", 400);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new PongException("Username can only contain letters, numbers, and underscores", 400);
    }
  }

  validatePasswd(passwd, confirmPasswd) {
    if (!passwd) {
      throw new PongException("Password is required", 400);
    }
    if (passwd.length < 6 || passwd.length > 12) {
      throw new PongException("Password must be between 6 and 12 characters long", 400);
    }
    if (!/[a-z]/.test(passwd) || !/[A-Z]/.test(passwd) || !/[0-9]/.test(passwd) || !/[^a-zA-Z0-9]/.test(passwd)) {
      throw new PongException("Password must include lowercase, uppercase, number, and special character", 400);
    }
    if (passwd !== confirmPasswd) {
      throw new PongException("Passwords do not match", 400);
    }
  }

  validateNickname(nickname) {
    if (!nickname) {
      throw new PongException("Nickname is required", 400);
    }
    if (nickname.length < 3 || nickname.length > 20) {
      throw new PongException("Nickname must be between 3 and 20 characters long", 400);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(nickname)) {
      throw new PongException("Nickname can only contain letters, numbers, and underscores", 400);
    }
  }

  validateProfileImage(profileImage) {
    if (!profileImage) {
      return;
    }
    if (typeof profileImage !== "string") {
      throw new PongException("Profile image must be a string URL", 400);
    }
    if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/.test(profileImage)) {
      throw new PongException("Profile image must be a valid URL ending with .jpg, .jpeg, .png, or .gif", 400);
    }
  }

  async validateHashedPasswd(loginPasswd, userPasswd, encryptUtils) {
    if (await encryptUtils.confirmPasswd(loginPasswd, userPasswd)) {
      throw new PongException("invalid password", 400);
    }
  }

  validateUserEnable(user) {
    if (!user.enabled) {
      throw PongException.UNAUTHORIZED;
    }
  }

  validateUserRefreshToken(user, refreshToken) {
    if (user?.refreshToken !== refreshToken) {
      throw PongException.UNAUTHORIZED;
    }
  }

  validate2FASetupForm(formData) {
    if (!formData.username) {
      throw new PongException("Username is required for 2FA setup", 400);
    }
  }

  validate2FAVerifyForm(formData) {
    if (!formData.username || !formData.token) {
      throw new PongException("Username and token are required for 2FA verification", 400);
    }
    if (formData.token.length !== 6 || !/^\d+$/.test(formData.token)) {
      throw new PongException("Token must be a 6-digit number", 400);
    }
  }

  validate2FASecretForm(formData) {
    this.validate2FASecret(formData.secret);
    this.validate2FAOtpauthUrl(formData.otpauthUrl);
    this.validate2FAQRCodeDataURL(formData.qrCodeDataURL);
  }

  validate2FASecret(secret) {
    if (!secret || secret.length !== 32) {
      throw new PongException("Invalid 2FA secret", 400);
    }
    if (!/^[A-Z2-7]+=*$/.test(secret)) {
      throw new PongException("2FA secret must be a valid base32 string", 400);
    }
  }

  validate2FAOtpauthUrl(otpauthUrl) {
    if (!otpauthUrl || !otpauthUrl.startsWith("otpauth://totp/")) {
      throw new PongException("Invalid otpauth URL", 400);
    }
    const urlParts = new URL(otpauthUrl);
    if (!urlParts.searchParams.has("secret")) {
      throw new PongException("otpauth URL must contain a 'secret' parameter", 400);
    }
  }

  validate2FAQRCodeDataURL(qrCodeDataURL) {
    if (!qrCodeDataURL || !qrCodeDataURL.startsWith("data:image/png;base64,")) {
      throw new PongException("Invalid QR code data URL", 400);
    }
    const base64Data = qrCodeDataURL.split(",")[1];
    if (!base64Data || base64Data.length < 100) {
      throw new PongException("QR code data URL is too short", 400);
    }
  }

  validate2FAToken(verified) {
    if (!verified) {
      throw new PongException("Invalid 2FA code", 400);
    }
  }
}

export default AuthHelpers;
