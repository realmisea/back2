// index.js
const app = require('./app');  // app.js에서 내보낸 app 객체를 가져옴

const PORT = process.env.PORT || 5173; // Koyeb에서 포트 자동 설정

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
