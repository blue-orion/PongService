import websocketManager from "#shared/websocket/websocketManager.js";

import { LobbyController } from "#domains/lobby/controller/lobbyController.js";

const websocketHandlers = {
  gameWebSocketHandler: (io) => {
    const gameNamespace = io.of("/ws/game"); // 게임 네임스페이스 생성
    websocketManager.registerNamespace("game", gameNamespace);

    gameNamespace.on("connection", (socket) => {
      const userId = socket.handshake.auth["userId"]; // 클라이언트에서 보낸 사용자 ID
      console.log(`Game WebSocket connected: ${userId}`);

      // 사용자 소켓 등록
      websocketManager.addUserSocket(userId, "game", socket);

      socket.on("disconnect", () => {
        websocketManager.removeUserSocket(userId, "game");
        console.log(`Game WebSocket disconnected: ${userId}`);
      });
    });
  },

  lobbyWebSocketHandler: (io) => {
    const lobbyNamespace = io.of("/ws/lobby"); // 로비 네임스페이스 생성
    websocketManager.registerNamespace("lobby", lobbyNamespace);

    lobbyNamespace.on("connection", (socket) => {
      const userId = socket.handshake.query["user-id"];
      const lobbyId = socket.handshake.query["lobby-id"];

      console.log(`Lobby WebSocket connected: ${userId} (lobby: ${lobbyId})`);

      if (lobbyId) {
        socket.join(`lobby-${lobbyId}`);
        console.log(`User ${userId} joined room lobby-${lobbyId}`);
      }

      socket.on("disconnect", () => {
        websocketManager.removeUserSocket(userId, "lobby");
        console.log(`Lobby WebSocket disconnected: ${userId}`);
      });
    });
  },

  friendWebSocketHandler: (io) => {
    const friendNamespace = io.of("/ws/friend"); // 친구 네임스페이스 생성
    websocketManager.registerNamespace("friend", friendNamespace);

    friendNamespace.on("connection", (socket) => {
      const userId = socket.handshake.auth["userId"];
      console.log(`Friend WebSocket connected: ${userId}`);

      // 사용자 소켓 등록
      websocketManager.addUserSocket(userId, "friend", socket);
      // socket.on("friend_status", (data) => {

      // })

      socket.on("disconnect", () => {
        websocketManager.removeUserSocket(userId, "friend");
        console.log(`Friend WebSocket disconnected: ${userId}`);
      });
    });
  },
};

export default websocketHandlers;
