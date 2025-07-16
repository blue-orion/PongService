// WebSocket 관련 타입 정의
export interface GameMessage {
  type: "new" | "move" | "state" | "disconnect";
  msg?: string;
  playerId?: string;
  direction?: "up" | "down";
}

export interface GameState {
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
  };
  players: {
    [playerId: string]: {
      x: number;
      y: number;
      score: number;
    };
  };
  gameStatus: "waiting" | "playing" | "paused" | "ended";
}

export interface Player {
  id: string;
  x: number;
  y: number;
  score: number;
  width: number;
  height: number;
}

export interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

// WebSocket 연결 상태
export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

// 키보드 이벤트 타입
export interface KeyboardControls {
  up: boolean;
  down: boolean;
}
