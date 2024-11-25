const https = require('https');
const fs = require('fs');
const app = require('./app'); // Express 앱 가져오기

const PORT = process.env.PORT || 5173;
console.log(PORT);

// HTTPS 인증서 경로 (필요 시 사용)
// const httpsOptions = {
//   key: fs.readFileSync('./cert/18.219.118.230-key.pem'), // mkcert 생성 인증서
//   cert: fs.readFileSync('./cert/18.219.118.230.pem'),
// };

// const httpsOptions = {
//     key: fs.readFileSync('./cert/localhost-key.pem'), // mkcert 생성 인증서
//     cert: fs.readFileSync('./cert/localhost.pem'),
// };

// HTTPS 서버 실행 (이 코드는 HTTPS로 실행하려면 주석 해제)
// https.createServer(httpsOptions, app).listen(PORT, () => {
//   console.log(`HTTPS server running at https://localhost:${PORT}`);
// });

// HTTP 서버 실행
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
