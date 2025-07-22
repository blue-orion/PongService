/**
 * HTML 템플릿 파일을 로드하는 유틸리티 함수들
 */

/**
 * 템플릿 파일을 비동기로 로드합니다
 * @param templatePath 템플릿 파일 경로
 * @returns Promise<string> HTML 문자열
 */
export async function loadTemplate(templatePath: string): Promise<string> {
  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`템플릿 로드 실패: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`템플릿 로드 중 오류 발생: ${templatePath}`, error);
    throw error;
  }
}

/**
 * 여러 템플릿을 한번에 로드합니다
 * @param templatePaths 템플릿 파일 경로들
 * @returns Promise<string[]> HTML 문자열 배열
 */
export async function loadTemplates(templatePaths: string[]): Promise<string[]> {
  const promises = templatePaths.map((path) => loadTemplate(path));
  return await Promise.all(promises);
}

/**
 * 컴포넌트별 템플릿 경로 상수
 */
export const TEMPLATE_PATHS = {
  LOGIN: "/components/login/login.template.html",
  LOGIN_2FA: "/src/components/login/login2FA.template.html",
  GAME: "/components/game/game.template.html",
  FRIEND: "/src/components/friend/friend.template.html",
  HEADER: "/src/components/header/header.template.html",
  CHATTING_ROOM: "/src/components/lobby/chattingRoom/chattingRoom.template.html",
  LAYOUT: "/src/pages/layout.template.html",
  LOBBY_LIST: "/src/components/lobby/lobbyList/lobbyList.template.html",
  LOBBY_DETAIL: "/src/components/lobby/lobbyDetail.template.html",
  CREATE_LOBBY: "/src/components/lobby/createLobby/createLobby.template.html",
  CHAT_ROOM: "/src/components/lobby/chattingRoom/chattingRoom.template.html",
  CHAT_INPUT: "/src/components/lobby/chattingRoom/chatInput.template.html",
  USER_INFO: "/src/components/user/userInfo.template.html",
  USER_INFO_2FA_MODAL: "/src/components/user/userInfo2FAModal.template.html",
  EDIT_PROFILE: "/src/components/user/editProfile.template.html",
  STATS_MAIN: "/src/components/user/statsMain.template.html",
  GAME_HISTORY: "/src/components/user/gameHistory.template.html",
} as const;

/**
 * 간단한 템플릿 엔진 - Handlebars 스타일의 변수 치환
 * @param template HTML 템플릿 문자열
 * @param data 치환할 데이터 객체
 * @returns 치환된 HTML 문자열
 */
export function renderTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  
  // 중첩된 조건문을 처리하기 위해 여러 번 반복 처리
  let maxIterations = 5; // 최대 5회 반복으로 중첩 처리
  let hasChanges = true;
  
  while (hasChanges && maxIterations > 0) {
    hasChanges = false;
    const beforeLength = result.length;
    
    // {{#if condition}}...{{else}}...{{/if}} 형태의 조건부 렌더링 (else 포함)
    result = result.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, 
      (match, condition, trueContent, falseContent) => {
        const trimmedCondition = condition.trim();
        const value = data[trimmedCondition];
        // boolean 값 체크를 더 정확하게
        const isTrue = Boolean(value) && value !== 'false' && value !== 0;
        console.log(`[renderTemplate] if-else 조건 처리:`, {
          condition: trimmedCondition,
          value: value,
          valueType: typeof value,
          isTrue: isTrue
        });
        return isTrue ? trueContent : falseContent;
      });
    
    // {{#if condition}}...{{/if}} 형태의 조건부 렌더링 (else 없음)
    result = result.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, 
      (match, condition, content) => {
        const trimmedCondition = condition.trim();
        const value = data[trimmedCondition];
        // boolean 값 체크를 더 정확하게
        const isTrue = Boolean(value) && value !== 'false' && value !== 0;
        return isTrue ? content : '';
      });
    
    // 변경사항이 있었는지 확인
    if (result.length !== beforeLength) {
      hasChanges = true;
    }
    
    maxIterations--;
  }
  
  // {{variable}} 형태의 변수 치환
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : '';
  });
  
  return result;
}

/**
 * CSS 파일을 로드하여 스타일 태그로 삽입
 * @param cssPath CSS 파일 경로
 * @returns Promise<string> CSS 문자열
 */
export async function loadCSS(cssPath: string): Promise<string> {
  try {
    const response = await fetch(cssPath);
    if (!response.ok) {
      throw new Error(`CSS 로드 실패: ${response.status} ${response.statusText}`);
    }
    const css = await response.text();
    return `<style>${css}</style>`;
  } catch (error) {
    console.error(`CSS 로드 중 오류 발생: ${cssPath}`, error);
    throw error;
  }
}
