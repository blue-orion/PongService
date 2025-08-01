import { Component } from "../Component";
import { UserManager } from "../../utils/user";
import { AuthManager } from "../../utils/auth";
import { friendService } from "../../utils/friendService";
import { FriendDataManager } from "../friend/FriendDataManager";
import { UserProfileManager } from "../friend/UserProfileManager";

export class UserInfoComponent extends Component {
  private userId: string;
  private username: string = ""; // 해당 사용자의 username 저장
  private friendDataManager: FriendDataManager | null = null;
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  constructor(container: HTMLElement, userId: string) {
    super(container);
    this.userId = userId;
  }

  async render(): Promise<void> {
    this.clearContainer();

    // userId가 없으면 안내 메시지 출력
    if (!this.userId) {
      this.container.innerHTML = `<div class="user-info-error">사용자 ID 정보가 없습니다. 다시 로그인해주세요.</div>`;
      return;
    }

    // 실제 API에서 사용자 정보 받아오기
    let userData: any = null;
    let apiError: string | null = null;
    try {
      const url = `${UserInfoComponent.API_BASE_URL}/users/profile/${this.userId}`;

      // AuthManager의 authenticatedFetch 사용하여 자동 토큰 갱신
      const res = await AuthManager.authenticatedFetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`);
      }

      userData = await res.json();
    } catch (e) {
      console.error("[UserInfoComponent] API 오류:", e);
      apiError = e instanceof Error ? e.message : "사용자 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
    }

    // 에러 발생 시 안내 메시지 출력
    if (apiError || !userData || typeof userData !== "object") {
      this.container.innerHTML = `<div class="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-medium m-5">${
        apiError || "사용자 정보가 없습니다."
      }</div>`;
      return;
    }

    // 내 프로필 여부 판단 (UserManager 활용)
    const myId = UserManager.getUserId();
    // 더 안전한 타입 비교 - null/undefined 체크 후 문자열로 변환하여 비교
    const myIdStr = myId ? String(myId).trim() : "";
    const userIdStr = this.userId ? String(this.userId).trim() : "";
    const isMe = myIdStr && userIdStr && myIdStr === userIdStr;

    // ProfileDto 구조에 맞게 필드 매칭 (data 속성 안에 실제 데이터가 있음)
    const profileData = userData.data || {};
    const profileImage = profileData.profileImage || "";
    const username = profileData.username || "알 수 없음";
    const nickname = profileData.nickname || "닉네임 없음";
    const status = profileData.status || "정보 없음";
    const userId = profileData.id || this.userId;

    // 2FA 활성화 여부 확인 (twoFASecret이 있으면 활성화됨)
    const is2faEnabled = !!profileData.twoFASecret;

    // 친구 상태 확인 (다른 사용자의 프로필인 경우에만)
    let friendStatus = null;
    if (!isMe) {
      try {
        // FriendDataManager 초기화 (필요한 경우)
        if (!this.friendDataManager) {
          // 임시 컨테이너로 UserProfileManager 생성
          const tempContainer = document.createElement('div');
          const userProfileManager = new UserProfileManager(tempContainer);
          this.friendDataManager = new FriendDataManager(userProfileManager);
          // 친구 데이터 로딩
          await this.friendDataManager.loadFriends();
          await this.friendDataManager.loadFriendRequests();
          await this.friendDataManager.loadSentRequests();
        }
        
        friendStatus = this.friendDataManager.checkFriendStatus(Number(this.userId));
      } catch (error) {
        console.error("[UserInfoComponent] 친구 상태 확인 오류:", error);
        // 친구 상태 확인에 실패해도 계속 진행
        friendStatus = "none";
      }
    }

    // 템플릿 데이터 준비
    const templateData = {
      profileImage: profileImage,
      username: username,
      nickname: nickname,
      status: status,
      statusClasses: this.getStatusClasses(status),
      isMe: isMe,
      is2faEnabled: is2faEnabled,
      twoFaButtonText: is2faEnabled ? "2FA 비활성화" : "2FA 활성화",
      friendStatus: friendStatus,
    };

    // 해당 사용자의 username 저장 (친구 요청 시 사용)
    this.username = username;

    // HTML 직접 렌더링
    this.container.innerHTML = this.getUserInfoTemplate(templateData);
    this.setupEventListeners();
  }

  private getUserInfoTemplate(data: any): string {
    return `
<div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-100 p-4">
    <div class="max-w-4xl mx-auto">
        <!-- 헤더 -->
        <div class="mb-8">
            <div class="flex items-center justify-between bg-white rounded-xl shadow-md p-6">
                <div class="flex items-center gap-4">
                    <button class="back-btn bg-indigo-100 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-200 transition-colors font-medium">
                        ← 뒤로가기
                    </button>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-800">${data.isMe ? '내 프로필' : data.username + '님의 프로필'}</h1>
                        <p class="text-gray-600 text-sm">사용자 정보 및 설정</p>
                    </div>
                </div>
                ${data.profileImage ? `
                    <div class="w-16 h-16 rounded-full overflow-hidden border-3 border-indigo-200">
                        <img src="${data.profileImage}" alt="${data.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" class="w-full h-full object-cover">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center" style="display: none;">
                            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                ` : `
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                `}
            </div>
        </div>
        
        <!-- 프로필 카드 -->
        <div class="bg-white rounded-xl shadow-md p-8 mb-6">
            <div class="flex flex-col items-center text-center">
                <div class="mb-6">
                    ${
                      data.profileImage
                        ? `
                        <img src="${data.profileImage}" alt="${data.username}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" class="w-24 h-24 rounded-full object-cover shadow-lg mx-auto">
                        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto shadow-lg" style="display: none;">
                            <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                    `
                        : `
                        <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto shadow-lg">
                            <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                    `
                    }
                </div>
                
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-2">${data.username}</h2>
                    <p class="text-gray-600 mb-3">닉네임: ${data.nickname}</p>
                    <span class="inline-block px-4 py-2 rounded-full text-sm font-semibold ${data.statusClasses}">${data.status}</span>
                </div>
                
                ${
                  data.isMe
                    ? `
                    <div class="flex flex-col gap-3 w-full max-w-sm">
                        <button class="toggle-2fa-btn px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg" data-enabled="${data.is2faEnabled}">${data.twoFaButtonText}</button>
                        <button class="edit-profile-btn px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg">내 정보 변경</button>
                        <button class="view-my-stats-btn px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-green-600 text-white hover:bg-green-700 hover:shadow-lg">전적 보기</button>
                        <button class="deactivate-account-btn px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-red-600 text-white hover:bg-red-700 hover:shadow-lg">회원 탈퇴</button>
                    </div>
                `
                    : `
                    <div class="flex flex-col gap-3 w-full max-w-sm">
                        <button class="view-stats-btn px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-green-600 text-white hover:bg-green-700 hover:shadow-lg">전적 보기</button>
                        ${this.getFriendButtonHtml(data.friendStatus)}
                    </div>
                `
                }
            </div>
        </div>
    </div>
    <div class="user-info-error bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-medium m-5 hidden"></div>
</div>
        `;
  }

  private setupEventListeners(): void {
    // 뒤로가기 버튼
    const backBtn = this.container.querySelector(".back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        if (window.router) {
          // 브라우저 히스토리를 사용하여 이전 페이지로 이동
          if (window.router.canGoBack()) {
            window.router.goBack();
          } else {
            // 히스토리가 없으면 홈으로 이동
            window.router.navigate("/");
          }
        }
      });
    }

    // 2FA 토글 버튼 (내 프로필에만 표시)
    const toggle2faBtn = this.container.querySelector(".toggle-2fa-btn");
    if (toggle2faBtn) {
      toggle2faBtn.addEventListener("click", () => {
        const isEnabled = toggle2faBtn.getAttribute("data-enabled") === "true";
        this.toggle2fa(isEnabled);
      });
    }

    // 내 정보 변경 버튼 (내 프로필에만 표시)
    const editProfileBtn = this.container.querySelector(".edit-profile-btn");
    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", () => {
        this.editProfile();
      });
    }

    // 내 전적 보기 버튼 (내 프로필에만 표시)
    const viewMyStatsBtn = this.container.querySelector(".view-my-stats-btn");
    if (viewMyStatsBtn) {
      viewMyStatsBtn.addEventListener("click", () => {
        this.viewMyStats();
      });
    }

    // 회원 탈퇴 버튼 (내 프로필에만 표시)
    const deactivateAccountBtn = this.container.querySelector(".deactivate-account-btn");
    if (deactivateAccountBtn) {
      deactivateAccountBtn.addEventListener("click", () => {
        this.deactivateAccount();
      });
    }

    // 전적 보기 버튼 (다른 사용자 프로필에만 표시)
    const viewStatsBtn = this.container.querySelector(".view-stats-btn");
    if (viewStatsBtn) {
      viewStatsBtn.addEventListener("click", () => {
        this.viewUserStats();
      });
    }

    // 친구 추가 버튼 (다른 사용자 프로필에만 표시)
    const addFriendBtn = this.container.querySelector(".add-friend-btn");
    if (addFriendBtn) {
      addFriendBtn.addEventListener("click", () => {
        this.addFriend();
      });
    }

    // 친구 해제 버튼
    const removeFriendBtn = this.container.querySelector(".remove-friend-btn");
    if (removeFriendBtn) {
      removeFriendBtn.addEventListener("click", () => {
        this.removeFriend();
      });
    }

    // 친구 요청 취소 버튼
    const cancelFriendRequestBtn = this.container.querySelector(".cancel-friend-request-btn");
    if (cancelFriendRequestBtn) {
      cancelFriendRequestBtn.addEventListener("click", () => {
        this.cancelFriendRequest();
      });
    }
  }

  private async toggle2fa(isCurrentlyEnabled: boolean): Promise<void> {
    if (isCurrentlyEnabled) {
      // 2FA 비활성화
      await this.disable2fa();
    } else {
      // 2FA 활성화 (QR 코드 설정 시작)
      await this.setup2FA();
    }
  }

  // 2FA 비활성화
  private async disable2fa(): Promise<void> {
    try {
      const confirmed = confirm("2FA를 비활성화하시겠습니까?");
      if (!confirmed) return;

      // UserManager에서 저장된 username 가져오기
      const username = UserManager.getUsername();

      if (!username) {
        alert("사용자명을 찾을 수 없습니다.");
        return;
      }

      const response = await AuthManager.authenticatedFetch(`${UserInfoComponent.API_BASE_URL}/auth/2fa/disable`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      if (!response.ok) {
        throw new Error(`2FA 비활성화 실패: ${response.status} ${response.statusText}`);
      }

      // 성공 시 버튼 상태 업데이트
      const toggle2faBtn = this.container.querySelector(".toggle-2fa-btn");
      if (toggle2faBtn) {
        toggle2faBtn.setAttribute("data-enabled", "false");
        toggle2faBtn.textContent = "2FA 활성화";
      }

      alert("2FA가 성공적으로 비활성화되었습니다!");
    } catch (error) {
      console.error("[UserInfoComponent] 2FA 비활성화 오류:", error);
      const message = error instanceof Error ? error.message : "2FA 비활성화 중 오류가 발생했습니다.";
      alert(message);
    }
  }

  private editProfile(): void {
    if (window.router) {
      window.router.navigate("/profile/edit");
    }
  }

  private viewMyStats(): void {
    if (window.router) {
      window.router.navigate(`/user/${this.userId}/stats`);
    }
  }

  private async deactivateAccount(): Promise<void> {
    const confirmed = confirm("정말로 회원 탈퇴를 하시겠습니까?\n이 작업은 되돌릴 수 없습니다.");
    if (!confirmed) return;

    try {
      const response = await AuthManager.authenticatedFetch(`${UserInfoComponent.API_BASE_URL}/users/disable`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`회원 탈퇴 실패: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // 회원 탈퇴 성공 시 토큰 삭제 및 로그인 페이지로 이동
      alert("회원 탈퇴가 완료되었습니다.");
      AuthManager.clearTokens();

      if (window.router) {
        window.router.navigate("/login");
      }
    } catch (error) {
      console.error("[UserInfoComponent] 회원 탈퇴 오류:", error);
      const message = error instanceof Error ? error.message : "회원 탈퇴 중 오류가 발생했습니다.";
      alert(message);
    }
  }

