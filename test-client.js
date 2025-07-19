import WebSocketTestClient from "./test-websocket-client.js";

async function testSingleUserWebSocket() {
  const client = new WebSocketTestClient();

  console.log("🚀 Starting Single User WebSocket Test...\n");

  // 서버 연결 확인
  console.log("🔍 Checking server connection...");
  try {
    const response = await fetch("http://localhost:3333/health");
    const data = await response.json();
    console.log("✅ Server is running:", data);
  } catch (error) {
    console.error("❌ Server is not running. Please start the server first:");
    console.error("   Run: npm start");
    return;
  }

  // 한 명의 사용자 연결
  console.log("\n📡 Connecting single user...");
  const userSocket = client.connectFriend(1);

  // 서버 응답 리스너 설정
  userSocket.on("friend_request_accepted", (data) => {
    console.log("🎉 Received friend_request_accepted:", data);
  });

  userSocket.on("friend_request_received", (data) => {
    console.log("🎉 Received friend_request_received:", data);
  });

  userSocket.on("error", (error) => {
    console.log("❌ Received error response:", error);
  });

  // 연결 대기
  console.log("⏳ Waiting for connection...");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  if (userSocket.connected) {
    console.log("✅ User connected successfully!");
    console.log(`   Socket ID: ${userSocket.id}`);

    console.log("\n--- Test 1: 친구 요청 수락 (가상 데이터) ---");
    userSocket.emit("acceptFriendRequest", {
      payload: {
        relationId: 1,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n--- Test 2: 친구 요청 거절 (가상 데이터) ---");
    userSocket.emit("friendRequestRejected", {
      payload: {
        relationId: 1,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n--- Test 3: 친구 요청 보내기 (가상 수신자) ---");
    userSocket.emit("sendFriendRequest", {
      payload: {
        senderId: 1,
        receiverId: 2,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // console.log("\n--- Test 4: 잘못된 데이터 테스트 ---");
    // userSocket.emit("acceptFriendRequest", {
    //   payload: {
    //     relationId: "invalid-id",
    //   },
    // });

    // await new Promise((resolve) => setTimeout(resolve, 2000));

    // console.log("\n--- Test 5: 빈 데이터 테스트 ---");
    // userSocket.emit("acceptFriendRequest", {});

    // await new Promise((resolve) => setTimeout(resolve, 2000));

    // console.log("\n--- Test 6: 존재하지 않는 이벤트 테스트 ---");
    // userSocket.emit("nonExistentEvent", {
    //   data: "test",
    // });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\n✅ All single user tests completed!");
  } else {
    console.log("❌ Connection failed!");
  }

  console.log("\n🏁 Test completed. Disconnecting...");
  client.disconnectAll();
}

testSingleUserWebSocket().catch(console.error);
