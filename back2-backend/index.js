const https = require('https');
const fs = require('fs');
const app = require('./app'); // Express 앱 가져오기
// require('dotenv').config();

const PORT = process.env.PORT || 5173;
console.log(PORT);

// HTTPS 인증서 경로
// const httpsOptions = {
//   key: fs.readFileSync('./cert/18.219.118.230-key.pem'), // mkcert 생성 인증서
//   cert: fs.readFileSync('./cert/18.219.118.230.pem'),
// };

// const httpsOptions = {
//     key: fs.readFileSync('./cert/localhost-key.pem'), // mkcert 생성 인증서
//     cert: fs.readFileSync('./cert/localhost.pem'),
//   };

// HTTPS 서버 실행
// https.createServer(httpsOptions, app).listen(PORT, () => {
//   console.log(`HTTPS server running at https://localhost:${PORT}`);
// });
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
})