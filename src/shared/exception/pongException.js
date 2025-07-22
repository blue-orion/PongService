class PongException extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }

  // === 기본 HTTP 에러 타입 ===
  static ENTITY_NOT_FOUND = new PongException("Entity not found", 400);
  static BAD_REQUEST = (message = "Bad request") => new PongException(message, 400);
  static UNAUTHORIZED = (message = "Unauthorized") => new PongException(message, 401);
  static FORBIDDEN = (message = "Forbidden") => new PongException(message, 403);
  static NOT_FOUND = (message = "Not found") => new PongException(message, 404);
  static CONFLICT = (message = "Conflict") => new PongException(message, 409);
  static INTERNAL_SERVER_ERROR = (message = "Internal server error") => new PongException(message, 500);

  /// === 입력 검증 관련 에러 ===
  static MISSING_INPUT = new PongException("입력 값이 누락되었습니다.", 400);
  static INVALID_INPUT = (field) => new PongException(`유효하지 않은 ${field}입니다.`, 400);
  static INVALID_TOURNAMENT_TYPE = new PongException("유효하지 않은 토너먼트 타입입니다.", 400);

  // === 토너먼트 관련 에러 ===
  static TOURNAMENT_NOT_FOUND = new PongException("해당 토너먼트를 찾을 수 없습니다.", 404);
  static TOURNAMENT_ALREADY_STARTED = new PongException("이미 시작된 토너먼트입니다.", 409);
  static TOURNAMENT_COMPLETED = new PongException("토너먼트가 이미 종료되었습니다.", 409);

  // === 로비 관련 에러 ===
  static LOBBY_NOT_FOUND = new PongException("존재하지 않는 로비입니다.", 404);
  static LOBBY_ALREADY_STARTED = new PongException("이미 시작된 로비입니다.", 409);
  static LOBBY_FULL = new PongException("로비 인원이 가득 찼습니다.", 409);
  static INSUFFICIENT_PLAYERS = new PongException("로비 인원이 충분하지 않습니다.", 409);

  // === 플레이어 관련 에러 ===
  static NOT_REAL_USER = new PongException("존재하지 않는 유저입니다", 404);
  static USER_NOT_FOUND = new PongException("존재하지 않는 사용자입니다.", 404);
  static ALREADY_IN_LOBBY = new PongException("이미 로비에 참가 중입니다.", 409);
  static NOT_IN_LOBBY = new PongException("해당 로비에 참가하지 않은 사용자입니다.", 403);
  static TARGET_NOT_IN_LOBBY = new PongException("해당 유저가 로비에 참가하지 않았습니다.", 403);

  // === 권한 관련 에러 ===
  static NOT_LEADER = new PongException("방장 권한이 없습니다.", 403);

  // === 게임 관련 에러 ===
  static GAME_NOT_FOUND = new PongException("존재하지 않는 게임입니다.", 404);
  static GAME_ALREADY_STARTED = new PongException("이미 시작된 게임입니다.", 409);
  static INVALID_GAME_TOURNAMENT = new PongException("게임이 해당 토너먼트에 속하지 않습니다.", 400);

  // === 게임 진행 관련 에러 ===
  static PLAYERS_NOT_READY = new PongException("모든 플레이어가 준비 상태가 아닙니다.", 409);
  static ROUND_NOT_COMPLETE = new PongException("현재 라운드가 아직 완료되지 않았습니다.", 409);
  static WINNERS_NOT_READY = new PongException("승자들이 모두 준비 상태가 아닙니다.", 409);

  // === 유틸리티 메서드 ===
  static isInstance(error) {
    return error instanceof PongException;
  }
}

export default PongException;