  private viewUserStats(): void {
    if (window.router) {
      window.router.navigate(`/user/${this.userId}/stats`);
    }
  }

  private async addFriend(): Promise<void> {
    try {
      // friendService의 requestFriend 메서드에 username 전달
      const response = await friendService.requestFriend(this.username);

      if (response.success) {
        alert("친구 요청을 보냈습니다!");
        // FriendDataManager 상태도 업데이트
        if (this.friendDataManager) {
          await this.friendDataManager.loadSentRequests();
        }
        // 페이지 새로고침하여 버튼 상태 업데이트
        this.render();
      } else {
        const errorMsg = response.message || "알 수 없는 오류가 발생했습니다";
        alert(errorMsg);
      }
    } catch (error) {
      console.error("[UserInfoComponent] 친구 요청 오류:", error);
      const message = error instanceof Error ? error.message : "친구 요청 중 오류가 발생했습니다.";
      alert(message);
    }
  }

  private async removeFriend(): Promise<void> {
    try {
      const confirmed = confirm("정말로 친구를 삭제하시겠습니까?");
      if (!confirmed) return;

      // friendService의 deleteFriend 메서드 사용
      const response = await friendService.deleteFriend(Number(this.userId));

      if (response.success) {
        alert("친구가 삭제되었습니다.");
        // FriendDataManager 상태도 업데이트
        if (this.friendDataManager) {
          await this.friendDataManager.loadFriends();
        }
        // 페이지 새로고침하여 버튼 상태 업데이트
        this.render();
      } else {
        const errorMsg = response.message || "알 수 없는 오류가 발생했습니다";
        alert(errorMsg);
      }
    } catch (error) {
      console.error("[UserInfoComponent] 친구 삭제 오류:", error);
      const message = error instanceof Error ? error.message : "친구 삭제 중 오류가 발생했습니다.";
      alert(message);
    }
  }

