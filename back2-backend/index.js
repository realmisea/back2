const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS 미들웨어 사용
app.use(cors());

// 카카오맵 장소 검색 API 라우트
app.get('/location-search', async (req, res) => {
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            params: { query: '서울' },
            headers: {
                Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
                KA: '5bf321f40e65b9fc5731efbaec7c96cf',
                os: 'ios',
                origin: 'http://localhost:5173'
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error('API 요청 오류:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: '카카오 API 요청 실패', error: error.message });
    }
});

// 한국도로공사 휴게소 정보 API 라우트
app.get('/rest-area', async (req, res) => {
    try {
        const response = await axios.get('https://data.ex.co.kr/openapi/locationinfo/locationinfoRest', {
            params: {
                key: process.env.HIGHWAY_API_KEY, // 새로운 키 사용
                type: 'json',  // JSON 형식으로 응답 받기
                numOfRows: 5,  // 한 페이지에 5개 출력
                pageNo: 1      // 첫 페이지 요청
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error('휴게소 API 요청 오류:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: '휴게소 API 요청 실패', error: error.message });
    }
});

const PORT = 5173;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

console.log('HIGHWAY_API_KEY:', process.env.HIGHWAY_API_KEY); // 환경 변수 확인용
