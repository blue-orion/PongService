const http = require('http');
const fs = require('fs');
const path = require('path');

// MIME 타입 매핑
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// HTTP 서버 생성
const server = http.createServer((req, res) => {
  // URL 파싱
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'public', filePath);
  
  // 파일 확장자 가져오기
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';
  
  // 파일 읽기
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // 404 에러 페이지
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
            <head><title>404 Not Found</title></head>
            <body>
              <h1>404 - 페이지를 찾을 수 없습니다</h1>
              <p>요청한 파일: ${req.url}</p>
              <a href="/">홈으로 돌아가기</a>
            </body>
          </html>
        `);
      } else {
        // 500 서버 에러
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <html>
            <head><title>Server Error</title></head>
            <body>
              <h1>500 - 서버 에러</h1>
              <p>서버에서 오류가 발생했습니다.</p>
            </body>
          </html>
        `);
      }
    } else {
      // 성공적으로 파일 서빙
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache'
      });
      res.end(content, 'utf-8');
    }
  });
});

// 서버 시작
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log('정적 파일은 public 폴더에서 서빙됩니다');
});
