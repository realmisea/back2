// app.js
const express = require('express');
const routeRoutes = require('./controllers/routes/routeRoutes');  // 라우터 불러오기

const app = express();
const PORT = process.env.PORT || 5174;

// PORT 값을 로그로 출력
console.log(`Using port: ${process.env.PORT || 5174}`);

// 루트 경로에 대한 JSON 응답 처리
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the backend API!' });  // 원하는 JSON 응답
});

// JSON 바디 파싱
app.use(express.json());

// '/api' 경로에서 routeRoutes로 연결
app.use('/api', routeRoutes);

// 배포 체크용 엔드포인트
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// app 객체를 내보내기
module.exports = app;
