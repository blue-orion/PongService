import { AuthManager } from "../../utils/auth";
import { Component } from "../Component";

export class SocialCallbackComponent extends Component {
  destroy(): void {
    // 특별히 정리할 리소스 없음
  }
  async render(): Promise<void> {
    this.clearContainer();
    const params = new URLSearchParams(window.location.search);
    const jwt = params.get("jwt");
    if (jwt) {
      try {
        const tokenData = JSON.parse(jwt);
        // URL을 깔끔하게 바꿔줌 (jwt 안 보이게)
        window.history.replaceState({}, "", "/social-callback");
        AuthManager.saveTokens({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt ?? (Date.now() + 15 * 60 * 1000),
        });
        window.router.navigate("/");
        return;
      } catch (e) {
        // 파싱 실패 시 에러 처리
      }
    }
    this.container.innerHTML = "<div class='error-message'>소셜 로그인에 실패했습니다. 다시 시도해 주세요.</div>";
    setTimeout(() => window.router.navigate("/login"), 2000);
  }
}

