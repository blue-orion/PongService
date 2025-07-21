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
      throw new Error(
        `템플릿 로드 실패: ${response.status} ${response.statusText}`,
      );
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
export async function loadTemplates(
  templatePaths: string[],
): Promise<string[]> {
  const promises = templatePaths.map((path) => loadTemplate(path));
  return await Promise.all(promises);
}

/**
 * 컴포넌트별 템플릿 경로 상수
 */
export const TEMPLATE_PATHS = {
  LOGIN: "/components/login/login.template.html",
  GAME: "/components/game/game.template.html",
  FRIEND: "/src/components/friend/friend.template.html",
  HEADER: "/src/components/header/header.template.html",
  FRIENDSLIST: "/src/components/friendsList/firendsList.template.html",
  FRIENDS_LIST: "/src/components/friends/friendsList.template.html",
  CHATTING_ROOM: "/src/components/lobby/chattingRoom/chattingRoom.template.html",
  LAYOUT: "/src/pages/layout.template.html",
  LOBBY_LIST: "/src/components/lobby/lobbyList/lobbyList.template.html",
  LOBBY_DETAIL: "/src/components/lobby/lobbyDetail.template.html",
  CHAT_ROOM: "/src/components/lobby/chattingRoom/chattingRoom.template.html",
  CHAT_INPUT: "/src/components/lobby/chattingRoom/chatInput.template.html",
} as const;
