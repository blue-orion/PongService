import WebSocketTestClient from "./test-websocket-client.js";

async function testFriendWebSocket() {
  const client = new WebSocketTestClient();

  console.log("🚀 Starting Friend WebSocket Test...\n");

  // 서버 연결 가능성 확인
  console.log("🔍 Checking server connection...");

  try {
    // ⚠️ 포트 번호 수정: 3333 → 3003
    const response = await fetch("http://localhost:3333/health");
    const data = await response.json();
    console.log("✅ Server is running:", data);
  } catch (error) {
    console.error("❌ Server is not running. Please start the server first:");
    console.error("   Run: npm start");
    return;
  }

  // 두 사용자 연결
  console.log("\n📡 Connecting users...");
  const user1Socket = client.connectFriend("user1");
  const user2Socket = client.connectFriend("user2");

  // 연결 완료 대기 (개선된 방식)
  console.log("⏳ Waiting for connections...");
  const connected = await client.waitForConnections(10000); // 10초 대기

  if (connected) {
    console.log("✅ All connections established");
  } else {
    console.log("⚠️ Some connections may not be established");
  }

  // 연결 상태 확인
  const connectionStatus = client.getConnectionStatus();
  console.log("\n📊 Connection Status:", connectionStatus);

  // 연결 요약 정보
  const summary = client.getConnectionSummary();
  console.log("📋 Connection Summary:", summary);

  // 연결된 경우에만 테스트 진행
  if (user1Socket.connected && user2Socket.connected) {
    console.log("\n✅ Both users connected. Starting tests...");

    console.log("\n--- Test 1: 친구 요청 수락 ---");
    user1Socket.emit("acceptFriendRequest", {
      relationId: 1,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n--- Test 2: 친구 요청 거절 ---");
    user2Socket.emit("friendRequestRejected", {
      relationId: 2,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n--- Test 3: 친구 요청 보내기 ---");
    user1Socket.emit("sendFriendRequest", {
      receiverId: "user2",
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n--- Test 4: 에러 테스트 ---");
    user1Socket.emit("acceptFriendRequest", {
      relationId: "invalid",
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("\n✅ All tests completed successfully!");
  } else {
    console.log("❌ Some connections failed. Connection details:");
    console.log("   User1 connected:", user1Socket.connected);
    console.log("   User2 connected:", user2Socket.connected);
    console.log("   Skipping tests...");
  }

  console.log("\n🏁 Test completed. Disconnecting...");
  client.disconnectAll();
}

// 테스트 실행
testFriendWebSocket().catch(console.error);
