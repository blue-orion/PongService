// JWT 토큰 관리 유틸리티
import { UserManager } from "./user";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
  error: string | null;
}

export class AuthManager {
  private static readonly ACCESS_TOKEN_KEY = "pong_access_token";
  private static readonly REFRESH_TOKEN_KEY = "pong_refresh_token";
  private static readonly EXPIRES_AT_KEY = "pong_expires_at";
  // private static readonly API_BASE_URL = "http://localhost:3333/v1"; // 백엔드 서버 URL
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // 토큰 저장
  static saveTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(this.EXPIRES_AT_KEY, tokens.expiresAt.toString());

    // JWT에서 사용자 정보 추출하여 UserManager로 저장
    try {
      const payload = this.decodeJWT(tokens.accessToken);

      // 다양한 필드명 시도
      const userId = payload?.id || payload?.user_id || payload?.userId || payload?.sub;
      const username = payload?.username || payload?.user_name || payload?.name || payload?.userName;

      if (userId && username) {
        UserManager.saveUserInfo({
          id: String(userId), // 숫자일 수 있으므로 문자열로 변환
          username: String(username),
        });
      }
    } catch (e) {
      console.error("JWT에서 사용자 정보 추출 실패:", e);
    }
  }

  // 토큰 가져오기
  static getTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);

    if (!accessToken || !refreshToken || !expiresAt) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
      expiresAt: parseInt(expiresAt),
    };
  }

  // JWT 토큰 디코딩
  static decodeJWT(token: string): any {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("JWT 토큰 디코딩 실패:", error);
      return null;
    }
  }

  // 현재 로그인한 사용자 ID 가져오기
  static getCurrentUserId(): string | null {
    const tokens = this.getTokens();
    if (!tokens?.accessToken) {
      return null;
    }

    const payload = this.decodeJWT(tokens.accessToken);
    const userId = payload?.user_id || payload?.id || payload?.sub || null;
    return userId ? String(userId) : null;
  }

  // 토큰 삭제 (로그아웃)
  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
    // 사용자 정보도 함께 삭제
    UserManager.clearUserInfo();
  }

  // 토큰 유효성 검사
  static isTokenValid(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;

    const now = Date.now();
    return now < tokens.expiresAt;
  }

  // 로그인
  static async login(username: string, passwd: string, token?: string): Promise<LoginResponse> {
    try {
      const requestBody: any = { username, passwd };
      if (token) {
        requestBody.token = token;
      }

      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "로그인에 실패했습니다.");
      }

      const loginData: LoginResponse = await response.json();

      // 토큰 만료 시간 계산 (15분 후)
      const expiresAt = Date.now() + 15 * 60 * 1000;

      this.saveTokens({
        accessToken: loginData.data.accessToken,
        refreshToken: loginData.data.refreshToken,
        expiresAt,
      });

      return loginData;
    } catch (error) {
      console.error("로그인 오류:", error);
      throw error;
    }
  }

  // 토큰 갱신
  static async refreshAccessToken(): Promise<boolean> {
    const tokens = this.getTokens();
    if (!tokens?.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokens.refreshToken}`,
        },
      });

      if (!response.ok) {
        // 401/403이면 refresh token이 만료된 것이므로 로그아웃
        if (response.status === 401 || response.status === 403) {
          this.clearTokens();
        }
        return false;
      }

      const responseData = await response.json();

      // 응답 구조 확인 및 적응적 처리
      let newAccessToken: string;
      let newRefreshToken: string;

      // 백엔드 응답 구조에 따라 적응적으로 처리
      if (responseData.data) {
        // { data: { accessToken, refreshToken } } 구조
        newAccessToken = responseData.data.accessToken;
        newRefreshToken = responseData.data.refreshToken || tokens.refreshToken; // refresh token이 갱신되지 않을 수도 있음
      } else if (responseData.accessToken) {
        // { accessToken, refreshToken } 구조
        newAccessToken = responseData.accessToken;
        newRefreshToken = responseData.refreshToken || tokens.refreshToken;
      } else {
        console.error("[AuthManager] 예상하지 못한 응답 구조:", responseData);
        return false;
      }

      if (!newAccessToken) {
        return false;
      }

      const expiresAt = Date.now() + 15 * 60 * 1000;

      this.saveTokens({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      });

      return true;
    } catch (error) {
      console.error("[AuthManager] 토큰 갱신 중 예외 발생:", error);
      this.clearTokens();
      return false;
    }
  }

  // 인증이 필요한 API 요청
  static async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    let tokens = this.getTokens();

    // 토큰이 없으면 로그인 페이지로 리다이렉트
    if (!tokens) {
      this.redirectToLogin();
      throw new Error("인증이 필요합니다.");
    }

    // 토큰이 만료되었으면 갱신 시도
    if (!this.isTokenValid()) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) {
        this.redirectToLogin();
        throw new Error("토큰 갱신에 실패했습니다.");
      }
      tokens = this.getTokens()!;
    }

    // Authorization 헤더 추가
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${tokens.accessToken}`,
    };

    const response = await fetch(url, { ...options, headers });

    // 401 응답이면 토큰이 무효화된 것일 수 있으므로 한 번 더 갱신 시도
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // 갱신된 토큰으로 재요청
        const newTokens = this.getTokens()!;
        const newHeaders = {
          ...options.headers,
          Authorization: `Bearer ${newTokens.accessToken}`,
        };
        return fetch(url, { ...options, headers: newHeaders });
      } else {
        this.redirectToLogin();
        throw new Error("토큰 갱신에 실패했습니다.");
      }
    }

    return response;
  }

  // 로그인 페이지로 리다이렉트 (SPA용)
  static redirectToLogin(): void {
    if (window.router) {
      window.router.navigate("/login");
    } else {
      window.location.href = "/login.html";
    }
  }

  // 순수한 인증 상태 확인 (리다이렉트 없음)
  static async checkAuth(): Promise<boolean> {
    // 토큰이 있고 유효한 경우
    if (this.isTokenValid()) {
      return true;
    }

    // 토큰은 있지만 만료된 경우 갱신 시도
    const tokens = this.getTokens();
    if (tokens) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return true;
      }
    }

    return false;
  }

  // 로그아웃
  static async logout(): Promise<void> {
    const tokens = this.getTokens();

    // 백엔드 로그아웃 API 호출
    if (tokens?.accessToken) {
      try {
        const userId = this.getCurrentUserId();
        const response = await fetch(`${this.API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({ id: userId }),
        });

        if (response.ok) {
          console.log("✅ 백엔드 로그아웃 성공");
        } else {
          console.warn("⚠️ 백엔드 로그아웃 실패:", response.status, response.statusText);
          try {
            const errorData = await response.text();
            console.warn("응답 내용:", errorData);

            // JSON 응답인지 확인하고 파싱 시도
            try {
              const jsonData = JSON.parse(errorData);
              if (jsonData.success === false && response.status === 500) {
                console.warn("서버 내부 오류이지만 로그아웃 처리는 진행됩니다.");
              }
            } catch (parseError) {
              console.warn("JSON 파싱 실패:", parseError);
            }
          } catch (e) {
            console.warn("응답 내용 읽기 실패");
          }
        }
      } catch (error) {
        console.error("❌ 로그아웃 API 호출 실패:", error);
      }
    }

    // 로컬 토큰 삭제 및 리다이렉트
    this.clearTokens();
    this.redirectToLogin();
  }

  // 인증 상태 확인 및 리다이렉트
  static async checkAuthAndRedirect(): Promise<boolean> {
    // 토큰이 있고 유효한 경우
    if (this.isTokenValid()) {
      return true;
    }

    // 토큰은 있지만 만료된 경우 갱신 시도
    const tokens = this.getTokens();
    if (tokens) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        return true;
      }
    }

    // 인증 실패 시 로그인 페이지로 리다이렉트
    this.redirectToLogin();
    return false;
  }
}
