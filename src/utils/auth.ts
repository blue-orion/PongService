// JWT 토큰 관리 유틸리티
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
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('JWT 토큰 디코딩 실패:', error);
      return null;
    }
  }

  // 현재 로그인한 사용자 ID 가져오기
  static getCurrentUserId(): number | null {
    const tokens = this.getTokens();
    if (!tokens?.accessToken) {
      return null;
    }

    const payload = this.decodeJWT(tokens.accessToken);
    return payload?.user_id || payload?.id || payload?.sub || null;
  }

  // 토큰 삭제 (로그아웃)
  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  // 토큰 유효성 검사
  static isTokenValid(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;

    const now = Date.now();
    return now < tokens.expiresAt;
  }

  // 로그인
  static async login(username: string, passwd: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, passwd }),
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
    if (!tokens?.refreshToken) return false;

    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const { accessToken, refreshToken } = await response.json();
      const expiresAt = Date.now() + 15 * 60 * 1000;

      this.saveTokens({
        accessToken,
        refreshToken,
        expiresAt,
      });

      return true;
    } catch (error) {
      console.error("토큰 갱신 실패:", error);
      this.clearTokens();
      return false;
    }
  }

  // 인증이 필요한 API 요청
  static async authenticatedFetch(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
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

    return fetch(url, { ...options, headers });
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
    console.log("🔍 인증 상태 확인 시작");

    // 토큰이 있고 유효한 경우
    if (this.isTokenValid()) {
      console.log("✅ 유효한 토큰 존재");
      return true;
    }

    console.log("❌ 유효한 토큰 없음");

    // 토큰은 있지만 만료된 경우 갱신 시도
    const tokens = this.getTokens();
    if (tokens) {
      console.log("🔄 토큰 갱신 시도");
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        console.log("✅ 토큰 갱신 성공");
        return true;
      }
      console.log("❌ 토큰 갱신 실패");
    } else {
      console.log("❌ 저장된 토큰 없음");
    }

    return false;
  }

  // 로그아웃
  static logout(): void {
    this.clearTokens();
    this.redirectToLogin();
  }

  // 인증 상태 확인 및 리다이렉트
  static async checkAuthAndRedirect(): Promise<boolean> {
    console.log("🔍 인증 상태 확인 시작");

    // 토큰이 있고 유효한 경우
    if (this.isTokenValid()) {
      console.log("✅ 유효한 토큰 존재");
      return true;
    }

    console.log("❌ 유효한 토큰 없음");

    // 토큰은 있지만 만료된 경우 갱신 시도
    const tokens = this.getTokens();
    if (tokens) {
      console.log("🔄 토큰 갱신 시도");
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        console.log("✅ 토큰 갱신 성공");
        return true;
      }
      console.log("❌ 토큰 갱신 실패");
    } else {
      console.log("❌ 저장된 토큰 없음");
    }

    // 인증 실패 시 로그인 페이지로 리다이렉트
    console.log("🔄 로그인 페이지로 리다이렉트");
    this.redirectToLogin();
    return false;
  }
}
