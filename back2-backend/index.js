const express = require('express');
const weatherRoutes = require('./controllers/routes/weatherRoutes'); // 경로 수정

const app = express();
const PORT = process.env.PORT || 5173;

// JSON 파싱 미들웨어
app.use(express.json());

app.use('/weather', weatherRoutes);

// 기본 테스트 경로 
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
