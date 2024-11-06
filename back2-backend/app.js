// app.js
const express = require('express');
const routeRoutes = require('./controllers/routes/routeRoutes');  // 라우터 불러오기

const app = express();
const PORT = process.env.PORT || 5173;

app.use(express.json());  // JSON 바디 파싱
app.use('/api', routeRoutes);  // '/api' 경로에서 routeRoutes로 연결

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
