import websocketManager from "#shared/websocket/websocketManager.js";

export const sendToUser = (type, userId, message) => {
  const connection = websocketManager.getClient(type, userId);
  if (connection) {
    connection.socket.send(JSON.stringify(message));
  }
};

export const broadcastToType = (type, message) => {
  websocketManager.broadcastToType(type, message);
};
