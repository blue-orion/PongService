import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3003/ws/game');

ws.on('open', () => {
  console.log('✅ 연결 성공');
  ws.send('🖐️ 안녕 서버!');
});

ws.on('message', (msg) => {
  console.log('📨 받은 메시지:', msg.toString());
});

ws.on('close', () => {
  console.log('❌ 연결 종료');
});

ws.on('error', (err) => {
  console.error('❌ 오류 발생:', err.message);
});
