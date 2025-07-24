// 로비 관련 공통 타입 정의

export interface LobbyData {
  id: number;
  name: string;
  tournamentId: number;
  maxPlayers: number;
  status: "waiting" | "playing";
  statusText: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  tournament: any;
  players: LobbyPlayer[];
  currentPlayers: number;
  host: string;
  isHost: boolean;
  isPlayerReady: boolean;
  allPlayersReady: boolean;
  matchData?: MatchData;
}

export interface LobbyPlayer {
  user_id: number;
  is_ready: boolean;
  is_leader: boolean;
  enabled: boolean;
  user?: {
    id: number;
    username: string;
    nickname?: string;
    profile_image?: string;
  };
}

export interface MatchData {
  lobby_id: number;
  tournament_id: number;
  tournament_status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  current_round: number;
  total_rounds: number;
  matches: MatchInfo[];
  winner?: PlayerInfo;
}

export interface MatchInfo {
  game_id: number;
  round: number;
  game_status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  left_player: PlayerInfo;
  right_player: PlayerInfo;
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

export interface CreateLobbyRequest {
  name: string;
  max_players: number;
  user_id: number;
}

export interface CreateLobbyResponse {
  data: LobbyData;
  message: string;
}

// 소켓 이벤트 관련 타입
export interface SocketEventHandlers {
  onReadyStateChange: (data: ReadyStateChangeEvent) => void;
  onPlayerChange: (data: PlayerChangeEvent) => void;
  onLobbyUpdate: (data: LobbyUpdateEvent) => void;
  onLeadershipChange: (data: LeadershipChangeEvent) => void;
  onPlayerLeft: (data: PlayerLeftEvent) => void;
  onPlayerJoined: (data: PlayerJoinedEvent) => void;
  onMatchCreated: (data: MatchCreatedEvent) => void;
  onConnectionStatusChange: (isConnected: boolean, transport?: string) => void;
  onGameStarted: (data: GameStartedEvent) => void;
}

export interface GameStartedEvent {
  user_id: number;
  tournament_id: number;
  game_id: number;
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

export interface MatchCreatedEvent extends MatchData {
  round: number;
  total_matches: number;
  games?: any[];
  message?: string;
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
