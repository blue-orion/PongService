const websocketManager = {
  sendToNamespace(namespace, event, message) {
    namespace.emit(event, message); // 네임스페이스에 메시지 브로드캐스트
  },

  sendToSocket(namespace, socketId, event, message) {
    const socket = namespace.sockets.get(socketId);
    if (socket) {
      socket.emit(event, message); // 특정 소켓에 메시지 전송
    }
  },

  sendToUser(userId, message) {
    const userSockets = this.getUserSockets(userId);
    userSockets.forEach((socket) => {
      socket.emit("private_message", message);
    });
  },

  //   getUserSockets(userId) {
  //     // 사용자 ID에 해당하는 소켓을 반환하는 로직
  //     // 예시: return this.sockets.filter(socket => socket.userId === userId);
  //     return []; // 실제 구현 필요
  //   },

  broadcastToType(type, message) {
    const namespace = this.getNamespaceByType(type);
    if (namespace) {
      namespace.emit("broadcast", message);
    }
  },

  getNamespaceByType(type) {
    switch (type) {
      case "game":
        return this.gameNamespace;
      case "lobby":
        return this.lobbyNamespace;
      default:
        return null;
    }
  },

  getClient(type, userId) {
    const namespace = this.getNamespaceByType(type);
    if (namespace) {
      return namespace.sockets.get(userId); // 네임스페이스에서 사용자 ID에 해당하는 소켓 반환
    }
    return null; // 네임스페이스가 없거나 소켓이 없는 경우
  },
};

export default websocketManager;
