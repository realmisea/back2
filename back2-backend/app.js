const express = require('express');
const cors = require('cors');  // cors 모듈 가져오기
const routeRoutes = require('./controllers/routes/routeRoutes');

const app = express();

//app.use(cors()); // 모든 도메인에서의 요청 허용

// 또는 특정 도메인만 허용하려면:
app.use(
      cors({
        origin: [
          'http://localhost:5173', // 웹 로컬 링크 (포트 번호는 사용하는 환경에 맞게)
          'http://localhost:3000', // 서버 로컬 링크 (포트 번호는 사용하는 환경에 맞게)
          'https://fierce-jerrilee-realmisea-3853df29.koyeb.app',
        ],
        credentials: true, // 필요한 경우, 쿠키 전달을 위해 설정
      })
    );

// 루트 경로에 대한 JSON 응답 처리
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the backend API!' });
});

app.use(express.json());  // JSON 바디 파싱
app.use('/api', routeRoutes);  // '/api' 경로에서 routeRoutes로 연결

app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route works!' });
});

// 배포 체크용 엔드포인트
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

module.exports = app;
