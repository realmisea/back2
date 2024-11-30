require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routeRoutes = require('./controllers/routes/routeRoutes');  // 라우트 파일 경로 조정

const app = express();

// JSON 요청 바디 파싱
app.use(express.json());

// CORS 설정
app.use(
    cors({
        origin: [
            'https://localhost:5173',
            'http://localhost:5173',
            'https://front-end-j1f4.vercel.app',
            // 'https://localhost:3000',
            // 'https://fierce-jerrilee-realmisea-3853df29.koyeb.app',
        ],
        methods: ['GET', 'POST', 'OPTIONS'], // 허용 HTTP 메서드
        credentials: true, // 인증 정보 포함 허용
    })
);

// 기본 라우트
app.get('/', (req, res) => {
    res.send('Welcome to the backend API!');
});

// API 라우트
app.use('/api', routeRoutes);  // /api 경로로 라우트 연결

// 테스트 및 헬스체크 라우트
app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route works!' });
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

module.exports = app;  // Express 앱 내보내기
