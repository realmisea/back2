const https = require('https');
const fs = require('fs');
const app = require('./app'); // Express 앱 가져오기
require('dotenv').config();

const PORT = process.env.PORT || 443; // HTTPS 기본 포트 사용

// HTTPS 인증서 경로
const httpsOptions = {
  key: fs.readFileSync('./localhost-key.pem'), // mkcert 생성 인증서
  cert: fs.readFileSync('./localhost.pem'),
};

// HTTPS 서버 실행
https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`HTTPS server running at https://localhost:${PORT}`);
});