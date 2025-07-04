// src/domains/game/gameRoutes.js
import { gameController } from './controller/gameController.js'; 

export default async function gameRoutes(fastify, opts) {
	fastify.get('/ws/game', { websocket: true }, (conn /* WebSocketStream */, req) => {
		const socket = conn.socket;
	
		console.log('🔌 클라이언트 연결됨');
		
		socket.interval = setInterval(() => {
			socket.send(JSON.stringify(gameController.getState()));
		}, 1000);

		// 서버 → 클라이언트 환영 메시지 전송
		socket.send(JSON.stringify({
			type: 'welcome',
			msg: '👋 서버에서 보낸 환영 메시지입니다!',
		}));
	
		// 클라이언트 → 서버 메시지 수신
		socket.on('message', (raw) => {
			console.log('📨 클라이언트 메시지:', raw.toString());
		});
	
		socket.on('close', () => {
			console.log('❌ 클라이언트 연결 종료');
			clearInterval(socket.interval);
		});
	});
}
