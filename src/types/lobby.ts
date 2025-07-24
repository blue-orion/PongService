// 로비 관련 공통 타입 정의

// 백엔드 DTO에 맞춘 로비 데이터 타입
export interface LobbyData {
  id: number;
  name?: string; // 백엔드에서 name 필드가 없을 수 있음
  tournament_id: number; // 백엔드는 tournament_id 사용
  max_player: number; // 백엔드는 max_player 사용
  lobby_status: "PENDING" | "IN_PROGRESS"; // 백엔드는 lobby_status 사용
  creator_id: number; // 백엔드는 creator_id 사용
  creator_nickname?: string; // 백엔드에서 추가된 필드
  created_at: string; // 백엔드는 created_at 사용
  updated_at: string; // 백엔드는 updated_at 사용
  tournament: any;
  lobby_players: LobbyPlayer[]; // 백엔드는 lobby_players 사용
  players?: LobbyPlayer[]; // 호환성을 위한 선택적 필드

  // UI에서 사용하는 계산된 필드들
  tournamentId?: number; // 호환성을 위한 필드
  maxPlayers?: number; // 호환성을 위한 필드
  status?: "waiting" | "playing"; // 호환성을 위한 필드
  statusText?: string; // UI용 필드
  creatorId?: number; // 호환성을 위한 필드
  createdAt?: string; // 호환성을 위한 필드
  updatedAt?: string; // 호환성을 위한 필드
  currentPlayers?: number; // 계산된 필드
  host?: string; // 계산된 필드
  isHost?: boolean; // 계산된 필드
  isPlayerReady?: boolean; // 계산된 필드
  allPlayersReady?: boolean; // 계산된 필드
  matchData?: MatchData;
}

// 백엔드 DTO에 맞춘 로비 플레이어 타입
export interface LobbyPlayer {
  id?: number; // 백엔드 추가 필드
  user_id: number;
  is_leader: boolean;
  is_ready: boolean;
  enabled: boolean;
  joined_at?: string; // 백엔드는 joined_at (created_at) 사용
  user?: {
    id: number;
    username: string;
    nickname?: string;
    profile_image?: string;
  };
}

// 백엔드 DTO에 맞춘 매치 데이터 타입
export interface MatchData {
  lobby_id: number;
  tournament_id: number;
  tournament_status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  current_round: number;
  total_rounds: number;
  total_matches?: number; // 백엔드 추가 필드
  round?: number; // 백엔드 match:created 이벤트에서 사용
  games?: GameMatch[]; // 백엔드는 games 배열 사용
  matches?: GameMatch[]; // 호환성을 위한 필드
  message?: string; // 백엔드 추가 필드
  winner?: PlayerInfo;
}

// 백엔드 DTO에 맞춘 게임 매치 타입
export interface GameMatch {
  game_id: number;
  round: number;
  match?: number; // 백엔드 추가 필드
  game_status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  tournament_id: number;

  // 백엔드 DTO 방식 (player_one, player_two)
  player_one?: {
    id: number;
    user?: PlayerInfo;
  };
  player_two?: {
    id: number;
    user?: PlayerInfo;
  };

  // 백엔드 DetailedGameMatchDto 방식 (left_player, right_player)
  left_player?: {
    id: number;
    nickname?: string;
    username?: string;
    profile_image?: string;
    score?: number;
  };
  right_player?: {
    id: number;
    nickname?: string;
    username?: string;
    profile_image?: string;
    score?: number;
  };

  winner?: {
    id: number;
    nickname?: string;
    position?: "left" | "right";
  };
  loser?: {
    id: number;
    nickname?: string;
    position?: "left" | "right";
  };

  play_time?: string;
  created_at: string;
  updated_at: string;
}

// 호환성을 위한 기존 MatchInfo 타입 (deprecated)
export interface MatchInfo {
  game_id: number;
  round: number;
  game_status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  player_one: PlayerInfo;
  player_two: PlayerInfo;
  winner?: PlayerInfo;
  loser?: PlayerInfo;
  play_time?: string;
}

export interface PlayerInfo {
  id: number;
  username: string;
  nickname?: string;
  profile_image?: string;
  score?: number;
  position?: "left" | "right";
}

// 백엔드 DTO에 맞춘 로비 생성 요청 타입
export interface CreateLobbyRequest {
  tournament_id: number; // 백엔드는 tournament_id 사용
  max_player: number; // 백엔드는 max_player 사용
  creator_id: number; // 백엔드는 creator_id 사용
  name?: string; // 선택적 필드
}

// 백엔드 DTO에 맞춘 로비 참가 요청 타입
export interface JoinLobbyRequest {
  lobby_id: number;
  user_id: number;
}

// 백엔드 DTO에 맞춘 로비 나가기 요청 타입
export interface LeaveLobbyRequest {
  lobby_id: number;
  user_id: number;
}

// 백엔드 DTO에 맞춘 방장 위임 요청 타입
export interface TransferLeadershipRequest {
  lobby_id: number;
  current_leader_id: number;
  target_user_id: number;
}

// 백엔드 DTO에 맞춘 준비 상태 토글 요청 타입
export interface ToggleReadyStateRequest {
  lobby_id: number;
  user_id: number;
}

// 백엔드 DTO에 맞춘 매치 생성 요청 타입
export interface CreateMatchRequest {
  lobby_id: number;
  user_id: number;
}