  private async cancelFriendRequest(): Promise<void> {
    try {
      const confirmed = confirm("친구 요청을 취소하시겠습니까?");
      if (!confirmed) return;

      // FriendDataManager에서 해당 사용자에게 보낸 요청의 relationId 찾기
      if (!this.friendDataManager) {
        alert("친구 데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      const sentRequests = this.friendDataManager.getSentRequests();
      const targetRequest = sentRequests.find(request => 
        request.id === Number(this.userId) || 
        request.username?.toLowerCase() === this.username.toLowerCase()
      );

      if (!targetRequest) {
        alert("해당 사용자에게 보낸 친구 요청을 찾을 수 없습니다.");
        return;
      }

      // friendService의 cancelFriendRequest는 실제로는 rejectFriendRequest를 사용해야 할 수도 있음
      // relationId를 사용하는 API 호출
      const response = await friendService.rejectFriendRequest(targetRequest.relationId.toString());

      if (response.success) {
        alert("친구 요청을 취소했습니다.");
        // FriendDataManager 상태도 업데이트
        if (this.friendDataManager) {
          await this.friendDataManager.loadSentRequests();
        }
        // 페이지 새로고침하여 버튼 상태 업데이트
        this.render();
      } else {
        const errorMsg = response.message || "알 수 없는 오류가 발생했습니다";
        alert(errorMsg);
      }
    } catch (error) {
      console.error("[UserInfoComponent] 친구 요청 취소 오류:", error);
      const message = error instanceof Error ? error.message : "친구 요청 취소 중 오류가 발생했습니다.";
      alert(message);
    }
  }

  private getStatusClasses(status: string): string {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "online":
        return "bg-green-500 text-white";
      case "offline":
        return "bg-gray-500 text-white";
      case "playing":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  }

  // 2FA 설정 (QR 코드 받기)
  private async setup2FA(): Promise<void> {
    try {
      // UserManager에서 저장된 username 가져오기
      const username = UserManager.getUsername();

      if (!username) {
        alert("사용자명을 찾을 수 없습니다.");
        return;
      }

      const requestData = {
        username: username,
      };

      const response = await AuthManager.authenticatedFetch(`${UserInfoComponent.API_BASE_URL}/auth/2fa/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        // 에러 응답 내용을 확인
        let errorMessage = `2FA 설정 요청 실패: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          }
          console.error("[UserInfoComponent] 2FA setup 에러 응답:", errorData);
        } catch (e) {
          // JSON 파싱에 실패하면 텍스트로 읽어보기
          try {
            const errorText = await response.text();
            errorMessage += ` - ${errorText}`;
            console.error("[UserInfoComponent] 2FA setup 에러 텍스트:", errorText);
          } catch (e2) {
            console.error("[UserInfoComponent] 에러 응답 읽기 실패:", e2);
          }
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      
      // 디버깅을 위한 응답 구조 로그
      console.log("[UserInfoComponent] 2FA setup 응답 구조:", responseData);

      // 백엔드 응답 구조에 맞게 QR 코드 데이터 추출 (TwoFATempDto 구조)
      let qrCodeDataURL: string;
      let tempSecret: string;
      
      // 다양한 응답 구조 처리
      if (responseData.data?.qrCodeDataURL && responseData.data?.tempSecret) {
        // ApiResponse.ok() 구조: { success: true, data: { qrCodeDataURL: "...", tempSecret: "..." } }
        qrCodeDataURL = responseData.data.qrCodeDataURL;
        tempSecret = responseData.data.tempSecret;
        console.log("[UserInfoComponent] data 구조에서 추출:", { qrCodeDataURL: qrCodeDataURL.substring(0, 50), tempSecret: tempSecret.substring(0, 10) + "..." });
      } else if (responseData.qrCodeDataURL && responseData.tempSecret) {
        // 직접 구조: { qrCodeDataURL: "...", tempSecret: "..." }
        qrCodeDataURL = responseData.qrCodeDataURL;
        tempSecret = responseData.tempSecret;
        console.log("[UserInfoComponent] 직접 구조에서 추출:", { qrCodeDataURL: qrCodeDataURL.substring(0, 50), tempSecret: tempSecret.substring(0, 10) + "..." });
      } else if (responseData.data?.qrCode && responseData.data?.secret) {
        // 다른 가능한 구조: { data: { qrCode: "...", secret: "..." } }
        qrCodeDataURL = responseData.data.qrCode;
        tempSecret = responseData.data.secret;
        console.log("[UserInfoComponent] qrCode/secret 구조에서 추출:", { qrCodeDataURL: qrCodeDataURL.substring(0, 50), tempSecret: tempSecret.substring(0, 10) + "..." });
      } else if (responseData.qrCode && responseData.secret) {
        // 직접 구조: { qrCode: "...", secret: "..." }
        qrCodeDataURL = responseData.qrCode;
        tempSecret = responseData.secret;
        console.log("[UserInfoComponent] 직접 qrCode/secret 구조에서 추출:", { qrCodeDataURL: qrCodeDataURL.substring(0, 50), tempSecret: tempSecret.substring(0, 10) + "..." });
      } else {
        console.error("[UserInfoComponent] 응답에서 QR 코드 또는 임시 시크릿을 찾을 수 없음. 응답 구조:", Object.keys(responseData));
        if (responseData.data) {
          console.error("[UserInfoComponent] data 객체 구조:", Object.keys(responseData.data));
        }
        throw new Error(`QR 코드 데이터 또는 임시 시크릿을 찾을 수 없습니다. 응답 구조를 확인해주세요. 받은 키들: ${Object.keys(responseData).join(', ')}`);
      }

      // QR 코드 모달 표시 (임시 시크릿 포함)
      this.show2FASetupModal(qrCodeDataURL, tempSecret);
    } catch (error) {
      console.error("[UserInfoComponent] 2FA 설정 오류:", error);
      alert(error instanceof Error ? error.message : "2FA 설정 중 오류가 발생했습니다.");
    }
  }

  // 2FA 설정 모달 표시 (임시 시크릿 포함)
  private show2FASetupModal(qrCodeDataURL: string, tempSecret: string): void {
    // 모달 HTML 생성
    const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="twofa-modal">
                <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                    <div class="text-center">
                        <h2 class="text-2xl font-bold text-gray-800 mb-4">2FA 설정</h2>
                        <p class="text-gray-600 mb-6">
                            Google Authenticator 또는 다른 2FA 앱으로 아래 QR 코드를 스캔하세요.
                        </p>
                        
                        <!-- QR 코드 이미지 -->
                        <div class="mb-6 flex justify-center">
                            <div class="qr-code-container">
                                <img src="${qrCodeDataURL}" 
                                     alt="2FA QR Code" 
                                     class="max-w-full h-auto border rounded-lg" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                                <div style="display: none;" class="text-red-500 p-4 border border-red-300 rounded-lg">
                                    QR 코드를 불러올 수 없습니다.<br/>
                                    <small class="text-gray-500">데이터: ${qrCodeDataURL.substring(0, 50)}...</small>
                                </div>
                            </div>
                        </div>

                        <!-- 토큰 입력 -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                인증 코드를 입력하세요 (6자리)
                            </label>
                            <input 
                                type="text" 
                                id="twofa-token" 
                                maxlength="6" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-wider"
                                placeholder="000000"
                                autocomplete="off"
                            />
                            <!-- 임시 시크릿을 hidden input으로 저장 -->
                            <input type="hidden" id="temp-secret" value="${tempSecret}" />
                        </div>

                        <!-- 버튼 -->
                        <div class="flex gap-4">
                            <button class="cancel-twofa-btn flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors">
                                취소
                            </button>
                            <button class="confirm-twofa-btn flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // 모달을 body에 추가
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // 이벤트 리스너 추가
    this.setup2FAModalEvents();
  }

  // 2FA 모달 이벤트 설정
  private setup2FAModalEvents(): void {
    const modal = document.getElementById("twofa-modal");
    const cancelBtn = modal?.querySelector(".cancel-twofa-btn");
    const confirmBtn = modal?.querySelector(".confirm-twofa-btn");
    const tokenInput = modal?.querySelector("#twofa-token") as HTMLInputElement;

    // 취소 버튼
    cancelBtn?.addEventListener("click", () => {
      this.close2FAModal();
    });

    // 모달 배경 클릭시 닫기
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.close2FAModal();
      }
    });

