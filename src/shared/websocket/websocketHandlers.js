import { LobbyController } from "#domains/lobby/controller/lobbyController.js";

const websocketHandlers = {
  gameWebSocketHandler: (io) => {
    const gameNamespace = io.of("/game"); // 게임 네임스페이스 생성

    gameNamespace.on("connection", (socket) => {
      const userId = socket.handshake.query["user-id"]; // 클라이언트에서 보낸 사용자 ID
      console.log(`Game WebSocket connected: ${userId}`);

      socket.on("disconnect", () => {
        console.log(`Game WebSocket disconnected: ${userId}`);
      });
    });
  },

  lobbyWebSocketHandler: (io) => {
    const lobbyNamespace = io.of("/lobby"); // 로비 네임스페이스 생성
    // const lobbyController = new LobbyController();

    lobbyNamespace.on("connection", (socket) => {
      const userId = socket.handshake.query["user-id"];
      const lobbyId = socket.handshake.query["lobby-id"];

      console.log(`Lobby WebSocket connected: ${userId} (lobby: ${lobbyId})`);

      if (lobbyId) {
        socket.join(`lobby-${lobbyId}`);
        console.log(`User ${userId} joined room lobby-${lobbyId}`);
      }

      socket.on("disconnect", () => {
        console.log(`Lobby WebSocket disconnected: ${userId}`);
      });
    });
  },
};

export default websocketHandlers;
