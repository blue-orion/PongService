import { io } from "socket.io-client";

class WebSocketTestClient {
  constructor(serverUrl = "http://localhost:3333") {
    this.serverUrl = serverUrl;
    this.sockets = {};
  }

  // 특정 네임스페이스에 연결
  connect(namespace, userId) {
    const socket = io(`${this.serverUrl}/${namespace}`, {
      auth: {
        userId: userId,
      },
      transports: ["websocket", "polling"], // polling도 허용
      timeout: 10000, // 연결 타임아웃 10초
      reconnection: true, // 재연결 허용
      reconnectionDelay: 1000, // 재연결 지연 시간
      reconnectionAttempts: 5, // 재연결 시도 횟수
      forceNew: true, // 새로운 연결 강제
    });

    this.sockets[`${namespace}_${userId}`] = socket;

    // 연결 이벤트
    socket.on("connect", () => {
      console.log(`✅ Connected to ${namespace} namespace as user ${userId}`);
      console.log(`   Socket ID: ${socket.id}`);
    });

    // 연결 해제 이벤트
    socket.on("disconnect", (reason) => {
      console.log(`❌ Disconnected from ${namespace} namespace as user ${userId}`);
      console.log(`   Reason: ${reason}`);
    });

    // 에러 이벤트
    socket.on("connect_error", (error) => {
      console.log(`🚨 Connection error in ${namespace} namespace for user ${userId}:`, error.message);
      console.log(`   Error type: ${error.type}`);
      console.log(`   Error description: ${error.description}`);
    });

    // 재연결 시도
    socket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Reconnected to ${namespace} namespace as user ${userId} (attempt ${attemptNumber})`);
    });

    // 재연결 실패
    socket.on("reconnect_failed", () => {
      console.log(`❌ Failed to reconnect to ${namespace} namespace as user ${userId}`);
    });

    return socket;
  }

  // 친구 네임스페이스 연결
  connectFriend(userId) {
    const socket = this.connect("ws/friend", userId);

    // 친구 요청 수신
    socket.on("friend_request", (data) => {
      console.log(`📬 Friend request received by user ${userId}:`, data);
    });

    // 친구 요청 수락 알림
    socket.on("friend_request_accepted", (data) => {
      console.log(`✅ Friend request accepted by user ${userId}:`, data);
    });

    // 친구 요청 거절 알림
    socket.on("friend_request_rejected", (data) => {
      console.log(`❌ Friend request rejected by user ${userId}:`, data);
    });

    // 친구 요청 받음 알림
    socket.on("friend_request_received", (data) => {
      console.log(`📨 Friend request received notification for user ${userId}:`, data);
    });

    // 에러 이벤트
    socket.on("error", (error) => {
      console.log(`🚨 Socket error for user ${userId}:`, error);
    });

    return socket;
  }

  // 게임 네임스페이스 연결
  connectGame(userId) {
    const socket = this.connect("ws/game", userId);

    // 게임 초대 수신
    socket.on("game_invitation", (data) => {
      console.log(`🎮 Game invitation received by user ${userId}:`, data);
    });

    return socket;
  }

  // 로비 네임스페이스 연결
  connectLobby(userId) {
    const socket = this.connect("ws/lobby", userId);

    // 로비 상태 업데이트
    socket.on("lobby_status_update", (data) => {
      console.log(`🏛️ Lobby status update received by user ${userId}:`, data);
    });

    return socket;
  }

  // 소켓 가져오기
  getSocket(namespace, userId) {
    return this.sockets[`${namespace}_${userId}`];
  }

  // 특정 소켓 연결 해제
  disconnect(namespace, userId) {
    const socket = this.sockets[`${namespace}_${userId}`];
    if (socket) {
      socket.disconnect();
      delete this.sockets[`${namespace}_${userId}`];
      console.log(`🔌 Disconnected ${namespace} socket for user ${userId}`);
    }
  }

  // 모든 소켓 연결 해제
  disconnectAll() {
    Object.entries(this.sockets).forEach(([key, socket]) => {
      socket.disconnect();
      console.log(`🔌 Disconnected socket: ${key}`);
    });
    this.sockets = {};
  }

  // ✅ 누락된 메서드 추가: 연결 상태 확인
  getConnectionStatus() {
    const status = {};
    Object.entries(this.sockets).forEach(([key, socket]) => {
      status[key] = {
        connected: socket.connected,
        id: socket.id || "not-connected",
      };
    });
    return status;
  }

  // 추가 유틸리티 메서드들

  // 연결된 소켓 수 확인
  getConnectedSocketCount() {
    return Object.values(this.sockets).filter((socket) => socket.connected).length;
  }

  // 특정 사용자의 연결 상태 확인
  isUserConnected(namespace, userId) {
    const socket = this.sockets[`${namespace}_${userId}`];
    return socket ? socket.connected : false;
  }

  // 모든 소켓이 연결되었는지 확인
  areAllSocketsConnected() {
    return Object.values(this.sockets).every((socket) => socket.connected);
  }

  // 연결 대기 (Promise 기반)
  async waitForConnections(timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (this.areAllSocketsConnected()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return false;
  }

  // 연결 요약 정보
  getConnectionSummary() {
    const total = Object.keys(this.sockets).length;
    const connected = this.getConnectedSocketCount();

    return {
      total,
      connected,
      disconnected: total - connected,
      allConnected: this.areAllSocketsConnected(),
    };
  }
}

export default WebSocketTestClient;
