// src/domains/game/gameRoutes.js
import { gameController } from './controller/gameController.js'; 
import { loadGameState } from './repo/gameRepo.js';

export default async function gameRoutes(fastify, opts) {
	const io = fastify.io;
	const gameNameSpace = io.of("/ws/game");

	gameNameSpace.on('connection', (socket) => {
		console.log('클라이언트 연결됨.');
		console.log(socket.id);

		// 서버 → 클라이언트 환영 메시지 전송
		socket.emit("message", {
			type: 'welcome',
			msg: '👋 서버에서 보낸 환영 메시지입니다!',
		});

		// 클라이언트로부터 메세지 수신
		socket.on('message', (raw) => {
			console.log("클라이언트 메세지", raw);
			gameController.handleMessage(socket, raw);
		})

		// 클라이언트 연결 종료
		socket.on('disconnect', async () => {
			console.log(JSON.stringify(await loadGameState()));
			console.log('클라이언트 연결 종료');
		})
	});
}
