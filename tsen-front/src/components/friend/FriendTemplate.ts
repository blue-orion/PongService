export const getFriendComponentTemplate = (): string => {
  return `
<!-- 모바일 토글 버튼 -->
<button class="friend-mobile-toggle" id="mobile-friend-toggle" title="친구 목록 열기">
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
  </svg>
  <!-- 알림 배지 -->
  <div class="friend-notification-badge" id="friend-notification-badge">0</div>
</button>

<!-- 모바일 오버레이 -->
<div class="friend-overlay" id="friend-overlay"></div>

<!-- 친구창 컨테이너 -->
<div class="friend-panel" id="friend-panel">
  <!-- 친구창 헤더 -->
  <div class="friend-header">
    <div class="friend-header-content">
      <h3 class="friend-title">친구 목록</h3>
      <button class="friend-close-btn" id="friend-close-btn">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  </div>

  <!-- 사용자 프로필 -->
  <div class="friend-user-profile">
    <div class="friend-user-info">
      <div class="friend-user-avatar" id="userAvatar"></div>
      <div class="friend-user-details">
        <div class="friend-user-nickname" id="userNickname">사용자</div>
        <div class="friend-user-username" id="userUsername">@username</div>
        <div class="friend-user-status" id="userStatus">온라인</div>
      </div>
    </div>
    
    <!-- 친구 요청 보관함 -->
    <div class="friend-requests-box" id="friendRequestsBox">
      <button class="friend-requests-toggle" id="requestsToggle">
        <div class="friend-requests-icon-text">
          <span class="friend-requests-icon">📮</span>
          <span class="friend-requests-text">받은 요청</span>
        </div>
        <span class="friend-requests-count" id="requestsCount">0</span>
      </button>
      <div class="friend-dropdown" id="requestsDropdown">
        <div class="friend-dropdown-header requests">
          <div class="friend-dropdown-title">받은 친구 요청</div>
        </div>
        <div class="friend-dropdown-list" id="requestsList">
          <!-- 친구 요청들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>
    </div>
    
    <!-- 보낸 요청 보관함 -->
    <div class="friend-requests-box" id="sentRequestsBox">
      <button class="friend-requests-toggle" id="sentRequestsToggle">
        <div class="friend-requests-icon-text">
          <span class="friend-requests-icon">📤</span>
          <span class="friend-requests-text">보낸 요청</span>
        </div>
        <span class="friend-sent-requests-count" id="sentRequestsCount">0</span>
      </button>
      <div class="friend-dropdown" id="sentRequestsDropdown">
        <div class="friend-dropdown-header sent">
          <div class="friend-dropdown-title">보낸 친구 요청</div>
        </div>
        <div class="friend-dropdown-list" id="sentRequestsList">
          <!-- 보낸 요청들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>
    </div>
  </div>

  <!-- 친구창 내용 -->
  <div class="friend-content" id="friendContent">
    <!-- 친구 요청 -->
    <div class="friend-add-section">
      <div class="friend-add-form">
        <input type="text" placeholder="사용자명으로 친구 요청" class="friend-add-input" id="addFriendInput" />
        <button class="friend-add-btn" id="addFriendBtn">+</button>
      </div>
    </div>

    <!-- 친구 목록 스크롤 영역 -->
    <div class="friend-list-container">
      <!-- 온라인 친구들 -->
      <div>
        <div class="friend-list-title" id="onlineTitle">온라인 - 0</div>
        <div class="friend-list" id="onlineList">
          <!-- 온라인 친구들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>

      <!-- 오프라인 친구들 -->
      <div>
        <div class="friend-list-title" id="offlineTitle">오프라인 - 0</div>
        <div class="friend-list" id="offlineList">
          <!-- 오프라인 친구들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>
    </div>
  </div>
</div>
  `;
};
