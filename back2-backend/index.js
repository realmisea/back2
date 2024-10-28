const express = require('express');
const axios = require('axios');
const cors = require('cors'); // CORS 모듈 추가
require('dotenv').config();

const app = express();

// CORS 미들웨어 사용
app.use(cors());

console.log('KAKAO_REST_API_KEY:', process.env.KAKAO_REST_API_KEY); // API 키 확인

// 카카오맵 장소 검색 API 라우트
app.get('/location-search', async (req, res) => {
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            params: { query: '서울' }, // 검색어
            headers: { 
                Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`, // 환경 변수에서 API 키 가져오기
                KA: '5bf321f40e65b9fc5731efbaec7c96cf', // 새로운 KA 헤더 값으로 업데이트
                os: 'ios', // 플랫폼 정보
                origin: 'http://localhost:5173' // 요청의 출처 URL
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error('API 요청 오류:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: '카카오 API 요청 실패', error: error.message });
    }
});

const PORT = 5173;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
