export const getFriendComponentTemplate = (): string => {
  return `
<!-- 모바일 토글 버튼 -->
<button class="fixed top-16 right-4 z-[9999] lg:hidden bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white p-2.5 rounded-full shadow-xl border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95" id="mobile-friend-toggle" title="친구 목록 열기">
  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 715 0z"></path>
  </svg>
  <!-- 알림 배지 -->
  <div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold opacity-0 scale-0 transition-all duration-200 hidden" id="friend-notification-badge">0</div>
</button>

<!-- 모바일 오버레이 -->
<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] lg:hidden opacity-0 pointer-events-none transition-all duration-300" id="friend-overlay"></div>

<!-- 친구창 컨테이너 -->
<div class="fixed top-0 right-0 w-80 h-full bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-xl border-l border-white/20 z-[56] shadow-2xl transition-transform duration-300 lg:translate-x-0 translate-x-full max-w-[calc(100vw-2rem)] lg:max-w-none" id="friend-panel">
  <!-- 친구창 헤더 -->
  <div class="p-4 border-b border-white/20 bg-white/5">
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-bold text-white tracking-wide">친구 목록</h3>
      <button class="lg:hidden text-white/70 hover:text-white p-1 transition-colors" id="friend-close-btn">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  </div>

  <!-- 사용자 프로필 -->
  <div class="p-4 border-b border-white/20 bg-white/5">
    <div class="flex items-center gap-3 mb-3">
      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 border-2 border-white/30" id="userAvatar"></div>
      <div class="flex-1">
        <div class="text-white font-semibold text-sm" id="userNickname">사용자</div>
        <div class="text-white/60 text-xs" id="userUsername">@username</div>
        <div class="text-green-400 text-xs font-medium" id="userStatus">온라인</div>
      </div>
    </div>
    
    <!-- 친구 요청 보관함 -->
    <div class="relative mb-2" id="friendRequestsBox">
      <button class="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 flex items-center justify-between transition-all duration-200 hover:scale-[1.02]" id="requestsToggle">
        <div class="flex items-center gap-2">
          <span class="text-lg">📮</span>
          <span class="text-white text-sm font-medium">받은 요청</span>
        </div>
        <span class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold hidden" id="requestsCount">0</span>
      </button>
      <div class="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 opacity-0 -translate-y-2.5 pointer-events-none transition-all duration-300 z-50" id="requestsDropdown">
        <div class="p-3 border-b border-white/20 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-t-xl">
          <div class="text-gray-800 font-bold text-sm">받은 친구 요청</div>
        </div>
        <div class="max-h-60 overflow-y-auto" id="requestsList">
          <!-- 친구 요청들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>
    </div>
    
    <!-- 보낸 요청 보관함 -->
    <div class="relative" id="sentRequestsBox">
      <button class="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 flex items-center justify-between transition-all duration-200 hover:scale-[1.02]" id="sentRequestsToggle">
        <div class="flex items-center gap-2">
          <span class="text-lg">📤</span>
          <span class="text-white text-sm font-medium">보낸 요청</span>
        </div>
        <span class="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold hidden" id="sentRequestsCount">0</span>
      </button>
      <div class="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 opacity-0 -translate-y-2.5 pointer-events-none transition-all duration-300 z-50" id="sentRequestsDropdown">
        <div class="p-3 border-b border-white/20 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-t-xl">
          <div class="text-gray-800 font-bold text-sm">보낸 친구 요청</div>
        </div>
        <div class="max-h-60 overflow-y-auto" id="sentRequestsList">
          <!-- 보낸 요청들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>
    </div>
  </div>

  <!-- 친구창 내용 -->
  <div class="flex-1 overflow-hidden flex flex-col" id="friendContent">
    <!-- 친구 추가 -->
    <div class="p-4 border-b border-white/20 bg-white/5">
      <div class="flex gap-2">
        <input type="text" placeholder="사용자명으로 친구 추가" class="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent min-w-0" id="addFriendInput" />
        <button class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg font-bold transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 flex-shrink-0 min-w-[44px] flex items-center justify-center" id="addFriendBtn">+</button>
      </div>
    </div>

    <!-- 친구 목록 스크롤 영역 -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- 온라인 친구들 -->
      <div>
        <div class="text-white/80 text-sm font-semibold mb-2 px-1" id="onlineTitle">온라인 - 0</div>
        <div class="space-y-2" id="onlineList">
          <!-- 온라인 친구들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>

      <!-- 오프라인 친구들 -->
      <div>
        <div class="text-white/80 text-sm font-semibold mb-2 px-1" id="offlineTitle">오프라인 - 0</div>
        <div class="space-y-2" id="offlineList">
          <!-- 오프라인 친구들이 여기에 동적으로 추가됩니다 -->
        </div>
      </div>
    </div>
  </div>
</div>
  `;
};