// 백엔드 DTO에 맞춘 게임 시작 요청 타입
export interface StartGameRequest {
  lobby_id: number;
  user_id: number;
  game_id: number;
}

// 백엔드 DTO에 맞춘 응답 타입들
export interface LobbyResponse {
  data: LobbyData;
  message?: string;
}

export interface LobbiesResponse {
  total: number;
  page: number;
  size: number;
  lobbies: LobbyData[];
}

// 소켓 이벤트 관련 타입 - 백엔드 이벤트명에 맞게 수정
export interface SocketEventHandlers {
  onReadyStateChange: (data: ReadyStateChangeEvent) => void;
  onPlayerChange: (data: PlayerChangeEvent) => void;
  onLobbyUpdate: (data: LobbyUpdateEvent) => void;
  onLeadershipChange: (data: LeadershipChangeEvent) => void;
  onHostTransferred: (data: HostTransferredEvent) => void; // 새로운 이벤트
  onPlayerLeft: (data: PlayerLeftEvent) => void;
  onPlayerJoined: (data: PlayerJoinedEvent) => void;
  onMatchCreated: (data: MatchCreatedEvent) => void;
  onConnectionStatusChange: (isConnected: boolean, transport?: string) => void;
  onGameStarted: (data: GameStartedEvent) => void;
  onGameCompleted: (data: GameCompletedEvent) => void; // 새로운 이벤트
  onTournamentCompleted: (data: TournamentCompletedEvent) => void; // 새로운 이벤트
  onPlayerRemoved: (data: PlayerRemovedEvent) => void; // 새로운 이벤트
  onRefresh: () => void;
}

export interface GameStartedEvent {
  user_id?: number; // 호환성
  tournament_id: number;
  game_id: number;
  lobby_id: number;
  players?: any[];
  message?: string;
}

export interface GameCompletedEvent {
  tournament_id: number;
  game_id: number;
  lobby_id: number;
  current_round: number;
  tournament_status: string;
  winner_id: number;
  loser_id: number;
  message: string;
}

export interface TournamentCompletedEvent {
  tournament_id: number;
  lobby_id: number;
  tournament_status: string;
  tournament_type: string;
  final_round: number;
  winner_id: number;
  message: string;
}

export interface PlayerRemovedEvent {
  lobby_id: number;
  removed_user_id: number;
  reason: string;
  message: string;
}

export interface ReadyStateChangeEvent {
  user_id: number;
  is_ready: boolean;
  lobby_id: number;
  player?: LobbyPlayer;
}

export interface PlayerChangeEvent {
  user_id: number;
  lobby_id: number;
  type: string;
}

export interface LobbyUpdateEvent {
  lobby_id: number;
  type: string;
}

export interface LeadershipChangeEvent {
  new_leader_id: number;
  old_leader_id?: number;
  lobby_id: number;
  lobby?: any; // 백엔드에서 전체 로비 데이터 전송
}

export interface HostTransferredEvent {
  lobby_id: number;
  new_host_id: number;
  old_host_id?: number;
  reason?: string; // 호스트 변경 이유 (예: "HOST_LEFT", "MANUAL_TRANSFER")
  lobby?: LobbyData; // 업데이트된 로비 데이터
  message?: string;
}

export interface PlayerLeftEvent {
  user_id: number;
  lobby_id: number;
  type: string;
  lobby?: any;
}

export interface PlayerJoinedEvent {
  user_id: number;
  lobby_id: number;
  type: string;
  lobby?: any;
}

export interface MatchCreatedEvent {
  tournament_id: number;
  lobby_id: number;
  round: number;
  total_matches: number;
  games: GameMatch[]; // 백엔드는 games 배열 사용
  matches?: GameMatch[]; // 호환성
  tournament_status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  current_round?: number;
  total_rounds?: number;
  message: string;
  winner?: PlayerInfo;
}

// UI 이벤트 핸들러 타입
export interface UIEventHandlers {
  onBackToList: () => void;
  onToggleReady: () => void;
  onStartGame: () => void;
  onRefresh: () => void;
  onLeaveLobby: () => void;
  onTransferLeadership: (targetUserId: number, targetUsername: string) => void;
  onCreateMatch: () => void;
  onViewMatchInfo: () => void;
  onDebugSocket: () => void;
  onPlayGame: () => void;
}

// 채팅 관련 타입 정의
export interface ChatMessage {
  user_id: string;
  username: string;
  message: string;
  lobby_id: string;
  timestamp: string;
}

export interface TypingUser {
  user_id: string;
  username: string;
  lobby_id: string;
}

export interface ChatError {
  error: string;
}

export interface UserConnectionEvent {
  user_id: string;
  lobby_id: string;
  message: string;
  username?: string;
}

// 채팅 소켓 이벤트 핸들러 타입
export interface ChatSocketEventHandlers {
  onChatMessage: (message: ChatMessage) => void;
  onUserConnected: (event: UserConnectionEvent) => void;
  onUserDisconnected: (event: UserConnectionEvent) => void;
  onTyping: (user: TypingUser) => void;
  onStopTyping: (user: TypingUser) => void;
  onConnectionStatusChange: (connected: boolean, transport?: string) => void;
  onError: (error: string) => void;
}
