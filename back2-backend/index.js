require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const moment = require('moment');

const app = express();

// CORS 미들웨어 사용
app.use(cors());
app.use(express.json()); // JSON 요청 본문을 파싱하기 위한 미들웨어

// 기상청 API로 날씨 정보를 요청하는 함수
async function fetchWeather(nx, ny) {
    const baseDate = getBaseDate();
    const baseTime = getBaseTime();

    try {
        const response = await axios.get(`http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`, {
            params: {
                serviceKey: process.env.KMA_API_KEY,
                baseDate: baseDate,
                baseTime: baseTime,
                nx: nx,
                ny: ny,
                dataType: 'XML'
            }
        });

        const weatherData = parseWeatherData(response.data);
        return weatherData; 
    } catch (error) {
        console.error('기상청 API 요청 오류:', error);
        return [];
    }
}

// 날짜와 시간 설정 함수
function getBaseDate() {
    // 기존 코드 구현
}
function getBaseTime() {
    // 기존 코드 구현
}

// 날씨 데이터 파싱 함수
function parseWeatherData(data) {
    // 기존 코드 구현
}

// 출발지와 도착지 사이의 날씨 정보를 가져오는 함수
async function getRouteWeather(req, res) {
    const { start, end } = req.query;

    try {
        const startCoordinates = await getCoordinates(start); // 출발지 좌표 가져오기
        const endCoordinates = await getCoordinates(end); // 목적지 좌표 가져오기

        // 1/3 및 2/3 지점 좌표 계산
        const midPoint1 = {
            nx: (startCoordinates.nx + endCoordinates.nx) / 3,
            ny: (startCoordinates.ny + endCoordinates.ny) / 3,
        };
        const midPoint2 = {
            nx: (startCoordinates.nx * 2 + endCoordinates.nx) / 3,
            ny: (startCoordinates.ny * 2 + endCoordinates.ny) / 3,
        };

        // 각 중간 지점의 날씨 정보 가져오기
        const weather1 = await fetchWeather(midPoint1.nx, midPoint1.ny);
        const weather2 = await fetchWeather(midPoint2.nx, midPoint2.ny);

        res.status(200).json({
            restAreas: [
                { name: '1/3 지점', coordinates: midPoint1, weather: weather1 },
                { name: '2/3 지점', coordinates: midPoint2, weather: weather2 }
            ]
        });
    } catch (error) {
        console.error('경로 날씨 정보 가져오기 오류:', error);
        res.status(500).json({ message: '경로 날씨 정보 가져오기 실패', error: error.message });
    }
}

// 출발지와 목적지의 좌표를 가져오는 함수
async function getCoordinates(location) {
    try {
        const response = await axios.get('https://dapi.kakao.com/v2/local/search/keyword.json', {
            params: { query: location },
            headers: {
                Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
            }
        });

        const { x: nx, y: ny } = response.data.documents[0]; // 첫 번째 검색 결과의 좌표 사용
        return { nx, ny };
    } catch (error) {
        console.error('좌표 검색 오류:', error);
        throw error; // 오류 발생 시 예외 던짐
    }
}

// 경로 날씨 정보를 가져오는 API 라우트 추가
app.get('/api/weather', getRouteWeather);

// 서버 포트 설정
const PORT = 5173;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
