const express = require('express');
const router = express.Router();
const { getRouteInfoWithKakao } = require('../routeController');  // getRouteInfoWithKakao 가져오기

// GET 요청 처리 (브라우저에서 접근할 수 있도록)
router.get('/route-info', (req, res) => {
  // GET 요청에 대한 처리 로직을 여기에 추가
  res.json({ message: 'GET method is working for /api/route-info' });
});

// POST 요청 처리
router.post('/route-info', (req, res) => {
  console.log('Received POST request:', req.body);  // 요청 본문 확인
  getRouteInfoWithKakao(req, res);  // getRouteInfoWithKakao 함수 호출
});

module.exports = router;  // 라우터 내보내기
