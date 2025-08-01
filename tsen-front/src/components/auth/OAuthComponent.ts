import { AuthManager } from "../../utils/auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface OAuthResult {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  message?: string;
}

export class OAuthComponent {
  private static readonly GOOGLE_OAUTH_URL = "/v1/auth/google";
  private static readonly FORTYTWO_OAUTH_URL = "/v1/auth/42";

  /**
   * Google OAuth 로그인 처리 (서버의 Fastify OAuth2 플러그인 사용)
   */
  static async loginWithGoogle(): Promise<OAuthResult> {
    return this.handleOAuthLogin(this.GOOGLE_OAUTH_URL, "Google");
  }

  /**
   * 42 OAuth 로그인 처리 (Google과 동일한 팝업 방식)
   */
  static async loginWith42(): Promise<OAuthResult> {
    return this.handleOAuthLogin(this.FORTYTWO_OAUTH_URL, "42");
  }

  /**
   * 공통 OAuth 로그인 처리 로직
   */
  private static async handleOAuthLogin(url: string, provider: string): Promise<OAuthResult> {
    try {
      const result = await this.openOAuthPopup(url);

      if (result.success && result.data) {
        // 토큰 저장
        const expiresAt = result.data.expiresAt || Date.now() + 15 * 60 * 1000;

        AuthManager.saveTokens({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
          expiresAt: expiresAt,
        });

        // 친구 컴포넌트 초기화
        if ((window as any).app) {
          await (window as any).app.initializeFriendComponent();
        }

        return {
          success: true,
          data: result.data,
        };
      } else {
        return {
          success: false,
          message: result.message || `${provider} 로그인에 실패했습니다.`,
        };
      }
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error);
      return {
        success: false,
        message: `${provider} 로그인 중 오류가 발생했습니다.`,
      };
    }
  }

  /**
   * OAuth 팝업 열기 및 결과 대기
   */
  private static openOAuthPopup(url: string): Promise<{ success: boolean; data?: any; message?: string }> {
    return new Promise((resolve) => {
      let resolved = false;

      // OAuth 콜백에서 결과를 받기 위한 이벤트 리스너 등록
      const messageListener = (event: MessageEvent) => {
        if (event.data && event.data.type === "OAUTH_RESULT") {
          if (resolved) {
            return;
          }

          resolved = true;
          clearInterval(checkClosedInterval);
          window.removeEventListener("message", messageListener);

          if (event.data.success) {
            resolve({
              success: true,
              data: event.data.data,
            });
          } else {
            resolve({
              success: false,
              message: event.data.message || "인증에 실패했습니다.",
            });
          }
        }
      };

      window.addEventListener("message", messageListener);

      const popup = window.open(url, "google-oauth", "width=500,height=600,scrollbars=yes,resizable=yes");

      if (!popup) {
        window.removeEventListener("message", messageListener);
        resolve({ success: false, message: "팝업을 열 수 없습니다." });
        return;
      }

      const checkClosedInterval = setInterval(() => {
        if (popup.closed && !resolved) {
          resolved = true;
          clearInterval(checkClosedInterval);
          window.removeEventListener("message", messageListener);
          resolve({
            success: false,
            message: "사용자가 인증을 취소했습니다.",
          });
        }
      }, 5000); // 5초로 변경하여 서버 응답 시간 충분히 확보
    });
  }
}
