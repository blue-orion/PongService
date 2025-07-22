class WebSocketManager {
  constructor() {
    this.gameNamespace = null;
    this.lobbyNamespace = null;
    this.friendNamespace = null;
    this.userSockets = new Map(); // key: userId, value: { game: socket, lobby: socket, friend: socket }
  }

  // 네임스페이스 등록
  registerNamespace(type, namespace) {
    switch (type) {
      case "game":
        this.gameNamespace = namespace;
        break;
      case "lobby":
        this.lobbyNamespace = namespace;
        break;
      case "friend":
        this.friendNamespace = namespace;
        break;
      default:
        console.warn(`Unknown namespace type: ${type}`);
    }
    console.log(`Registered ${type} namespace`);
  }

  // 네임스페이스 접근 메서드들
  getGameNamespace() {
    return this.gameNamespace;
  }

  getLobbyNamespace() {
    return this.lobbyNamespace;
  }

  getFriendNamespace() {
    return this.friendNamespace;
  }

  // 사용자 소켓 등록
  addUserSocket(userId, type, socket) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)[type] = socket;
    console.log(`User ${userId} connected to ${type} namespace`);
    // console.log(this.userSockets);
  }

  // 사용자 소켓 제거
  removeUserSocket(userId, type) {
    if (this.userSockets.has(userId)) {
      delete this.userSockets.get(userId)[type];

      // 모든 소켓이 제거되면 사용자 자체를 제거
      if (Object.keys(this.userSockets.get(userId)).length === 0) {
        this.userSockets.delete(userId);
      }
    }
    console.log(`User ${userId} disconnected from ${type} namespace`);
  }

  // 네임스페이스에 메시지 브로드캐스트
  sendToNamespace(namespace, event, message) {
    if (namespace) {
      namespace.emit(event, message);
      return true;
    }
    return false;
  }

  // 특정 소켓에 메시지 전송
  sendToSocket(namespace, socketId, event, message) {
    if (namespace) {
      const socket = namespace.sockets.get(socketId);
      if (socket) {
        socket.emit(event, message);
        return true;
      }
    }
    return false;
  }

  // 특정 사용자에게 메시지 전송 (모든 네임스페이스)
  sendToUser(userId, event, message) {
    const userSocketInfo = this.userSockets.get(userId);
    if (!userSocketInfo) return false;

    let sent = false;
    Object.values(userSocketInfo).forEach((socket) => {
      if (socket) {
        socket.emit(event, message);
        sent = true;
      }
    });
    return sent;
  }

  // 네임스페이스 내 특정 사용자에게 메시지 전송
  sendToNamespaceUser(namespace, userId, event, message) {
    if (namespace) {
      // Socket.IO에서는 소켓 ID로 찾아야 함
      const userSocketInfo = this.userSockets.get(userId);
      // console.log(userSocketInfo);
      if (userSocketInfo) {
        // 해당 네임스페이스의 소켓 찾기
        const socket = userSocketInfo[namespace];
        if (socket) {
          socket.emit(event, message);
          console.log(`Sent message to user ${userId} in ${namespace} namespace:`, message);
          return true;
        }
      }
    }
    return false;
  }

  sendToNamespaceUsers(namespace, userId1, userId2, event, message) {
    this.sendToNamespaceUser(namespace, userId1, event, message);
    this.sendToNamespaceUser(namespace, userId2, event, message);
  }

  // 특정 사용자의 특정 네임스페이스에 메시지 전송
  sendToUserInNamespace(userId, namespaceType, event, message) {
    const userSocketInfo = this.userSockets.get(userId);
    if (userSocketInfo && userSocketInfo[namespaceType]) {
      userSocketInfo[namespaceType].emit(event, message);
      return true;
    }
    return false;
  }

  // 네임스페이스 간 메시지 전송
  sendCrossNamespace(fromType, toType, userId, event, message) {
    console.log(`Sending message from ${fromType} to ${toType} for user ${userId}`);
    return this.sendToUserInNamespace(userId, toType, event, message);
  }

  // 타입별 브로드캐스트
  broadcastToType(type, event, message) {
    const namespace = this.getNamespaceByType(type);
    if (namespace) {
      namespace.emit(event, message);
      return true;
    }
    return false;
  }

  // 타입으로 네임스페이스 가져오기
  getNamespaceByType(type) {
    switch (type) {
      case "game":
        return this.gameNamespace;
      case "lobby":
        return this.lobbyNamespace;
      case "friend":
        return this.friendNamespace;
      default:
        return null;
    }
  }

  // 네임스페이스로 타입 가져오기
  getNamespaceType(socket) {
    if (socket === this.gameNamespace) return "game";
    if (socket === this.lobbyNamespace) return "lobby";
    if (socket === this.friendNamespace) return "friend";
    return null;
  }

  // 특정 타입의 클라이언트 가져오기
  getClient(type, userId) {
    const userSocketInfo = this.userSockets.get(userId);
    if (userSocketInfo && userSocketInfo[type]) {
      return userSocketInfo[type];
    }
    return null;
  }

  // 사용자별 소켓 정보 가져오기
  getUserSockets(userId) {
    const userSocketInfo = this.userSockets.get(userId);
    return userSocketInfo ? Object.values(userSocketInfo).filter((socket) => socket) : [];
  }

  // 연결된 모든 사용자 정보
  getConnectedUsers() {
    const users = {};
    this.userSockets.forEach((sockets, userId) => {
      users[userId] = Object.keys(sockets);
    });
    return users;
  }
}

export default new WebSocketManager();
