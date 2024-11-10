const express = require('express');
const routeRoutes = require('./controllers/routes/routeRoutes');  // 라우터 불러오기

const app = express();
const PORT = process.env.PORT || 5173;

const cors = require('cors');
app.use(cors());  // 모든 출처에서의 요청을 허용


// 루트 경로에 대한 JSON 응답 처리
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the backend API!' });  // 원하는 JSON 응답
});

app.use(express.json());  // JSON 바디 파싱
app.use('/api', routeRoutes);  // '/api' 경로에서 routeRoutes로 연결

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

app.get('/api/test', (req, res) => {
    res.json({ message: 'Test route works!' });
});

// 배포 체크용 엔드포인트
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
