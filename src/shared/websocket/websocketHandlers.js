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

    lobbyNamespace.on("connection", (socket) => {
      const userId = socket.handshake.query["user-id"];
      console.log(`Lobby WebSocket connected: ${userId}`);

      socket.on("disconnect", () => {
        console.log(`Lobby WebSocket disconnected: ${userId}`);
      });
    });
  },

  friendWebSocketHandler: (io) => {
    const friendNamespace = io.of("/friend"); // 친구 네임스페이스 생성

    friendNamespace.on("connection", (socket) => {
      const userId = socket.handshake.query["user-id"];
      console.log(`Friend WebSocket connected: ${userId}`);

      socket.on("disconnect", () => {
        console.log(`Friend WebSocket disconnected: ${userId}`);
      });
    });
  },
};

export default websocketHandlers;