    // 확인 버튼
    confirmBtn?.addEventListener("click", () => {
      const token = tokenInput?.value?.trim();
      const tempSecret = (modal?.querySelector("#temp-secret") as HTMLInputElement)?.value;
      if (!token || token.length !== 6) {
        alert("6자리 인증 코드를 입력해주세요.");
        return;
      }
      this.confirm2FASetup(token, tempSecret);
    });

    // Enter 키로 확인
    tokenInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const token = tokenInput.value.trim();
        const tempSecret = (modal?.querySelector("#temp-secret") as HTMLInputElement)?.value;
        if (token && token.length === 6) {
          this.confirm2FASetup(token, tempSecret);
        }
      }
    });

    // 숫자만 입력 허용
    tokenInput?.addEventListener("input", (e) => {
      const input = e.target as HTMLInputElement;
      input.value = input.value.replace(/[^0-9]/g, "");
    });
  }

  // 2FA 설정 검증
  private async verify2FASetup(token: string): Promise<void> {
    try {
      // UserManager에서 저장된 username 가져오기
      const username = UserManager.getUsername();

      if (!username) {
        alert("사용자명을 찾을 수 없습니다.");
        return;
      }

      const response = await AuthManager.authenticatedFetch(`${UserInfoComponent.API_BASE_URL}/auth/2fa/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          token: token,
        }),
      });

      if (!response.ok) {
        throw new Error(`2FA 검증 실패: ${response.status} ${response.statusText}`);
      }

      // 성공 시 모달 닫기 및 버튼 상태 업데이트
      this.close2FAModal();

      // 버튼 상태 업데이트
      const toggle2faBtn = this.container.querySelector(".toggle-2fa-btn");
      if (toggle2faBtn) {
        toggle2faBtn.setAttribute("data-enabled", "true");
        toggle2faBtn.textContent = "2FA 비활성화";
      }

      alert("2FA가 성공적으로 활성화되었습니다!");
    } catch (error) {
      console.error("[UserInfoComponent] 2FA 검증 오류:", error);
      alert(error instanceof Error ? error.message : "2FA 검증 중 오류가 발생했습니다.");
    }
  }

  // 2FA 설정 확인 (임시 secret을 실제 secret으로 등록)
  private async confirm2FASetup(token: string, tempSecret: string): Promise<void> {
    try {
      // UserManager에서 저장된 username 가져오기
      const username = UserManager.getUsername();

      if (!username) {
        alert("사용자명을 찾을 수 없습니다.");
        return;
      }

      if (!tempSecret) {
        alert("임시 시크릿을 찾을 수 없습니다. 다시 시도해주세요.");
        return;
      }

      console.log("[UserInfoComponent] 2FA confirm 요청:", { username, tempSecret: tempSecret.substring(0, 10) + "...", token });

      const response = await AuthManager.authenticatedFetch(`${UserInfoComponent.API_BASE_URL}/auth/2fa/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          tempSecret: tempSecret,
          token: token,
        }),
      });

      if (!response.ok) {
        let errorMessage = `2FA 설정 확인 실패: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.error("[UserInfoComponent] 2FA confirm 에러 응답:", errorData);
        } catch (e) {
          console.error("[UserInfoComponent] 에러 응답 파싱 실패:", e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("[UserInfoComponent] 2FA confirm 성공:", result);

      // 성공 시 모달 닫기 및 버튼 상태 업데이트
      this.close2FAModal();

      // 버튼 상태 업데이트
      const toggle2faBtn = this.container.querySelector(".toggle-2fa-btn");
      if (toggle2faBtn) {
        toggle2faBtn.setAttribute("data-enabled", "true");
        toggle2faBtn.textContent = "2FA 비활성화";
      }

      alert("2FA가 성공적으로 활성화되었습니다!");
    } catch (error) {
      console.error("[UserInfoComponent] 2FA 설정 확인 오류:", error);
      alert(error instanceof Error ? error.message : "2FA 설정 확인 중 오류가 발생했습니다.");
    }
  }

  // 2FA 모달 닫기
  private close2FAModal(): void {
    const modal = document.getElementById("twofa-modal");
    modal?.remove();
  }

  // 친구 상태에 따른 버튼 HTML 생성
  private getFriendButtonHtml(friendStatus: string): string {
    switch (friendStatus) {
      case "friend":
        return `<button class="remove-friend-btn px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-red-600 text-white hover:bg-red-700 hover:shadow-lg">친구 삭제</button>`;
      case "pending":
        return `<button class="cancel-friend-request-btn px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-yellow-600 text-white hover:bg-yellow-700 hover:shadow-lg">요청 취소</button>`;
      case "none":
      default:
        return `<button class="add-friend-btn px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg">친구 요청</button>`;
    }
  }

  destroy(): void {
    // 이벤트 리스너 정리
    const backBtn = this.container.querySelector(".back-btn");
    if (backBtn) {
      backBtn.removeEventListener("click", () => {});
    }

    const toggle2faBtn = this.container.querySelector(".toggle-2fa-btn");
    if (toggle2faBtn) {
      toggle2faBtn.removeEventListener("click", () => {});
    }

    const editProfileBtn = this.container.querySelector(".edit-profile-btn");
    if (editProfileBtn) {
      editProfileBtn.removeEventListener("click", () => {});
    }

    const viewMyStatsBtn = this.container.querySelector(".view-my-stats-btn");
    if (viewMyStatsBtn) {
      viewMyStatsBtn.removeEventListener("click", () => {});
    }

    const deactivateAccountBtn = this.container.querySelector(".deactivate-account-btn");
    if (deactivateAccountBtn) {
      deactivateAccountBtn.removeEventListener("click", () => {});
    }

    const viewStatsBtn = this.container.querySelector(".view-stats-btn");
    if (viewStatsBtn) {
      viewStatsBtn.removeEventListener("click", () => {});
    }

    const addFriendBtn = this.container.querySelector(".add-friend-btn");
    if (addFriendBtn) {
      addFriendBtn.removeEventListener("click", () => {});
    }

    const removeFriendBtn = this.container.querySelector(".remove-friend-btn");
    if (removeFriendBtn) {
      removeFriendBtn.removeEventListener("click", () => {});
    }

    const cancelFriendRequestBtn = this.container.querySelector(".cancel-friend-request-btn");
    if (cancelFriendRequestBtn) {
      cancelFriendRequestBtn.removeEventListener("click", () => {});
    }

    // 2FA 모달이 열려있다면 닫기
    this.close2FAModal();

    // 컨테이너는 Layout에서 관리하므로 여기서는 비우지 않음
    // this.clearContainer(); // 이 줄이 문제였음
  }
}
