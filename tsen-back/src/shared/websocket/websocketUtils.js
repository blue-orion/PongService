import websocketManager from "#shared/websocket/websocketManager.js";

export const websocketUtils = {
  // 특정 사용자에게 메시지 전송
  sendToUser: (type, userId, event, message) => {
    return websocketManager.sendToUserInNamespace(userId, type, event, message);
  },

  // 네임스페이스 간 메시지 전송
  sendCrossNamespace: (fromType, toType, userId, event, message) => {
    return websocketManager.sendCrossNamespace(fromType, toType, userId, event, message);
  },

  // 타입별 브로드캐스트
  broadcastToType: (type, event, message) => {
    return websocketManager.broadcastToType(type, event, message);
  },

  // 연결된 사용자 확인
  getConnectedUsers: () => {
    return websocketManager.getConnectedUsers();
  },

  // 특정 사용자의 네임스페이스 확인
  getUserNamespaces: (userId) => {
    const userSockets = websocketManager.userSockets.get(userId);
    return userSockets ? Object.keys(userSockets) : [];
  },

  // 특정 사용자가 특정 네임스페이스에 연결되어 있는지 확인
  isUserConnectedToNamespace: (userId, type) => {
    const userSockets = websocketManager.userSockets.get(userId);
    return userSockets && userSockets[type] ? true : false;
  },

  // 특정 네임스페이스의 연결된 사용자 수 확인
  getNamespaceUserCount: (type) => {
    let count = 0;
    websocketManager.userSockets.forEach((sockets) => {
      if (sockets[type]) {
        count++;
      }
    });
    return count;
  },

  // 모든 사용자에게 메시지 전송 (모든 네임스페이스)
  broadcastToAllUsers: (event, message) => {
    let sent = false;
    ["game", "lobby", "friend"].forEach((type) => {
      if (websocketManager.broadcastToType(type, event, message)) {
        sent = true;
      }
    });
    return sent;
  },

  // 특정 사용자의 모든 네임스페이스에 메시지 전송
  sendToUserAllNamespaces: (userId, event, message) => {
    const userSockets = websocketManager.userSockets.get(userId);
    if (!userSockets) return false;

    let sent = false;
    Object.keys(userSockets).forEach((type) => {
      if (websocketManager.sendToUserInNamespace(userId, type, event, message)) {
        sent = true;
      }
    });
    return sent;
  },
};

export default websocketUtils;
